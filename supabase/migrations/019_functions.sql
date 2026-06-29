-- 019: Database functions for transactional operations
-- These wrap multi-table updates that must be atomic.

-- Approve a badge application: sets badge_applications.status = 'approved'
-- AND writer_profiles.is_verified = true in one transaction.
create or replace function approve_badge_application(
  p_application_id uuid,
  p_reviewer_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
as $$
declare
  v_writer_id uuid;
begin
  select writer_id into v_writer_id
    from badge_applications
    where id = p_application_id and status = 'pending';

  if v_writer_id is null then
    raise exception 'Application not found or not pending';
  end if;

  update badge_applications
    set status = 'approved',
        reviewer_id = p_reviewer_id,
        review_notes = p_review_notes,
        decided_at = now()
    where id = p_application_id;

  update writer_profiles
    set is_verified = true,
        verified_at = now(),
        updated_at = now()
    where id = v_writer_id;
end;
$$;

-- Release escrow: moves transaction to 'released', credits writer wallet,
-- inserts wallet_transaction ledger entry. Called when client approves work.
create or replace function release_escrow(
  p_transaction_id uuid
)
returns void
language plpgsql
as $$
declare
  v_tx record;
  v_wallet_id uuid;
  v_new_balance numeric(12, 2);
begin
  select * into v_tx
    from transactions
    where id = p_transaction_id and status = 'held';

  if v_tx is null then
    raise exception 'Transaction not found or not in held status';
  end if;

  -- Update transaction status
  update transactions
    set status = 'released',
        released_at = now(),
        updated_at = now()
    where id = p_transaction_id;

  -- Get writer's wallet
  select id, balance_ngn into v_wallet_id, v_new_balance
    from wallets
    where writer_id = v_tx.writer_id;

  if v_wallet_id is null then
    raise exception 'Writer wallet not found';
  end if;

  v_new_balance := v_new_balance + v_tx.writer_amount_ngn;

  -- Update wallet balance
  update wallets
    set balance_ngn = v_new_balance,
        total_earned_ngn = total_earned_ngn + v_tx.writer_amount_ngn,
        updated_at = now()
    where id = v_wallet_id;

  -- Insert ledger entry
  insert into wallet_transactions (wallet_id, type, amount_ngn, description, reference_type, reference_id, balance_after_ngn)
    values (v_wallet_id, 'credit', v_tx.writer_amount_ngn, 'Payment for project', 'project_payment', v_tx.project_id, v_new_balance);

  -- Update project status
  update projects
    set status = 'completed',
        client_approved_at = now(),
        updated_at = now()
    where id = v_tx.project_id;
end;
$$;

-- Process withdrawal: debit wallet, create payout record.
-- Called when writer requests a withdrawal.
create or replace function process_withdrawal(
  p_writer_id uuid,
  p_amount_ngn numeric(12, 2)
)
returns uuid
language plpgsql
as $$
declare
  v_wallet record;
  v_new_balance numeric(12, 2);
  v_payout_id uuid;
  v_bank_name text;
  v_bank_account_number text;
  v_bank_account_name text;
begin
  select w.id, w.balance_ngn, wp.bank_name, wp.bank_account_number, wp.bank_account_name
    into v_wallet, v_new_balance, v_bank_name, v_bank_account_number, v_bank_account_name
    from wallets w
    join writer_profiles wp on wp.id = w.writer_id
    where w.writer_id = p_writer_id
    for update of w;

  if v_wallet is null then
    raise exception 'Wallet not found';
  end if;

  if v_new_balance < p_amount_ngn then
    raise exception 'Insufficient balance';
  end if;

  v_new_balance := v_new_balance - p_amount_ngn;

  -- Debit wallet
  update wallets
    set balance_ngn = v_new_balance,
        total_withdrawn_ngn = total_withdrawn_ngn + p_amount_ngn,
        updated_at = now()
    where id = v_wallet.id;

  -- Create payout record with snapshot of bank details
  insert into payouts (writer_id, wallet_id, amount_ngn, bank_name, bank_account_number, bank_account_name)
    values (p_writer_id, v_wallet.id, p_amount_ngn, v_bank_name, v_bank_account_number, v_bank_account_name)
    returning id into v_payout_id;

  -- Insert ledger entry
  insert into wallet_transactions (wallet_id, type, amount_ngn, description, reference_type, reference_id, balance_after_ngn)
    values (v_wallet.id, 'debit', p_amount_ngn, 'Withdrawal to bank account', 'withdrawal', v_payout_id, v_new_balance);

  return v_payout_id;
end;
$$;

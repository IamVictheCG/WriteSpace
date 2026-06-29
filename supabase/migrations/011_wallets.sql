-- 011: Writer wallets, ledger, and payouts
-- One wallet per writer. Balance is denormalized (source of truth is
-- wallet_transactions ledger, cached here for fast reads).

create table wallets (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null unique references writer_profiles(id) on delete cascade,
  balance_ngn numeric(12, 2) not null default 0
    constraint balance_non_negative check (balance_ngn >= 0),
  total_earned_ngn numeric(12, 2) not null default 0,
  total_withdrawn_ngn numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  type wallet_transaction_type not null,
  amount_ngn numeric(12, 2) not null
    constraint amount_positive check (amount_ngn > 0),
  description text not null,
  reference_type wallet_transaction_reference not null,
  reference_id uuid,
  balance_after_ngn numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  wallet_id uuid not null references wallets(id) on delete cascade,
  amount_ngn numeric(12, 2) not null
    constraint payout_amount_positive check (amount_ngn > 0),
  status payout_status not null default 'pending',
  bank_name text not null,
  bank_account_number text not null,
  bank_account_name text not null,
  paystack_transfer_code text,
  paystack_reference text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

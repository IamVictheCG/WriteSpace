-- 010: Transactions (escrow)
-- Tracks the client's payment for a project through the escrow lifecycle.
-- On release: commission deducted, net credited to writer's wallet.

create table transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete restrict,
  client_id uuid not null references client_profiles(id) on delete restrict,
  writer_id uuid not null references writer_profiles(id) on delete restrict,
  amount_ngn numeric(12, 2) not null
    constraint amount_positive check (amount_ngn > 0),
  commission_rate numeric(5, 4) not null
    constraint commission_rate_range check (commission_rate >= 0 and commission_rate < 1),
  commission_amount_ngn numeric(12, 2) not null,
  writer_amount_ngn numeric(12, 2) not null,
  status transaction_status not null default 'pending',
  paystack_reference text,
  paystack_transfer_code text,
  released_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint amounts_consistent check (
    writer_amount_ngn = amount_ngn - commission_amount_ngn
  )
);

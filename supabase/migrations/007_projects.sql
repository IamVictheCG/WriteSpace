-- 007: Projects
-- Created from Path A (direct contact → pending) or Path B (job selection →
-- awaiting_payment). Writer is locked in at creation, no swapping.

create table projects (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_postings(id) on delete set null,
  client_id uuid not null references client_profiles(id) on delete cascade,
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  title text not null,
  description text,
  agreed_price_ngn numeric(12, 2),
  status project_status not null default 'pending',
  writer_completed_at timestamptz,
  client_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

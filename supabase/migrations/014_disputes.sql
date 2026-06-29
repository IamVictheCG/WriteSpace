-- 014: Disputes
-- Client flags a dispute on a project with held funds.
-- Every dispute routes to manual admin decision. No automated resolution.

create table disputes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete restrict,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status dispute_resolution not null default 'open',
  admin_id uuid references auth.users(id) on delete set null,
  admin_notes text,
  resolution_amount_ngn numeric(12, 2),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- 013: Badge applications
-- Writer applies for verified badge. Admin reviews manually.
-- On approval: writer_profiles.is_verified = true, verified_at = now()
-- Both updates MUST happen in a single database transaction.

create table badge_applications (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  portfolio_notes text not null,
  status badge_application_status not null default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  review_notes text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz
);

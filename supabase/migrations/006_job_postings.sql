-- 006: Job postings and responses (Path B discovery)

create table job_postings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category_id uuid not null references categories(id) on delete restrict,
  budget_ngn numeric(12, 2),
  status job_posting_status not null default 'open',
  response_count integer not null default 0,
  max_responses integer not null,
  response_deadline timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_responses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_postings(id) on delete cascade,
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  pitch_text text not null,
  proposed_price_ngn numeric(12, 2) not null
    constraint proposed_price_positive check (proposed_price_ngn > 0),
  status job_response_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (job_id, writer_id)
);

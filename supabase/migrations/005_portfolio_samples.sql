-- 005: Portfolio samples
-- Multiple entries per writer, shown on public profile and directory.

create table portfolio_samples (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  title text not null,
  description text,
  external_url text,
  file_url text,
  category_id uuid references categories(id) on delete set null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

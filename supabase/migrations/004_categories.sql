-- 004: Categories and writer-category junction
-- Config-driven: adding a category = row insert, not a code change.

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table writer_categories (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (writer_id, category_id)
);

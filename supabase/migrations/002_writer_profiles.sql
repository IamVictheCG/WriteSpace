-- 002: Writer profiles
-- SECURITY: bank_* fields must NEVER appear in any public-facing query.

create table writer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  bio text,
  avatar_url text,
  response_time_hours integer not null default 24
    constraint response_time_positive check (response_time_hours > 0),
  price_range_min_ngn numeric(12, 2) not null
    constraint price_min_positive check (price_range_min_ngn > 0),
  price_range_max_ngn numeric(12, 2) not null
    constraint price_max_gte_min check (price_range_max_ngn >= price_range_min_ngn),

  -- bank details — excluded from all public queries
  bank_name text not null,
  bank_account_number text not null,
  bank_account_name text not null,

  -- denormalized for directory listing performance
  completed_jobs_count integer not null default 0,
  average_rating numeric(3, 2),

  -- verified badge status (set by admin via badge_applications flow)
  is_verified boolean not null default false,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

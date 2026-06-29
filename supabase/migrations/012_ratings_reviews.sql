-- 012: Ratings and reviews
-- Only allowed after a project is completed with a verified transaction.
-- One rating per project, from client to writer.

create table ratings_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  client_id uuid not null references client_profiles(id) on delete cascade,
  writer_id uuid not null references writer_profiles(id) on delete cascade,
  rating integer not null
    constraint rating_range check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz not null default now()
);

-- 017: Row Level Security policies
-- RLS is a BACKSTOP against direct anon-key access to Supabase.
-- The actual enforcement is require-role.ts in route handlers.
-- All app data goes through service.ts (service-role, bypasses RLS).
-- These policies deny everything via anon key by default.

-- Enable RLS on every table
alter table writer_profiles enable row level security;
alter table client_profiles enable row level security;
alter table categories enable row level security;
alter table writer_categories enable row level security;
alter table portfolio_samples enable row level security;
alter table job_postings enable row level security;
alter table job_responses enable row level security;
alter table projects enable row level security;
alter table messages enable row level security;
alter table message_flags enable row level security;
alter table project_files enable row level security;
alter table transactions enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table payouts enable row level security;
alter table ratings_reviews enable row level security;
alter table badge_applications enable row level security;
alter table disputes enable row level security;
alter table platform_settings enable row level security;

-- Categories are the only table with a public read policy (anon key can read
-- active categories for the landing page category filter).
create policy "categories_public_read" on categories
  for select using (is_active = true);

-- Platform settings: allow anon read for client-side validation
-- (price limits, etc.) but not write.
create policy "platform_settings_public_read" on platform_settings
  for select using (true);

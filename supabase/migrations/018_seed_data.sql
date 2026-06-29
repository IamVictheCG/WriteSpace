-- 018: Seed data
-- Initial categories and platform settings.

-- Categories (spec: Ghostwriting, Copywriting, Technical writing, Academic writing)
insert into categories (name, slug, description) values
  ('Ghostwriting', 'ghostwriting', 'Books, speeches, articles written under the client''s name'),
  ('Copywriting', 'copywriting', 'Marketing copy, ads, sales pages, brand messaging'),
  ('Technical Writing', 'technical-writing', 'Documentation, manuals, technical guides, API docs'),
  ('Academic Writing', 'academic-writing', 'Research papers, essays, dissertations, academic content');

-- Platform settings
insert into platform_settings (key, value, description) values
  ('min_writer_price_ngn', '5000', 'Minimum price a writer can set in their price range (NGN)'),
  ('max_writer_price_ngn', '5000000', 'Maximum price a writer can set in their price range (NGN)'),
  ('min_client_budget_ngn', '5000', 'Minimum budget a client can set on a job posting (NGN)'),
  ('max_client_budget_ngn', '5000000', 'Maximum budget a client can set on a job posting (NGN)'),
  ('commission_rate', '0.15', 'Platform commission rate (15%)'),
  ('max_writer_response_time_hours', '48', 'Maximum response time a writer can set on their profile (hours)'),
  ('job_response_window_hours', '48', 'How long a job posting stays open for responses (hours)'),
  ('max_job_responses', '5', 'Maximum number of writer responses per job posting');

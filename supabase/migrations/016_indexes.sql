-- 016: Indexes beyond PKs and unique constraints

-- Writer directory lookups
create index idx_writer_profiles_username on writer_profiles(username);
create index idx_writer_profiles_is_verified on writer_profiles(is_verified);

-- Client lookups
create index idx_client_profiles_username on client_profiles(username);

-- Category filtering
create index idx_writer_categories_writer on writer_categories(writer_id);
create index idx_writer_categories_category on writer_categories(category_id);

-- Portfolio display
create index idx_portfolio_samples_writer on portfolio_samples(writer_id, display_order);

-- Job postings: directory filtering and client dashboard
create index idx_job_postings_category_status on job_postings(category_id, status);
create index idx_job_postings_client on job_postings(client_id);
create index idx_job_postings_status on job_postings(status);

-- Job responses: listing for a posting
create index idx_job_responses_job on job_responses(job_id);
create index idx_job_responses_writer on job_responses(writer_id);

-- Projects: dashboard queries
create index idx_projects_writer on projects(writer_id);
create index idx_projects_client on projects(client_id);
create index idx_projects_status on projects(status);

-- Messages: chat ordering
create index idx_messages_project_created on messages(project_id, created_at);
create index idx_messages_flagged on messages(is_flagged) where is_flagged = true;

-- Message flags: admin queue
create index idx_message_flags_status on message_flags(status);

-- Project files
create index idx_project_files_project on project_files(project_id);

-- Transactions: lookup by project and status
create index idx_transactions_status on transactions(status);

-- Wallet transactions: ledger queries
create index idx_wallet_transactions_wallet on wallet_transactions(wallet_id, created_at);

-- Payouts: admin and writer views
create index idx_payouts_writer on payouts(writer_id);
create index idx_payouts_status on payouts(status);

-- Ratings: writer profile aggregation
create index idx_ratings_reviews_writer on ratings_reviews(writer_id);

-- Badge applications: admin queue
create index idx_badge_applications_status on badge_applications(status);

-- Disputes: admin queue
create index idx_disputes_status on disputes(status);

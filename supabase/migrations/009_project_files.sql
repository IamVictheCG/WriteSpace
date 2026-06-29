-- 009: Project files
-- Separate upload flow, available once a writer is assigned.
-- Access enforced in route handler via require-role.ts.

create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

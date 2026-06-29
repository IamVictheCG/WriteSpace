-- 008: Messages and message flags
-- Supabase Realtime, scoped to a project.
-- Flagged messages route to /admin/flags, not delivered to recipient.

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

-- One flag per message. Only flag type in the system.
create table message_flags (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references messages(id) on delete cascade,
  matched_pattern text not null,
  status message_flag_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

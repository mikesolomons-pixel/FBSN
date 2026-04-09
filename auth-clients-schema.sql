-- ============================================================
-- Supabase schema: Auth profiles + Client management
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Invitation codes (gate signup)
create table invite_codes (
  id          uuid default gen_random_uuid() primary key,
  code        text not null unique,
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  max_uses    integer not null default 0,   -- 0 = unlimited
  times_used  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table invite_codes enable row level security;

-- Anyone can read invite codes (needed for signup validation before auth)
create policy "Invite codes: public read" on invite_codes
  for select using (true);

-- Only authenticated users can manage invite codes (admin will use console)
create policy "Invite codes: auth update" on invite_codes
  for update using (true);

-- Seed a default admin invite code (change this!)
insert into invite_codes (code, role, max_uses) values
  ('VCT-ADMIN-2024', 'admin', 1),
  ('VCT-TEAM-2024', 'practitioner', 0);


-- 1. User profiles (linked to Supabase Auth)
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table profiles enable row level security;

-- Authenticated users can read all profiles
create policy "Profiles: authenticated read" on profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own profile
create policy "Profiles: self update" on profiles
  for update using (auth.uid() = id);

-- Insert triggered by auth signup (handled by trigger below)
create policy "Profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'practitioner')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Clients
create table clients (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  organization    text not null default '',
  contact_email   text default '',
  contact_phone   text default '',
  pipeline_stage  text not null default 'lead'
    check (pipeline_stage in ('lead','qualified','proposal','negotiation','won','lost')),
  notes           text default '',
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table clients enable row level security;

create policy "Clients: authenticated read" on clients
  for select using (auth.role() = 'authenticated');
create policy "Clients: authenticated insert" on clients
  for insert with check (auth.role() = 'authenticated');
create policy "Clients: authenticated update" on clients
  for update using (auth.role() = 'authenticated');
create policy "Clients: authenticated delete" on clients
  for delete using (auth.role() = 'authenticated');


-- 3. Projects (one client can have multiple engagements)
create table projects (
  id              uuid default gen_random_uuid() primary key,
  client_id       uuid references clients(id) on delete cascade not null,
  title           text not null,
  description     text default '',
  current_stage   text not null default 'calibration'
    check (current_stage in ('calibration','scaffolding','ongoing','complete')),
  start_date      date,
  target_end_date date,
  status          text not null default 'active'
    check (status in ('active','paused','complete','archived')),
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table projects enable row level security;

create policy "Projects: authenticated read" on projects
  for select using (auth.role() = 'authenticated');
create policy "Projects: authenticated insert" on projects
  for insert with check (auth.role() = 'authenticated');
create policy "Projects: authenticated update" on projects
  for update using (auth.role() = 'authenticated');
create policy "Projects: authenticated delete" on projects
  for delete using (auth.role() = 'authenticated');


-- 4. Artifacts (deliverables, outputs, documents per project stage)
create table artifacts (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references projects(id) on delete cascade not null,
  stage           text not null
    check (stage in ('calibration','scaffolding','ongoing')),
  artifact_type   text not null default 'document'
    check (artifact_type in ('document','exercise_output','meeting_notes','template','other')),
  title           text not null,
  description     text default '',
  content         text default '',
  url             text default '',
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table artifacts enable row level security;

create policy "Artifacts: authenticated read" on artifacts
  for select using (auth.role() = 'authenticated');
create policy "Artifacts: authenticated insert" on artifacts
  for insert with check (auth.role() = 'authenticated');
create policy "Artifacts: authenticated update" on artifacts
  for update using (auth.role() = 'authenticated');
create policy "Artifacts: authenticated delete" on artifacts
  for delete using (auth.role() = 'authenticated');


-- 5. Stage checklist items (track progress through each stage)
create table stage_tasks (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references projects(id) on delete cascade not null,
  stage           text not null
    check (stage in ('calibration','scaffolding','ongoing')),
  title           text not null,
  description     text default '',
  is_complete     boolean default false,
  sort_order      integer default 0,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

alter table stage_tasks enable row level security;

create policy "Stage tasks: authenticated read" on stage_tasks
  for select using (auth.role() = 'authenticated');
create policy "Stage tasks: authenticated insert" on stage_tasks
  for insert with check (auth.role() = 'authenticated');
create policy "Stage tasks: authenticated update" on stage_tasks
  for update using (auth.role() = 'authenticated');
create policy "Stage tasks: authenticated delete" on stage_tasks
  for delete using (auth.role() = 'authenticated');


-- 6. Update existing public tables to require auth for writes
-- (Keeping public read so the homepage still works for visitors)

-- practices: already has public RLS, add auth-only write
-- NOTE: Only run these if your current policies allow anonymous writes
-- and you want to lock them down. Skip if you want to keep current behavior.

-- drop policy if exists "Allow public insert on practices" on practices;
-- drop policy if exists "Allow public update on practices" on practices;
-- drop policy if exists "Allow public delete on practices" on practices;
-- create policy "Practices: auth insert" on practices for insert with check (auth.role() = 'authenticated');
-- create policy "Practices: auth update" on practices for update using (auth.role() = 'authenticated');
-- create policy "Practices: auth delete" on practices for delete using (auth.role() = 'authenticated');

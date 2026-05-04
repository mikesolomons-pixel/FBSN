-- ============================================================
-- Supabase schema: FBSN auth profiles + Client management
-- Idempotent — safe to re-run.
-- Uses fbsn_profiles to avoid colliding with Mise En Place's
-- existing public.profiles table in the shared Supabase project.
-- ============================================================

-- 0. Invitation codes (gate signup)
create table if not exists invite_codes (
  id          uuid default gen_random_uuid() primary key,
  code        text not null unique,
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  max_uses    integer not null default 0,   -- 0 = unlimited
  times_used  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table invite_codes enable row level security;

drop policy if exists "Invite codes: public read" on invite_codes;
create policy "Invite codes: public read" on invite_codes for select using (true);

drop policy if exists "Invite codes: auth update" on invite_codes;
create policy "Invite codes: auth update" on invite_codes for update using (true);

insert into invite_codes (code, role, max_uses) values
  ('VCT-ADMIN-2024', 'admin', 1),
  ('VCT-TEAM-2024', 'practitioner', 0)
on conflict (code) do nothing;


-- 1. FBSN user profiles (separate from Mise En Place's profiles table)
create table if not exists fbsn_profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table fbsn_profiles enable row level security;

drop policy if exists "FBSN profiles: authenticated read" on fbsn_profiles;
create policy "FBSN profiles: authenticated read" on fbsn_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "FBSN profiles: self update" on fbsn_profiles;
create policy "FBSN profiles: self update" on fbsn_profiles
  for update using (auth.uid() = id);

drop policy if exists "FBSN profiles: insert own" on fbsn_profiles;
create policy "FBSN profiles: insert own" on fbsn_profiles
  for insert with check (auth.uid() = id);

-- Replace the shared on-signup trigger function so both apps get their rows.
-- Mise En Place expects: profiles + dietary_profiles. FBSN adds fbsn_profiles.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Mise En Place
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.dietary_profiles (user_id)
  values (new.id)
  on conflict do nothing;

  -- FBSN
  insert into public.fbsn_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'practitioner')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger already exists from Mise En Place's 001_initial.sql; ensure it's there.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Clients
create table if not exists clients (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  organization    text not null default '',
  contact_email   text default '',
  contact_phone   text default '',
  pipeline_stage  text not null default 'lead'
    check (pipeline_stage in ('lead','qualified','proposal','negotiation','won','lost')),
  notes           text default '',
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table clients enable row level security;

drop policy if exists "Clients: authenticated read" on clients;
create policy "Clients: authenticated read" on clients for select using (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated insert" on clients;
create policy "Clients: authenticated insert" on clients for insert with check (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated update" on clients;
create policy "Clients: authenticated update" on clients for update using (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated delete" on clients;
create policy "Clients: authenticated delete" on clients for delete using (auth.role() = 'authenticated');


-- 3. Projects
create table if not exists projects (
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
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table projects enable row level security;

drop policy if exists "Projects: authenticated read" on projects;
create policy "Projects: authenticated read" on projects for select using (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated insert" on projects;
create policy "Projects: authenticated insert" on projects for insert with check (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated update" on projects;
create policy "Projects: authenticated update" on projects for update using (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated delete" on projects;
create policy "Projects: authenticated delete" on projects for delete using (auth.role() = 'authenticated');


-- 4. Artifacts
create table if not exists artifacts (
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
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table artifacts enable row level security;

drop policy if exists "Artifacts: authenticated read" on artifacts;
create policy "Artifacts: authenticated read" on artifacts for select using (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated insert" on artifacts;
create policy "Artifacts: authenticated insert" on artifacts for insert with check (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated update" on artifacts;
create policy "Artifacts: authenticated update" on artifacts for update using (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated delete" on artifacts;
create policy "Artifacts: authenticated delete" on artifacts for delete using (auth.role() = 'authenticated');


-- 5. Stage tasks
create table if not exists stage_tasks (
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

drop policy if exists "Stage tasks: authenticated read" on stage_tasks;
create policy "Stage tasks: authenticated read" on stage_tasks for select using (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated insert" on stage_tasks;
create policy "Stage tasks: authenticated insert" on stage_tasks for insert with check (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated update" on stage_tasks;
create policy "Stage tasks: authenticated update" on stage_tasks for update using (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated delete" on stage_tasks;
create policy "Stage tasks: authenticated delete" on stage_tasks for delete using (auth.role() = 'authenticated');

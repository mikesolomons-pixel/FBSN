-- ============================================================
-- Supabase schema for Principles & Beliefs
-- ============================================================

create table beliefs (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table beliefs enable row level security;

create policy "Allow public read on beliefs"
  on beliefs for select using (true);

create policy "Allow public insert on beliefs"
  on beliefs for insert with check (true);

create policy "Allow public update on beliefs"
  on beliefs for update using (true) with check (true);

create policy "Allow public delete on beliefs"
  on beliefs for delete using (true);

-- ============================================================
-- Seed data: current 5 principles
-- ============================================================

insert into beliefs (title, description, sort_order) values
(
  'Leadership is a Team Sport',
  'The most critical unit of leadership in any organization is the top team, not the individual at the top.',
  0
),
(
  'Team Building Happens by Achieving Outcomes in New Ways',
  'Not just shareholder returns. Teams exist to create value across all stakeholders. If we''re honest, most organizations are falling short.',
  1
),
(
  'Plays, Not Prescriptions',
  'Like a sports team, executive teams need a playbook of adaptable moves, not rigid processes.',
  2
),
(
  'Practice Makes Permanent',
  'Real change comes through repeated practice, not one-off events or workshops.',
  3
),
(
  'Conflict is Data, Not Dysfunction',
  'Divergent views tell us where reality is unclear and where assumptions differ. The goal isn''t consensus — it''s shared clarity.',
  4
);

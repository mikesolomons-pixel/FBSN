-- ============================================================
-- Supabase schema for Principles & Beliefs
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists beliefs (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table beliefs enable row level security;

drop policy if exists "Allow public read on beliefs" on beliefs;
create policy "Allow public read on beliefs" on beliefs for select using (true);
drop policy if exists "Allow public insert on beliefs" on beliefs;
create policy "Allow public insert on beliefs" on beliefs for insert with check (true);
drop policy if exists "Allow public update on beliefs" on beliefs;
create policy "Allow public update on beliefs" on beliefs for update using (true) with check (true);
drop policy if exists "Allow public delete on beliefs" on beliefs;
create policy "Allow public delete on beliefs" on beliefs for delete using (true);

-- Seed data: only insert if title not already present
insert into beliefs (title, description, sort_order)
select 'Leadership is a Team Sport',
       'The most critical unit of leadership in any organization is the top team, not the individual at the top.',
       0
where not exists (select 1 from beliefs where title = 'Leadership is a Team Sport');

insert into beliefs (title, description, sort_order)
select 'Team Building Happens by Achieving Outcomes in New Ways',
       'Not just shareholder returns. Teams exist to create value across all stakeholders. If we''re honest, most organizations are falling short.',
       1
where not exists (select 1 from beliefs where title = 'Team Building Happens by Achieving Outcomes in New Ways');

insert into beliefs (title, description, sort_order)
select 'Plays, Not Prescriptions',
       'Like a sports team, executive teams need a playbook of adaptable moves, not rigid processes.',
       2
where not exists (select 1 from beliefs where title = 'Plays, Not Prescriptions');

insert into beliefs (title, description, sort_order)
select 'Practice Makes Permanent',
       'Real change comes through repeated practice, not one-off events or workshops.',
       3
where not exists (select 1 from beliefs where title = 'Practice Makes Permanent');

insert into beliefs (title, description, sort_order)
select 'Conflict is Data, Not Dysfunction',
       'Divergent views tell us where reality is unclear and where assumptions differ. The goal isn''t consensus — it''s shared clarity.',
       4
where not exists (select 1 from beliefs where title = 'Conflict is Data, Not Dysfunction');

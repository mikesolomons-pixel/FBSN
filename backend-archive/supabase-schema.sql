-- FBSN Supabase Schema (Rooms / Participants / Votes)
-- Idempotent — safe to re-run.

create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  title text not null default 'Untitled',
  context text default '',
  perspectives jsonb not null default '[]',
  current_index int not null default 0,
  revealed boolean not null default false,
  final_decisions jsonb not null default '{}',
  status text not null default 'waiting' check (status in ('waiting', 'active', 'complete')),
  created_at timestamptz default now()
);

create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  perspective_index int not null,
  certainty text not null check (certainty in ('fact', 'belief')),
  importance text not null check (importance in ('signal', 'noise')),
  created_at timestamptz default now(),
  unique(room_id, participant_id, perspective_index)
);

alter table rooms enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;

drop policy if exists "Anyone can create rooms" on rooms;
create policy "Anyone can create rooms" on rooms for insert with check (true);
drop policy if exists "Anyone can read rooms" on rooms;
create policy "Anyone can read rooms" on rooms for select using (true);
drop policy if exists "Anyone can update rooms" on rooms;
create policy "Anyone can update rooms" on rooms for update using (true);

drop policy if exists "Anyone can add participants" on participants;
create policy "Anyone can add participants" on participants for insert with check (true);
drop policy if exists "Anyone can read participants" on participants;
create policy "Anyone can read participants" on participants for select using (true);
drop policy if exists "Anyone can delete participants" on participants;
create policy "Anyone can delete participants" on participants for delete using (true);

drop policy if exists "Anyone can vote" on votes;
create policy "Anyone can vote" on votes for insert with check (true);
drop policy if exists "Anyone can read votes" on votes;
create policy "Anyone can read votes" on votes for select using (true);
drop policy if exists "Anyone can update votes" on votes;
create policy "Anyone can update votes" on votes for update using (true);

-- Realtime: only add to publication if not already there
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table participants;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end $$;

create index if not exists idx_rooms_code on rooms(code);
create index if not exists idx_participants_room on participants(room_id);
create index if not exists idx_votes_room on votes(room_id);

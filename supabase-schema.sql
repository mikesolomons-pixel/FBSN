-- FBSN Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Rooms table
create table rooms (
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

-- Participants table
create table participants (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Votes table
create table votes (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  perspective_index int not null,
  certainty text not null check (certainty in ('fact', 'belief')),
  importance text not null check (importance in ('signal', 'noise')),
  created_at timestamptz default now(),
  unique(room_id, participant_id, perspective_index)
);

-- Enable Row Level Security
alter table rooms enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;

-- Policies: allow all access via anon key (public app, no auth)
create policy "Anyone can create rooms" on rooms for insert with check (true);
create policy "Anyone can read rooms" on rooms for select using (true);
create policy "Anyone can update rooms" on rooms for update using (true);

create policy "Anyone can add participants" on participants for insert with check (true);
create policy "Anyone can read participants" on participants for select using (true);
create policy "Anyone can delete participants" on participants for delete using (true);

create policy "Anyone can vote" on votes for insert with check (true);
create policy "Anyone can read votes" on votes for select using (true);
create policy "Anyone can update votes" on votes for update using (true);

-- Enable realtime on these tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table votes;

-- Index for fast room lookups by code
create index idx_rooms_code on rooms(code);
create index idx_participants_room on participants(room_id);
create index idx_votes_room on votes(room_id);

-- VCT Content Overrides Schema (for admin inline editing)
-- Run this in your Supabase SQL Editor

create table content (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(page, key)
);

alter table content enable row level security;

create policy "Anyone can read content" on content for select using (true);
create policy "Anyone can insert content" on content for insert with check (true);
create policy "Anyone can update content" on content for update using (true);

create index idx_content_page on content(page);

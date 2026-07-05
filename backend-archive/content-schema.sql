-- VCT Content Overrides Schema (for admin inline editing)
-- Idempotent — safe to re-run.

create table if not exists content (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(page, key)
);

alter table content enable row level security;

drop policy if exists "Anyone can read content" on content;
create policy "Anyone can read content" on content for select using (true);
drop policy if exists "Anyone can insert content" on content;
create policy "Anyone can insert content" on content for insert with check (true);
drop policy if exists "Anyone can update content" on content;
create policy "Anyone can update content" on content for update using (true);

create index if not exists idx_content_page on content(page);

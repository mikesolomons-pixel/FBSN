-- Migration: lockable perspective list per room
-- Set allow_participant_prompts = false to run a session with a curated,
-- fixed list of perspectives (e.g. the Netflix template).
-- Idempotent — safe to re-run.

alter table public.rooms
  add column if not exists allow_participant_prompts boolean not null default true;

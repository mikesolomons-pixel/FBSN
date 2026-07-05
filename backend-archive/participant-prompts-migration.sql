-- Migration: atomic perspective ops for FBSN multiplayer rooms.
-- Perspectives are stored as JSONB array of objects:
--   { "text": string, "submitter": uuid or null }
-- Legacy string entries (from before this migration) are tolerated:
--   the helpers normalize on read and only objects are written.
-- Idempotent — safe to re-run.

-- Append a perspective. submitter = participant id, or null if added by the host.
create or replace function public.append_room_perspective(
  p_room_id   uuid,
  p_text      text,
  p_submitter uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  result  jsonb;
  cleaned text := trim(p_text);
  entry   jsonb;
begin
  if cleaned is null or length(cleaned) = 0 then
    raise exception 'empty perspective';
  end if;
  if length(cleaned) > 500 then
    cleaned := substring(cleaned from 1 for 500);
  end if;

  entry := jsonb_build_object(
    'text', cleaned,
    'submitter', p_submitter
  );

  update public.rooms
    set perspectives = coalesce(perspectives, '[]'::jsonb) || jsonb_build_array(entry)
    where id = p_room_id
    returning perspectives into result;

  if result is null then
    raise exception 'room not found';
  end if;
  return result;
end;
$$;

grant execute on function public.append_room_perspective(uuid, text, uuid) to anon, authenticated;

-- Update one of MY perspectives. p_submitter must match the perspective's
-- submitter or the call is rejected. Pass NULL p_submitter to update a
-- host-added perspective (host has no participant id).
create or replace function public.update_room_perspective(
  p_room_id   uuid,
  p_index     int,
  p_text      text,
  p_submitter uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  result    jsonb;
  cleaned   text := trim(p_text);
  current   jsonb;
  current_submitter uuid;
begin
  if cleaned is null or length(cleaned) = 0 then
    raise exception 'empty perspective';
  end if;
  if length(cleaned) > 500 then
    cleaned := substring(cleaned from 1 for 500);
  end if;

  select perspectives -> p_index into current from public.rooms where id = p_room_id;
  if current is null then
    raise exception 'perspective not found';
  end if;

  -- legacy string entries treated as host-added (submitter = null)
  if jsonb_typeof(current) = 'object' then
    current_submitter := nullif(current ->> 'submitter', '')::uuid;
  else
    current_submitter := null;
  end if;

  if current_submitter is distinct from p_submitter then
    raise exception 'not your perspective';
  end if;

  update public.rooms
    set perspectives = jsonb_set(
      perspectives,
      array[p_index::text],
      jsonb_build_object('text', cleaned, 'submitter', p_submitter)
    )
    where id = p_room_id
    returning perspectives into result;

  return result;
end;
$$;

grant execute on function public.update_room_perspective(uuid, int, text, uuid) to anon, authenticated;

-- Delete one of MY perspectives. Same submitter check as update.
create or replace function public.delete_room_perspective(
  p_room_id   uuid,
  p_index     int,
  p_submitter uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
  current jsonb;
  current_submitter uuid;
begin
  select perspectives -> p_index into current from public.rooms where id = p_room_id;
  if current is null then
    raise exception 'perspective not found';
  end if;

  if jsonb_typeof(current) = 'object' then
    current_submitter := nullif(current ->> 'submitter', '')::uuid;
  else
    current_submitter := null;
  end if;

  if current_submitter is distinct from p_submitter then
    raise exception 'not your perspective';
  end if;

  update public.rooms
    set perspectives = perspectives - p_index
    where id = p_room_id
    returning perspectives into result;

  return result;
end;
$$;

grant execute on function public.delete_room_perspective(uuid, int, uuid) to anon, authenticated;

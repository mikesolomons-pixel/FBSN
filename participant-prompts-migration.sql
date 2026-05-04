-- Migration: atomic append to rooms.perspectives
-- Lets participants submit prompts without read-modify-write races.
-- Idempotent — safe to re-run.

create or replace function public.append_room_perspective(p_room_id uuid, p_text text)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
  cleaned text := trim(p_text);
begin
  if cleaned is null or length(cleaned) = 0 then
    raise exception 'empty perspective';
  end if;
  if length(cleaned) > 500 then
    cleaned := substring(cleaned from 1 for 500);
  end if;

  update public.rooms
    set perspectives = coalesce(perspectives, '[]'::jsonb) || to_jsonb(cleaned)
    where id = p_room_id
    returning perspectives into result;

  if result is null then
    raise exception 'room not found';
  end if;
  return result;
end;
$$;

grant execute on function public.append_room_perspective(uuid, text) to anon, authenticated;

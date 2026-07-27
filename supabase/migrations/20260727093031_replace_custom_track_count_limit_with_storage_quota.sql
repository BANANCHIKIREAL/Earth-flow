drop trigger if exists enforce_custom_track_limit_before_insert on public.user_custom_tracks;
drop trigger if exists enforce_custom_track_quota_before_write on public.user_custom_tracks;
drop function if exists public.enforce_custom_track_limit();

create or replace function public.enforce_custom_track_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  used_bytes bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select coalesce(sum(size_bytes), 0)
  into used_bytes
  from public.user_custom_tracks
  where user_id = new.user_id
    and id <> new.id;

  if used_bytes + new.size_bytes > 4500000 then
    raise exception 'Cloud sound storage limit reached (4.5 MB total)'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_custom_track_quota() from public, anon, authenticated;

create trigger enforce_custom_track_quota_before_write
before insert or update of user_id, size_bytes on public.user_custom_tracks
for each row execute function public.enforce_custom_track_quota();

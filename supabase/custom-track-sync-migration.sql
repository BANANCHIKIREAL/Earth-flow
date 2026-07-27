create table if not exists public.user_custom_tracks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  storage_path text not null,
  mime_type text not null check (mime_type in ('audio/webm', 'audio/ogg', 'audio/mp4')),
  size_bytes integer not null check (size_bytes between 1 and 4500000),
  duration_seconds numeric(7, 2) not null check (duration_seconds > 0),
  status text not null default 'uploading' check (status in ('uploading', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

alter table public.user_custom_tracks enable row level security;

revoke all on table public.user_custom_tracks from anon;
grant select, insert, update, delete on table public.user_custom_tracks to authenticated;

drop policy if exists "custom tracks select own" on public.user_custom_tracks;
create policy "custom tracks select own"
on public.user_custom_tracks for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "custom tracks insert own" on public.user_custom_tracks;
create policy "custom tracks insert own"
on public.user_custom_tracks for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "custom tracks update own" on public.user_custom_tracks;
create policy "custom tracks update own"
on public.user_custom_tracks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "custom tracks delete own" on public.user_custom_tracks;
create policy "custom tracks delete own"
on public.user_custom_tracks for delete
to authenticated
using ((select auth.uid()) = user_id);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-audio-sync',
  'user-audio-sync',
  false,
  4500000,
  array['audio/webm', 'audio/ogg', 'audio/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "custom audio select own" on storage.objects;
create policy "custom audio select own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.user_custom_tracks
    where user_id = (select auth.uid())
      and storage_path = name
      and status = 'ready'
  )
);

drop policy if exists "custom audio insert own" on storage.objects;
create policy "custom audio insert own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.user_custom_tracks
    where user_id = (select auth.uid())
      and storage_path = name
      and status = 'uploading'
  )
);

drop policy if exists "custom audio update own" on storage.objects;
create policy "custom audio update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "custom audio delete own" on storage.objects;
create policy "custom audio delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

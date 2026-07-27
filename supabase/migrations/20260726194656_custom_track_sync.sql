create table if not exists public.user_custom_tracks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  storage_path text not null,
  mime_type text not null check (mime_type in ('audio/webm', 'audio/ogg')),
  size_bytes integer not null check (size_bytes between 1 and 900000),
  duration_seconds numeric(7, 2) not null check (duration_seconds > 0 and duration_seconds <= 90),
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

create or replace function public.enforce_custom_track_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.user_custom_tracks
    where user_id = new.user_id
  ) >= 5 then
    raise exception 'Cloud sound limit reached (5 files)'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_custom_track_limit() from public, anon, authenticated;

drop trigger if exists enforce_custom_track_limit_before_insert on public.user_custom_tracks;
create trigger enforce_custom_track_limit_before_insert
before insert on public.user_custom_tracks
for each row execute function public.enforce_custom_track_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-audio-sync',
  'user-audio-sync',
  false,
  900000,
  array['audio/webm', 'audio/ogg']
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

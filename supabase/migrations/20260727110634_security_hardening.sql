-- Remove obsolete permissive policies created by earlier dashboard migrations.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Users can upload their own background 10u1g5f_0" on storage.objects;
drop policy if exists "Users can update their own background 10u1g5f_0" on storage.objects;
drop policy if exists "Users can update their own background 10u1g5f_1" on storage.objects;
drop policy if exists "insert own background" on storage.objects;
drop policy if exists "update own background" on storage.objects;

-- Enforce server-side limits. Client checks are only a usability layer.
update storage.buckets
set
  public = true,
  file_size_limit = 5000000,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
where id in ('avatars', 'user-backgrounds');

create policy "avatar select own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar insert own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatar delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "background select own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "background insert own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "background update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "background delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Fix the correlated object-name check. The earlier unqualified `name`
-- resolved to the metadata row instead of storage.objects.name.
drop policy if exists "custom audio select own" on storage.objects;
create policy "custom audio select own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-audio-sync'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.user_custom_tracks as custom_track
    where custom_track.user_id = (select auth.uid())
      and custom_track.storage_path = storage.objects.name
      and custom_track.status = 'ready'
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
    from public.user_custom_tracks as custom_track
    where custom_track.user_id = (select auth.uid())
      and custom_track.storage_path = storage.objects.name
      and custom_track.status = 'uploading'
  )
);

-- The RPC no longer bypasses RLS. Limit execution to signed-in users.
alter function public.increment_session_time(uuid, integer) security invoker;
alter function public.increment_session_time(uuid, integer) set search_path = '';
revoke all on function public.increment_session_time(uuid, integer) from public, anon;
grant execute on function public.increment_session_time(uuid, integer) to authenticated;

-- Streak writes are still protected by RLS, but anonymous callers do not need RPC access.
revoke all on function public.upsert_streak_v(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_streak_v(uuid, jsonb, timestamptz) to authenticated;

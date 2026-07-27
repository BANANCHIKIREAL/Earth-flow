alter table public.user_custom_tracks
  drop constraint if exists user_custom_tracks_size_bytes_check,
  add constraint user_custom_tracks_size_bytes_check
    check (size_bytes between 1 and 4500000);

alter table public.user_custom_tracks
  drop constraint if exists user_custom_tracks_duration_seconds_check,
  add constraint user_custom_tracks_duration_seconds_check
    check (duration_seconds > 0);

update storage.buckets
set file_size_limit = 4500000
where id = 'user-audio-sync';

alter table public.user_custom_tracks
  drop constraint if exists user_custom_tracks_mime_type_check,
  add constraint user_custom_tracks_mime_type_check
    check (mime_type in ('audio/webm', 'audio/ogg', 'audio/mp4'));

update storage.buckets
set allowed_mime_types = array['audio/webm', 'audio/ogg', 'audio/mp4']
where id = 'user-audio-sync';

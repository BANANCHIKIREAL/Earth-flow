alter table public.user_profiles
  add column if not exists profile_customization jsonb not null default '{}'::jsonb;

alter table public.user_profiles
  drop constraint if exists user_profiles_profile_customization_shape;

alter table public.user_profiles
  add constraint user_profiles_profile_customization_shape
  check (
    jsonb_typeof(profile_customization) = 'object'
    and octet_length(profile_customization::text) <= 4096
  );

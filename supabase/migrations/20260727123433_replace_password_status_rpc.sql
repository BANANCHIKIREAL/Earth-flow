alter table public.user_profiles
  add column if not exists has_password boolean not null default false;

update public.user_profiles as profile
set has_password = (nullif(auth_user.encrypted_password, '') is not null)
from auth.users as auth_user
where auth_user.id = profile.user_id;

drop function if exists public.has_account_password();

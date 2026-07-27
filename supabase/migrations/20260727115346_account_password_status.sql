CREATE OR REPLACE FUNCTION public.has_account_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select nullif(auth_user.encrypted_password, '') is not null
      from auth.users as auth_user
      where auth_user.id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.has_account_password() from public, anon;
grant execute on function public.has_account_password() to authenticated;

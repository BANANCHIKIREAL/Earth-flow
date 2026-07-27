drop policy if exists "Users manage their own data" on public.user_data;
create policy "Users manage their own data"
on public.user_data for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "own_insert" on public.user_profiles;
create policy "own_insert"
on public.user_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "own_select" on public.user_profiles;
create policy "own_select"
on public.user_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "own_update" on public.user_profiles;
create policy "own_update"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings"
on public.user_settings for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "users_own_streak" on public.user_streaks;
create policy "users_own_streak"
on public.user_streaks for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

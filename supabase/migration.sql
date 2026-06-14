-- Run this in Supabase → SQL Editor

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tasks jsonb not null default '[]'::jsonb,
  completed_records jsonb not null default '[]'::jsonb,
  chart_archive jsonb not null default '[]'::jsonb,
  chart_hidden_level jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "Users manage their own data" on public.user_data;
create policy "Users manage their own data" on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

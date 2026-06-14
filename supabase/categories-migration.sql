-- Run this in Supabase → SQL Editor to add categories support

alter table public.user_data
  add column if not exists categories jsonb not null default '[]'::jsonb;

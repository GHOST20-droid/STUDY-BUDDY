-- Run ONCE in the Supabase SQL editor (after schema.sql). Adds the table that saves each student's data across devices.
create table if not exists public.student_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.student_state enable row level security;
create policy student_state_owner on public.student_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

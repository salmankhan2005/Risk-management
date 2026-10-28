-- Migration: 20261028170000_allow_user_workspace_state.sql
-- Description: Grant permissions to anon and authenticated roles for user_workspace_state to enable seamless Clerk user workspace persistence and demo state saving.

grant select, insert, update, delete on table public.user_workspace_state to anon, authenticated;

drop policy if exists "Users can read their own workspace state" on public.user_workspace_state;
drop policy if exists "Users can create their own workspace state" on public.user_workspace_state;
drop policy if exists "Users can update their own workspace state" on public.user_workspace_state;
drop policy if exists "Users can delete their own workspace state" on public.user_workspace_state;
drop policy if exists "Allow read user workspace state" on public.user_workspace_state;
drop policy if exists "Allow insert user workspace state" on public.user_workspace_state;
drop policy if exists "Allow update user workspace state" on public.user_workspace_state;
drop policy if exists "Allow delete user workspace state" on public.user_workspace_state;

create policy "Allow read user workspace state"
  on public.user_workspace_state
  for select
  using (true);

create policy "Allow insert user workspace state"
  on public.user_workspace_state
  for insert
  
  with check (true);

create policy "Allow update user workspace state"
  on public.user_workspace_state
  for update
  using (true)
  with check (true);

create policy "Allow delete user workspace state"
  on public.user_workspace_state
  for delete
  using (true);

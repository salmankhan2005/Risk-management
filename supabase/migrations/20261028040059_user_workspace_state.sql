create table public.user_workspace_state (
  user_id text primary key default (auth.jwt()->>'sub'),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_workspace_state_user_id_not_empty check (user_id <> ''),
  constraint user_workspace_state_state_object check (jsonb_typeof(state) = 'object')
);

alter table public.user_workspace_state enable row level security;
alter table public.user_workspace_state force row level security;

revoke all on table public.user_workspace_state from public, anon;
grant select, insert, update, delete on table public.user_workspace_state to authenticated;

create policy "Users can read their own workspace state"
  on public.user_workspace_state
  
  for select
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

create policy "Users can create their own workspace state"
  on public.user_workspace_state
  for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "Users can update their own workspace state"
  on public.user_workspace_state
  for update
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "Users can delete their own workspace state"
  on public.user_workspace_state
  for delete
  to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
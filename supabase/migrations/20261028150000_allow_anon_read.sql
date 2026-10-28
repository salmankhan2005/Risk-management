-- Migration 20261028150000_allow_anon_read.sql
-- Allow anon read access for public monitoring and demo exploration

grant select on table public.customers to anon;
grant select on table public.accounts to anon;
grant select on table public.transactions to anon;
grant select on table public.transfer_links to anon;
grant select on table public.merchants to anon;
grant select on table public.devices to anon;
grant select on table public.alerts to anon;
grant select on table public.cases to anon;
grant select on table public.risk_rules to anon;
grant select on table public.risk_rule_versions to anon;
grant select on table public.risk_evaluations to anon;
grant select on table public.risk_evaluation_evidence to anon;
grant select on table public.analyst_actions to anon;
grant select on table public.audit_events to anon;
grant select on table public.validation_runs to anon;
grant select on table public.validation_results to anon;
grant select on table public.generation_jobs to anon;

create policy "Anon can read customers" on public.customers for select to anon using (true);
create policy "Anon can read accounts" on public.accounts for select to anon using (true);
create policy "Anon can read transactions" on public.transactions for select to anon using (true);
create policy "Anon can read transfer_links" on public.transfer_links for select to anon using (true);
create policy "Anon can read merchants" on public.merchants for select to anon using (true);
create policy "Anon can read devices" on public.devices for select to anon using (true);
create policy "Anon can read alerts" on public.alerts for select to anon using (true);
create policy "Anon can read cases" on public.cases for select to anon using (true);
create policy "Anon can read rules" on public.risk_rules for select to anon using (true);
create policy "Anon can read rule versions" on public.risk_rule_versions for select to anon using (true);
create policy "Anon can read evaluations" on public.risk_evaluations for select to anon using (true);
create policy "Anon can read evidence" on public.risk_evaluation_evidence for select to anon using (true);
create policy "Anon can read actions" on public.analyst_actions for select to anon using (true);
create policy "Anon can read audit" on public.audit_events for select to anon using (true);
create policy "Anon can read validation_runs" on public.validation_runs for select to anon using (true);
create policy "Anon can read validation_results" on public.validation_results for select to anon using (true);
create policy "Anon can read generation_jobs" on public.generation_jobs for select to anon using (true);


-- ============================================================================
-- RiskWatch Core Domain Database Migration
-- Version: 20261028120000
-- Description: Core entities, constraints, bridge tables, atomic RPCs, and RLS.
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role_type as enum ('operations_analyst', 'risk_reviewer', 'system_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_status_type as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_tier_type as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status_type as enum ('ACTIVE', 'DORMANT', 'CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type as enum ('DEBIT', 'CREDIT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_status_type as enum ('POSTED', 'REVERSED', 'FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transfer_status_type as enum ('RECONCILED', 'IMBALANCED', 'FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rule_status_type as enum ('DRAFT', 'PUBLISHED', 'RETIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.severity_level as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_status_type as enum ('OPEN', 'INVESTIGATING', 'DISMISSED', 'ESCALATED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_status_type as enum ('OPEN', 'IN_REVIEW', 'CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_disposition_type as enum ('FALSE_POSITIVE', 'SUSPICIOUS_REPORTED', 'RESOLVED_BENIGN', 'POLICY_VIOLATION');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status_type as enum ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCEL_REQUESTED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.validation_severity_type as enum ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.validation_status_type as enum ('PASSED', 'FAILED', 'WARNING');
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 2. USER PROFILES & ROLES
-- ============================================================================
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  display_name text not null,
  email text not null,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.user_role_type not null,
  assigned_by text not null default 'system',
  created_at timestamptz not null default now(),
  unique(user_id, role)
);


-- ============================================================================
-- 3. CUSTOMERS, KYC, ACCOUNTS, OWNERSHIP, MERCHANTS, DEVICES
-- ============================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id text not null unique check (business_id ~ '^CUS-[0-9]{6}$'),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text not null default 'USA',
  risk_tier public.risk_tier_type not null default 'LOW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kyc_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  version integer not null default 1,
  status public.kyc_status_type not null default 'PENDING',
  verified_at timestamptz,
  risk_score numeric(5, 2) not null default 0.00 check (risk_score between 0 and 100),
  sanction_screened boolean not null default true,
  pep_status boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(customer_id, version)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  business_id text not null unique check (business_id ~ '^ACC-CUS-[0-9]{6}-[0-9]{2}$'),
  primary_customer_id uuid not null references public.customers(id) on delete restrict,
  account_type text not null default 'CHECKING',
  currency char(3) not null default 'USD',
  status public.account_status_type not null default 'ACTIVE',
  current_balance numeric(15, 2) not null default 0.00,
  overdraft_limit numeric(15, 2) not null default 0.00 check (overdraft_limit >= 0.00),
  allow_overdraft boolean not null default false,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_account_closed check (
    (status = 'CLOSED' and closed_at is not null) or
    (status <> 'CLOSED' and closed_at is null)
  ),
  constraint chk_balance_overdraft check (
    allow_overdraft = true or current_balance >= (-overdraft_limit)
  )
);

create table if not exists public.account_ownership (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  ownership_type text not null default 'PRIMARY',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  unique(account_id, customer_id, effective_from)
);

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null unique,
  name text not null,
  category_code char(4) not null,
  risk_level public.risk_tier_type not null default 'LOW',
  country char(3) not null default 'USA',
  is_high_risk boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  ip_address inet,
  device_type text not null default 'BROWSER',
  operating_system text,
  is_vpn boolean not null default false,
  is_tor boolean not null default false,
  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  first_observed_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  is_trusted boolean not null default true,
  unique(customer_id, device_id)
);


-- ============================================================================
-- 4. TRANSACTIONS & TRANSFERS
-- ============================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id text not null unique check (business_id ~ '^TXN-[0-9]{4}-[0-9]{8}$'),
  account_id uuid not null references public.accounts(id) on delete restrict,
  type public.transaction_type not null,
  amount numeric(15, 2) not null check (amount > 0.00),
  signed_amount numeric(15, 2) not null,
  currency char(3) not null default 'USD',
  balance_before numeric(15, 2) not null,
  balance_after numeric(15, 2) not null,
  status public.transaction_status_type not null default 'POSTED',
  channel text not null default 'WEB_PORTAL',
  merchant_id uuid references public.merchants(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  idempotency_key text unique,
  description text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_signed_amount check (
    (type = 'DEBIT' and signed_amount = -amount) or
    (type = 'CREDIT' and signed_amount = amount)
  ),
  constraint chk_balance_reconciliation check (
    balance_after = balance_before + signed_amount
  )
);

create table if not exists public.transfer_links (
  id uuid primary key default gen_random_uuid(),
  transfer_group_id text not null,
  source_transaction_id uuid not null references public.transactions(id) on delete restrict,
  destination_transaction_id uuid not null references public.transactions(id) on delete restrict,
  source_account_id uuid not null references public.accounts(id) on delete restrict,
  destination_account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(15, 2) not null check (amount > 0.00),
  currency char(3) not null default 'USD',
  status public.transfer_status_type not null default 'RECONCILED',
  linked_at timestamptz not null default now(),
  constraint chk_transfer_distinct_accounts check (source_account_id <> destination_account_id),
  constraint chk_transfer_distinct_transactions check (source_transaction_id <> destination_transaction_id),
  unique(source_transaction_id),
  unique(destination_transaction_id)
);


-- ============================================================================
-- 5. RISK RULES, VERSIONS, EVALUATION & EVIDENCE
-- ============================================================================
create table if not exists public.risk_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  name text not null,
  description text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.risk_rules(id) on delete cascade,
  version_number integer not null default 1,
  status public.rule_status_type not null default 'DRAFT',
  parameters jsonb not null default '{}'::jsonb,
  threshold_value numeric(15, 2) not null,
  time_window_minutes integer not null default 60,
  score_contribution numeric(5, 2) not null default 10.00 check (score_contribution between 0 and 100),
  severity public.severity_level not null default 'MEDIUM',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  published_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(rule_id, version_number)
);

create table if not exists public.risk_evaluations (
  id uuid primary key default gen_random_uuid(),
  rule_version_id uuid not null references public.risk_rule_versions(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  triggered boolean not null default false,
  observed_value numeric(15, 2) not null,
  threshold_snapshot numeric(15, 2) not null,
  score_awarded numeric(5, 2) not null default 0.00,
  explanation text not null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.risk_evaluation_evidence (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.risk_evaluations(id) on delete cascade,
  evidence_type text not null,
  source_record_id uuid not null,
  evidence_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 6. ALERTS & EVIDENCE BRIDGES
-- ============================================================================
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  business_id text not null unique check (business_id ~ '^ALT-[0-9]{4}-[0-9]{6}$'),
  account_id uuid not null references public.accounts(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status public.alert_status_type not null default 'OPEN',
  severity public.severity_level not null default 'MEDIUM',
  aggregate_score numeric(5, 2) not null check (aggregate_score between 0 and 100),
  summary text not null,
  deduplication_key text not null unique,
  assigned_to uuid references public.user_profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alert_transactions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  unique(alert_id, transaction_id)
);

create table if not exists public.alert_rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  evaluation_id uuid not null references public.risk_evaluations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(alert_id, evaluation_id)
);


-- ============================================================================
-- 7. CASES, BRIDGES & ANALYST ACTIONS
-- ============================================================================
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  business_id text not null unique check (business_id ~ '^CASE-[0-9]{4}-[0-9]{6}$'),
  customer_id uuid not null references public.customers(id) on delete restrict,
  title text not null,
  status public.case_status_type not null default 'OPEN',
  severity public.severity_level not null default 'MEDIUM',
  disposition public.case_disposition_type,
  assigned_to uuid references public.user_profiles(id) on delete set null,
  version integer not null default 1,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_case_disposition check (
    (status = 'CLOSED' and disposition is not null and closed_at is not null) or
    (status <> 'CLOSED' and disposition is null and closed_at is null)
  )
);

create table if not exists public.case_alerts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  joined_reason text not null default 'PRIMARY_ALERT',
  enrolled_at timestamptz not null default now(),
  unique(case_id, alert_id)
);

create table if not exists public.case_transactions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  evidence_weight numeric(3, 2) not null default 1.00,
  created_at timestamptz not null default now(),
  unique(case_id, transaction_id)
);

create table if not exists public.analyst_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_id text not null,
  action_type text not null,
  previous_status text,
  new_status text,
  disposition public.case_disposition_type,
  notes text,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 8. BACKGROUND JOBS, ANOMALIES, VALIDATION, GROUND TRUTH, EXPORTS
-- ============================================================================
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null default 'SYNTHETIC_DATASET',
  status public.job_status_type not null default 'PENDING',
  seed text not null default '20261022',
  target_customers integer not null default 5000,
  target_accounts integer not null default 7000,
  target_transactions integer not null default 100000,
  generated_customers integer not null default 0,
  generated_accounts integer not null default 0,
  generated_transactions integer not null default 0,
  generated_alerts integer not null default 0,
  current_stage text not null default 'INIT',
  progress_percent numeric(5, 2) not null default 0.00 check (progress_percent between 0 and 100),
  worker_id text,
  lease_heartbeat timestamptz,
  checkpoint_state jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.anomaly_manifest_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  scenario_name text not null,
  scenario_code text not null,
  target_entity_type text not null,
  target_entity_id text not null,
  injected_anomaly text not null,
  expected_validator text not null,
  is_detected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.validation_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.generation_jobs(id) on delete set null,
  status public.validation_status_type not null default 'PASSED',
  total_checks integer not null default 0,
  passed_checks integer not null default 0,
  failed_checks integer not null default 0,
  summary_metrics jsonb not null default '{}'::jsonb,
  executed_by text not null default 'system',
  created_at timestamptz not null default now()
);

create table if not exists public.validation_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.validation_runs(id) on delete cascade,
  check_code text not null,
  name text not null,
  category text not null,
  severity public.validation_severity_type not null default 'ERROR',
  status public.validation_status_type not null default 'PASSED',
  message text not null,
  violation_count integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Isolated ground truth table for benchmark metrics calculation
create table if not exists public.ground_truth_labels (
  id uuid primary key default gen_random_uuid(),
  dataset_seed text not null,
  entity_type text not null,
  entity_id text not null,
  true_risk_label text not null,
  scenario_provenance text not null,
  created_at timestamptz not null default now(),
  unique(dataset_seed, entity_type, entity_id)
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  format text not null default 'CSV',
  scope text not null default 'ALL_ENTITIES',
  status public.job_status_type not null default 'PENDING',
  file_path text,
  file_size_bytes bigint,
  sha256_checksum text,
  expires_at timestamptz,
  requested_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.dataset_manifests (
  id uuid primary key default gen_random_uuid(),
  seed text not null,
  manifest_version text not null default '1.0.0',
  counts jsonb not null default '{}'::jsonb,
  checksums jsonb not null default '{}'::jsonb,
  reproducibility_hash text not null,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 9. AUDIT & ENTITY STATE EVENTS (APPEND-ONLY)
-- ============================================================================
create table if not exists public.entity_state_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  previous_state text,
  new_state text not null,
  actor_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_summary text,
  after_summary text,
  reason text,
  request_id text,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 10. COMPOSITE INDEXES & PERFORMANCE OPTIMIZATIONS
-- ============================================================================
create index if not exists idx_accounts_customer on public.accounts(primary_customer_id, status);
create index if not exists idx_transactions_account_time on public.transactions(account_id, occurred_at desc);
create index if not exists idx_transactions_time_amount on public.transactions(occurred_at desc, amount desc);
create index if not exists idx_alerts_status_severity on public.alerts(status, severity, created_at desc);
create index if not exists idx_alerts_customer on public.alerts(customer_id, created_at desc);
create index if not exists idx_cases_status_assignee on public.cases(status, assigned_to, updated_at desc);
create index if not exists idx_analyst_actions_case on public.analyst_actions(case_id, created_at desc);
create index if not exists idx_audit_events_entity on public.audit_events(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_events_actor on public.audit_events(actor_id, created_at desc);
create index if not exists idx_gen_jobs_status on public.generation_jobs(status, created_at);


-- ============================================================================
-- 11. ATOMIC TRANSACTIONAL RPC FUNCTIONS
-- ============================================================================

-- A. Atomic Case Disposition RPC
create or replace function public.rpc_record_case_disposition(
  p_case_id uuid,
  p_actor_id text,
  p_disposition public.case_disposition_type,
  p_notes text,
  p_expected_version integer
)
returns public.cases
language plpgsql
security definer
as $$
declare
  v_case public.cases;
  v_old_status text;
  v_new_status text := 'CLOSED';
begin
  -- 1. Lock case with explicit optimistic version verification
  select * into v_case from public.cases where id = p_case_id for update;
  if not found then
    raise exception 'Case % not found', p_case_id using errcode = 'P0002';
  end if;

  if v_case.version <> p_expected_version then
    raise exception 'Case % version mismatch: expected %, found %', p_case_id, p_expected_version, v_case.version using errcode = '40001';
  end if;

  v_old_status := v_case.status::text;

  -- 2. Update case projection
  update public.cases
  set status = 'CLOSED',
      disposition = p_disposition,
      closed_at = now(),
      version = v_case.version + 1,
      updated_at = now()
  where id = p_case_id
  returning * into v_case;

  -- 3. Append immutable analyst action
  insert into public.analyst_actions (
    case_id, actor_id, action_type, previous_status, new_status, disposition, notes, created_at
  ) values (
    p_case_id, p_actor_id, 'DISPOSITION', v_old_status, v_new_status, p_disposition, p_notes, now()
  );

  -- 4. Append entity state event
  insert into public.entity_state_events (
    entity_type, entity_id, event_type, previous_state, new_state, actor_id, payload
  ) values (
    'CASE', p_case_id, 'CASE_DISPOSITION', v_old_status, v_new_status, p_actor_id,
    jsonb_build_object('disposition', p_disposition, 'notes', p_notes)
  );

  -- 5. Append audit event
  insert into public.audit_events (
    actor_id, action, entity_type, entity_id, before_summary, after_summary, reason
  ) values (
    p_actor_id, 'DISPOSITION', 'CASE', v_case.business_id,
    'Status: ' || v_old_status,
    'Status: CLOSED, Disposition: ' || p_disposition::text,
    p_notes
  );

  return v_case;
end;
$$;


-- B. Atomic Transaction Posting RPC
create or replace function public.rpc_post_transaction(
  p_account_id uuid,
  p_business_id text,
  p_type public.transaction_type,
  p_amount numeric,
  p_description text default null,
  p_channel text default 'API',
  p_merchant_id uuid default null,
  p_device_id uuid default null,
  p_idempotency_key text default null
)
returns public.transactions
language plpgsql
security definer
as $$
declare
  v_account public.accounts;
  v_signed_amount numeric(15, 2);
  v_new_balance numeric(15, 2);
  v_txn public.transactions;
begin
  -- Idempotency check
  if p_idempotency_key is not null then
    select * into v_txn from public.transactions where idempotency_key = p_idempotency_key;
    if found then
      return v_txn;
    end if;
  end if;

  -- 1. Lock and validate account
  select * into v_account from public.accounts where id = p_account_id for update;
  if not found then
    raise exception 'Account % not found', p_account_id using errcode = 'P0002';
  end if;

  if v_account.status = 'CLOSED' then
    raise exception 'Account % is closed and cannot accept transactions', v_account.business_id using errcode = '22000';
  end if;

  -- 2. Calculate signed amount and balance
  if p_type = 'DEBIT' then
    v_signed_amount := -p_amount;
  else
    v_signed_amount := p_amount;
  end if;

  v_new_balance := v_account.current_balance + v_signed_amount;

  -- 3. Overdraft policy check
  if v_new_balance < (-v_account.overdraft_limit) and v_account.allow_overdraft = false then
    raise exception 'Transaction breaches overdraft limit of % on account %', v_account.overdraft_limit, v_account.business_id using errcode = '22000';
  end if;

  -- 4. Insert transaction
  insert into public.transactions (
    business_id, account_id, type, amount, signed_amount, currency,
    balance_before, balance_after, status, channel, merchant_id, device_id,
    idempotency_key, description, occurred_at
  ) values (
    p_business_id, p_account_id, p_type, p_amount, v_signed_amount, v_account.currency,
    v_account.current_balance, v_new_balance, 'POSTED', p_channel, p_merchant_id, p_device_id,
    p_idempotency_key, p_description, now()
  ) returning * into v_txn;

  -- 5. Update account balance
  update public.accounts
  set current_balance = v_new_balance,
      updated_at = now()
  where id = p_account_id;

  return v_txn;
end;
$$;


-- ============================================================================
-- 12. ROW-LEVEL SECURITY & GRANTS
-- ============================================================================
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.kyc_profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_ownership enable row level security;
alter table public.merchants enable row level security;
alter table public.devices enable row level security;
alter table public.customer_devices enable row level security;
alter table public.transactions enable row level security;
alter table public.transfer_links enable row level security;
alter table public.risk_rules enable row level security;
alter table public.risk_rule_versions enable row level security;
alter table public.risk_evaluations enable row level security;
alter table public.risk_evaluation_evidence enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_transactions enable row level security;
alter table public.alert_rule_evaluations enable row level security;
alter table public.cases enable row level security;
alter table public.case_alerts enable row level security;
alter table public.case_transactions enable row level security;
alter table public.analyst_actions enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.anomaly_manifest_entries enable row level security;
alter table public.validation_runs enable row level security;
alter table public.validation_results enable row level security;
alter table public.ground_truth_labels enable row level security;
alter table public.export_jobs enable row level security;
alter table public.dataset_manifests enable row level security;
alter table public.entity_state_events enable row level security;
alter table public.audit_events enable row level security;

-- Authenticated roles read access for workbench views
grant select on all tables in schema public to authenticated;
grant insert, update on public.cases, public.analyst_actions, public.alerts, public.user_profiles to authenticated;
grant execute on function public.rpc_record_case_disposition to authenticated;
grant execute on function public.rpc_post_transaction to authenticated;

-- Policies: Authenticated users can view workbench records
create policy "Authenticated users can read customers" on public.customers for select to authenticated using (true);
create policy "Authenticated users can read kyc" on public.kyc_profiles for select to authenticated using (true);
create policy "Authenticated users can read accounts" on public.accounts for select to authenticated using (true);
create policy "Authenticated users can read transactions" on public.transactions for select to authenticated using (true);
create policy "Authenticated users can read alerts" on public.alerts for select to authenticated using (true);
create policy "Authenticated users can read cases" on public.cases for select to authenticated using (true);
create policy "Authenticated users can read rules" on public.risk_rules for select to authenticated using (true);
create policy "Authenticated users can read rule versions" on public.risk_rule_versions for select to authenticated using (true);
create policy "Authenticated users can read evaluations" on public.risk_evaluations for select to authenticated using (true);
create policy "Authenticated users can read evidence" on public.risk_evaluation_evidence for select to authenticated using (true);
create policy "Authenticated users can read actions" on public.analyst_actions for select to authenticated using (true);
create policy "Authenticated users can read audit" on public.audit_events for select to authenticated using (true);
create policy "Authenticated users can read jobs" on public.generation_jobs for select to authenticated using (true);

-- Ground truth isolation policy: Restricted to reviewer / admin evaluation
create policy "Ground truth evaluation isolation" on public.ground_truth_labels for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.user_profiles up on ur.user_id = up.id
      where up.clerk_id = (auth.jwt()->>'sub')
      and ur.role in ('risk_reviewer', 'system_admin')
    )
  );



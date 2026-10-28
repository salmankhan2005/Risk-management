-- Migration: Additional RPCs, indexes, and helper functions
-- Timestamp: 20261028130000

-- ─────────────────────────────────────────────────────────
-- rpc_assign_case
-- Atomically assigns (or unassigns) a case, records history,
-- and bumps the version. Actor comes from verified auth context.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_assign_case(
  p_case_id         UUID,
  p_assigned_to_id  UUID,
  p_expected_version INTEGER,
  p_notes           TEXT DEFAULT NULL
)
RETURNS SETOF public.cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id   UUID;
  v_case       public.cases%ROWTYPE;
  v_prev_status public.case_status_type;
  v_new_status  public.case_status_type;
BEGIN
  -- Get authenticated actor
  v_actor_id := (auth.jwt() ->> 'sub')::UUID;

  -- Lock and fetch the case
  SELECT * INTO v_case
  FROM public.cases
  WHERE id = p_case_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Case % does not exist', p_case_id;
  END IF;

  -- Optimistic concurrency check
  IF v_case.version != p_expected_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %',
      p_expected_version, v_case.version;
  END IF;

  v_prev_status := v_case.status;
  v_new_status := CASE
                    WHEN p_assigned_to_id IS NOT NULL AND v_case.status = 'OPEN'
                    THEN 'INVESTIGATING'::public.case_status_type
                    ELSE v_case.status
                  END;

  -- Apply assignment
  UPDATE public.cases
  SET
    assigned_to = p_assigned_to_id,
    status      = v_new_status,
    version     = v_case.version + 1,
    updated_at  = NOW()
  WHERE id = p_case_id
  RETURNING * INTO v_case;

  -- Append-only history in analyst_actions
  INSERT INTO public.analyst_actions (
    case_id, actor_id, action_type,
    previous_status, new_status, notes, created_at
  ) VALUES (
    p_case_id,
    v_actor_id,
    CASE WHEN p_assigned_to_id IS NULL THEN 'CASE_UNASSIGNED' ELSE 'CASE_ASSIGNED' END,
    v_prev_status,
    v_new_status,
    p_notes,
    NOW()
  );

  -- Audit event
  INSERT INTO public.audit_events (
    actor_id, action, entity_type, entity_id,
    before_summary, after_summary, reason, created_at
  ) VALUES (
    v_actor_id,
    CASE WHEN p_assigned_to_id IS NULL THEN 'CASE_UNASSIGNED' ELSE 'CASE_ASSIGNED' END,
    'case',
    p_case_id::TEXT,
    format('status: %s, assigned_to: %s, version: %s', v_prev_status, v_case.assigned_to, p_expected_version),
    format('status: %s, assigned_to: %s, version: %s', v_new_status, p_assigned_to_id, v_case.version),
    p_notes,
    NOW()
  );

  RETURN NEXT v_case;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- Performance indexes for common query paths
-- ─────────────────────────────────────────────────────────

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_risk_tier ON public.customers (risk_tier);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);

-- Accounts
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON public.accounts (primary_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts (status);

-- Transactions - critical for velocity rule and time-window queries
CREATE INDEX IF NOT EXISTS idx_transactions_account_id_occurred ON public.transactions (account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON public.transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_account_id ON public.alerts (account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_customer_id ON public.alerts (customer_id);

-- Cases
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_severity ON public.cases (severity);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.cases (assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_opened_at ON public.cases (opened_at DESC);

-- Risk evaluations - for rule evidence lookups
CREATE INDEX IF NOT EXISTS idx_risk_evals_rule_version ON public.risk_evaluations (rule_version_id);
CREATE INDEX IF NOT EXISTS idx_risk_evals_entity ON public.risk_evaluations (entity_type, entity_id);

-- Generation jobs
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON public.generation_jobs (status);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_created_at ON public.generation_jobs (created_at DESC);

-- Audit events
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON public.audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.audit_events (created_at DESC);

-- ─────────────────────────────────────────────────────────
-- Dashboard aggregate view for fast summary reads
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM public.customers)                                AS total_customers,
  (SELECT COUNT(*) FROM public.accounts  WHERE status = 'ACTIVE')        AS active_accounts,
  (SELECT COUNT(*) FROM public.transactions WHERE occurred_at >= NOW() - INTERVAL '7 days') AS transactions_7d,
  (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE occurred_at >= NOW() - INTERVAL '7 days') AS volume_7d,
  (SELECT COUNT(*) FROM public.alerts WHERE status IN ('OPEN','INVESTIGATING'))    AS open_alerts,
  (SELECT COUNT(*) FROM public.alerts WHERE severity = 'CRITICAL' AND status IN ('OPEN','INVESTIGATING')) AS critical_alerts,
  (SELECT COUNT(*) FROM public.cases WHERE status NOT IN ('CLOSED'))       AS open_cases,
  (SELECT COUNT(*) FROM public.cases WHERE severity = 'CRITICAL' AND status NOT IN ('CLOSED')) AS critical_cases,
  NOW() AS as_of;

-- Grant read on view to authenticated and anon users
GRANT SELECT ON public.v_dashboard_summary TO authenticated, anon;

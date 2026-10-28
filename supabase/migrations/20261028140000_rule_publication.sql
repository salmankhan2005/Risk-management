-- Migration 20261028140000_rule_publication.sql
-- Function to atomically publish a new version of a risk rule and log audit event

create or replace function public.rpc_publish_risk_rule(
  p_rule_id uuid,
  p_parameters jsonb,
  p_threshold_value numeric,
  p_time_window_minutes int,
  p_score_contribution int,
  p_severity public.severity_level,
  p_actor_id text,
  p_reason text default 'Published updated rule version'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_next_version int;
  v_new_version_id uuid;
  v_rule_code text;
  v_previous_version int;
  v_result jsonb;
begin
  -- 1. Check rule exists
  select rule_code into v_rule_code
  from public.risk_rules
  where id = p_rule_id;

  if not found then
    raise exception 'Rule with id % does not exist', p_rule_id using errcode = 'P0002';
  end if;

  -- 2. Compute next version number
  select coalesce(max(version_number), 0) + 1, max(version_number)
  into v_next_version, v_previous_version
  from public.risk_rule_versions
  where rule_id = p_rule_id;

  -- 3. Retire previous published version if active
  update public.risk_rule_versions
  set status = 'RETIRED'::public.rule_status_type,
      effective_to = now()
  where rule_id = p_rule_id
    and status = 'PUBLISHED'::public.rule_status_type
    and effective_to is null;

  -- 4. Insert new published version
  insert into public.risk_rule_versions (
    rule_id,
    version_number,
    status,
    parameters,
    threshold_value,
    time_window_minutes,
    score_contribution,
    severity,
    effective_from,
    published_by,
    published_at
  ) values (
    p_rule_id,
    v_next_version,
    'PUBLISHED'::public.rule_status_type,
    p_parameters,
    p_threshold_value,
    p_time_window_minutes,
    p_score_contribution,
    p_severity,
    now(),
    p_actor_id,
    now()
  )
  returning id into v_new_version_id;

  -- 5. Append to audit trail
  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_summary,
    after_summary,
    reason,
    created_at
  ) values (
    p_actor_id,
    'RULE_VERSION_PUBLISHED',
    'RiskRuleVersion',
    v_new_version_id::text,
    format('Rule %s previous version: %s', v_rule_code, coalesce(v_previous_version::text, 'none')),
    format('Rule %s published version %s (score: %s, severity: %s)', v_rule_code, v_next_version, p_score_contribution, p_severity),
    p_reason,
    now()
  );

  -- 6. Return JSON summary
  v_result := jsonb_build_object(
    'versionId', v_new_version_id,
    'ruleId', p_rule_id,
    'ruleCode', v_rule_code,
    'versionNumber', v_next_version,
    'status', 'PUBLISHED',
    'scoreContribution', p_score_contribution,
    'severity', p_severity,
    'publishedBy', p_actor_id,
    'publishedAt', now()
  );

  return v_result;
end;
$$;

grant execute on function public.rpc_publish_risk_rule to authenticated, service_role;


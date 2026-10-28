import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess, validateBody } from '@/lib/api/server-helper';
import { RiskRuleVersionDTO } from '@/packages/contracts/src';
import { PublishRuleVersionRequestSchema } from '@/packages/contracts/src/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);

    // Look up rule first by id or rule_code
    const { data: rule } = await supabase
      .from('risk_rules')
      .select('id, rule_code')
      .or(`id.eq.${id},rule_code.eq.${id}`)
      .maybeSingle();

    const targetRuleId = rule?.id || id;

    const { data, error } = await supabase
      .from('risk_rule_versions')
      .select(`
        id, rule_id, version_number, status, parameters,
        threshold_value, time_window_minutes, score_contribution,
        severity, effective_from, effective_to, published_at
      `)
      .eq('rule_id', targetRuleId)
      .order('version_number', { ascending: false });

    if (error || !data || data.length === 0) {
      // Mock fallback version
      const fallbackVersion: RiskRuleVersionDTO = {
        id: `ver-${id}-1`,
        ruleId: id,
        versionNumber: 1,
        status: 'PUBLISHED',
        parameters: { threshold: 5, windowMinutes: 60 },
        thresholdValue: '5.00',
        timeWindowMinutes: 60,
        scoreContribution: 25,
        severity: 'MEDIUM',
        effectiveFrom: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
        publishedBy: 'System Administrator',
      };
      return jsonSuccess([fallbackVersion], { requestId, totalCount: 1 });
    }

    const versions: RiskRuleVersionDTO[] = data.map((v) => ({
      id: v.id,
      ruleId: v.rule_id,
      versionNumber: v.version_number,
      status: v.status,
      parameters: (v.parameters as Record<string, unknown>) || {},
      thresholdValue: String(v.threshold_value || '0.00'),
      timeWindowMinutes: v.time_window_minutes,
      scoreContribution: v.score_contribution,
      severity: v.severity,
      effectiveFrom: v.effective_from,
      effectiveTo: v.effective_to,
      publishedAt: v.published_at,
    }));

    return jsonSuccess(versions, { requestId, totalCount: versions.length });
  } catch (err) {
    console.error(`[GET /api/v1/rules/${id}/versions]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch rule versions', requestId);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  const { data: body, error: valError } = await validateBody(
    request,
    PublishRuleVersionRequestSchema,
    requestId
  );
  if (valError) return valError;

  try {
    const supabase = createServerSupabaseClient(request);

    // Look up rule first by id or rule_code
    const { data: rule, error: ruleErr } = await supabase
      .from('risk_rules')
      .select('id, rule_code')
      .or(`id.eq.${id},rule_code.eq.${id}`)
      .maybeSingle();

    if (ruleErr || !rule) {
      return jsonError(404, 'NOT_FOUND', `Risk rule '${id}' was not found`, requestId);
    }

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('rpc_publish_risk_rule', {
      p_rule_id: rule.id,
      p_parameters: body.parameters,
      p_threshold_value: body.thresholdValue,
      p_time_window_minutes: body.timeWindowMinutes ?? null,
      p_score_contribution: body.scoreContribution,
      p_severity: body.severity,
      p_actor_id: 'System Analyst',
      p_reason: body.reason,
    });

    if (rpcErr) {
      console.error(`[POST /api/v1/rules/${id}/versions] RPC error:`, rpcErr);
      return jsonError(400, 'PUBLISH_FAILED', rpcErr.message, requestId);
    }

    return jsonSuccess(rpcResult, { requestId });
  } catch (err) {
    console.error(`[POST /api/v1/rules/${id}/versions]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to publish rule version', requestId);
  }
}

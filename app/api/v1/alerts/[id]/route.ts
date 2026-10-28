import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_ALERTS } from '@/lib/data';
import { AlertDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('alerts')
      .select(`
        id, business_id, account_id, customer_id, title, description,
        severity, status, score, rule_code, triggered_at, resolved_at,
        assigned_to_id, version,
        alert_rule_evaluations (
          id, rule_code, rule_version, triggered, score_contribution, explanation,
          evidence_summary
        )
      `)
      .or(`id.eq.${id},business_id.eq.${id}`)
      .maybeSingle();

    if (error || !row) {
      const mock = INITIAL_ALERTS.find((a) => a.id === id);
      if (!mock) return jsonError(404, 'NOT_FOUND', `Alert ${id} not found`, requestId);
      const alert: AlertDTO = {
        id: mock.id,
        businessId: mock.id,
        accountId: mock.linkedAccountIds?.[0] || 'ACC-DEFAULT',
        accountBusinessId: mock.linkedAccountIds?.[0] || 'ACC-DEFAULT',
        customerId: mock.linkedCustomerId || 'CUS-DEFAULT',
        customerName: 'Verified Account Holder',
        status: (mock.status === 'New' || mock.status === 'Open' ? 'OPEN' : 'INVESTIGATING') as AlertDTO['status'],
        severity: (mock.severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        aggregateScore: mock.riskScore || 50,
        summary: mock.evidenceSummary || mock.title,
        deduplicationKey: `dedupe_${mock.id}`,
        assignedToName: mock.assignedAnalyst || null,
        createdAt: mock.createdAt,
      };
      return jsonSuccess(alert, { requestId });
    }

    const alert: AlertDTO = {
      id: row.id,
      businessId: row.business_id,
      accountId: row.account_id,
      accountBusinessId: row.account_id,
      customerId: row.customer_id,
      status: row.status,
      severity: row.severity,
      aggregateScore: Number(row.score ?? 0),
      summary: row.description ?? 'Alert summary unavailable',
      deduplicationKey: `dedupe_${row.id}`,
      createdAt: row.triggered_at ?? new Date().toISOString(),
    };

    return jsonSuccess(alert, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/alerts/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch alert', requestId);
  }
}


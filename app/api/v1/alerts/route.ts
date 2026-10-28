import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_ALERTS } from '@/lib/data';
import { AlertDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const severity = searchParams.get('severity');

  try {
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query.limit(50);

    if (error || !data || data.length === 0) {
      const mapped: AlertDTO[] = INITIAL_ALERTS.map((a) => ({
        id: a.id,
        businessId: a.id,
        accountId: a.linkedAccountIds?.[0] || 'ACC-DEFAULT',
        accountBusinessId: a.linkedAccountIds?.[0] || 'ACC-DEFAULT',
        customerId: a.linkedCustomerId || 'CUS-DEFAULT',
        customerName: 'Verified Account Holder',
        status: (a.status === 'Open' || a.status === 'New' ? 'OPEN' : 'INVESTIGATING') as AlertDTO['status'],
        severity: (a.severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        aggregateScore: a.riskScore || 50,
        summary: a.evidenceSummary || a.title,
        deduplicationKey: `dedupe_${a.id}`,
        assignedToName: a.assignedAnalyst || null,
        createdAt: a.createdAt,
      }));
      return jsonSuccess(mapped, { requestId, totalCount: mapped.length });
    }

    const alerts: AlertDTO[] = data.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      accountId: row.account_id,
      accountBusinessId: row.account_id,
      customerId: row.customer_id,
      status: row.status,
      severity: row.severity,
      aggregateScore: Number(row.aggregate_score ?? row.score ?? 0),
      summary: row.summary ?? row.description ?? 'Alert summary unavailable',
      deduplicationKey: row.deduplication_key ?? `dedupe_${row.id}`,
      createdAt: row.created_at,
    }));

    return jsonSuccess(alerts, { requestId, totalCount: alerts.length });
  } catch {
    return jsonSuccess([], { requestId, totalCount: 0 });
  }
}


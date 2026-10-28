import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_CASES } from '@/lib/data';
import { CaseDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const severity = searchParams.get('severity');

  try {
    let query = supabase.from('cases').select('*').order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query.limit(50);

    if (error || !data || data.length === 0) {
      const mapped: CaseDTO[] = INITIAL_CASES.map((c) => ({
        id: c.id,
        businessId: c.id,
        customerId: c.linkedCustomerIds?.[0] || 'CUS-DEFAULT',
        customerName: 'Account Owner',
        title: c.title,
        status: (c.status === 'Closed' ? 'CLOSED' : c.status === 'Investigating' ? 'IN_REVIEW' : 'OPEN') as CaseDTO['status'],
        severity: (c.severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        disposition: (c.disposition ? 'RESOLVED_BENIGN' : null) as CaseDTO['disposition'],
        assignedToName: c.assignedAnalyst || null,
        version: 1,
        alertsCount: c.linkedAlertIds?.length || 0,
        openedAt: c.createdAt,
        updatedAt: c.createdAt,
      }));
      return jsonSuccess(mapped, { requestId, totalCount: mapped.length });
    }

    const cases: CaseDTO[] = data.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      disposition: row.disposition,
      version: row.version,
      alertsCount: Number(row.alerts_count ?? 0),
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      updatedAt: row.updated_at,
    }));

    return jsonSuccess(cases, { requestId, totalCount: cases.length });
  } catch {
    return jsonSuccess([], { requestId, totalCount: 0 });
  }
}


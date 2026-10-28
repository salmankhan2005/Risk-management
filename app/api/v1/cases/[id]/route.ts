import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_CASES } from '@/lib/data';
import { CaseDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('cases')
      .select(`
        id, business_id, customer_id, title, description, status, severity,
        disposition, assigned_to_id, version, opened_at, closed_at, updated_at,
        analyst_actions (
          id, action_type, actor_id, occurred_at, notes, before_state, after_state
        )
      `)
      .or(`id.eq.${id},business_id.eq.${id}`)
      .maybeSingle();

    if (error || !row) {
      const mock = INITIAL_CASES.find((c) => c.id === id);
      if (!mock) return jsonError(404, 'NOT_FOUND', `Case ${id} not found`, requestId);
      const caseDTO: CaseDTO = {
        id: mock.id,
        businessId: mock.id,
        customerId: mock.linkedCustomerIds?.[0] || 'CUS-DEFAULT',
        customerName: 'Account Owner',
        title: mock.title,
        status: (mock.status === 'Closed' ? 'CLOSED' : mock.status === 'Investigating' ? 'IN_REVIEW' : 'OPEN') as CaseDTO['status'],
        severity: (mock.severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        disposition: null,
        assignedToName: mock.assignedAnalyst || null,
        version: 1,
        alertsCount: mock.linkedAlertIds?.length || 0,
        openedAt: mock.createdAt,
        updatedAt: mock.createdAt,
      };
      return jsonSuccess(caseDTO, { requestId });
    }

    const caseDTO: CaseDTO = {
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      disposition: row.disposition,
      version: row.version,
      alertsCount: 0,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      updatedAt: row.updated_at,
    };

    return jsonSuccess(caseDTO, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/cases/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch case', requestId);
  }
}


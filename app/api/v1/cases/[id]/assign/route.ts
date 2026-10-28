import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess, validateBody } from '@/lib/api/server-helper';
import { z } from 'zod';
import { CaseDTO } from '@/packages/contracts/src';

const AssignCaseSchema = z.object({
  assignedToId: z.string().nullable(),
  expectedVersion: z.number().int().min(1),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const bodyResult = await validateBody(request, AssignCaseSchema, requestId);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { assignedToId, expectedVersion, notes } = bodyResult.data;

    // Get actor from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return jsonError(401, 'UNAUTHORIZED', 'Authentication required', requestId);
    }

    const supabase = createServerSupabaseClient(request);
    const { data, error } = await supabase.rpc('rpc_assign_case', {
      p_case_id: id,
      p_assigned_to_id: assignedToId,
      p_expected_version: expectedVersion,
      p_notes: notes || null,
    });

    if (error) {
      if (error.message.includes('VERSION_CONFLICT')) {
        return jsonError(409, 'VERSION_CONFLICT', 'Case was modified by another user. Refresh and retry.', requestId);
      }
      if (error.message.includes('NOT_FOUND')) {
        return jsonError(404, 'NOT_FOUND', `Case ${id} not found`, requestId);
      }
      return jsonError(500, 'DB_ERROR', error.message, requestId);
    }

    const row = data as Record<string, unknown>;
    const caseDTO: CaseDTO = {
      id: row.id as string,
      businessId: row.business_id as string,
      customerId: row.customer_id as string,
      title: row.title as string,
      status: row.status as CaseDTO['status'],
      severity: row.severity as CaseDTO['severity'],
      disposition: row.disposition as CaseDTO['disposition'],
      version: row.version as number,
      openedAt: row.opened_at as string,
      updatedAt: row.updated_at as string,
    };

    return jsonSuccess(caseDTO, { requestId });
  } catch (err) {
    console.error(`[POST /api/v1/cases/${id}/assign]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to assign case', requestId);
  }
}


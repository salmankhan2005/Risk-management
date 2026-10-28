import { NextRequest } from 'next/server';
import {
  createServerSupabaseClient,
  getRequestId,
  jsonError,
  jsonSuccess,
  validateBody,
} from '@/lib/api/server-helper';
import { CaseDispositionRequestSchema } from '@/packages/contracts/src';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  // 1. Validate payload schema
  const validation = await validateBody(request, CaseDispositionRequestSchema, requestId);
  if (validation.error) {
    return validation.error;
  }
  const { disposition, notes, expectedVersion } = validation.data;

  // 2. Resolve actor
  const { data: { user } } = await supabase.auth.getUser();
  const actorId = user?.email || user?.id || 'analyst@riskwatch.local';

  // 3. Call atomic RPC
  const { data, error } = await supabase.rpc('rpc_record_case_disposition', {
    p_case_id: caseId,
    p_actor_id: actorId,
    p_disposition: disposition,
    p_notes: notes,
    p_expected_version: expectedVersion,
  });

  if (error) {
    if (error.code === '40001' || error.message.includes('version mismatch')) {
      return jsonError(
        409,
        'CONCURRENT_CONFLICT',
        'Case was modified by another analyst. Please refresh and review latest state.',
        requestId
      );
    }
    return jsonError(422, 'RPC_DISPOSITION_ERROR', error.message, requestId);
  }

  return jsonSuccess(data, { requestId });
}


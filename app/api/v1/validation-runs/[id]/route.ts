import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { ValidationRunDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('validation_runs')
      .select('id, job_id, dataset_seed, started_at, completed_at, status, summary')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return jsonError(404, 'NOT_FOUND', `Validation run ${id} not found`, requestId);
    }

    const run: ValidationRunDTO = {
      id: row.id,
      jobId: row.job_id,
      datasetSeed: row.dataset_seed,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      status: row.status,
      summary: row.summary,
    };

    return jsonSuccess(run, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/validation-runs/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch validation run', requestId);
  }
}


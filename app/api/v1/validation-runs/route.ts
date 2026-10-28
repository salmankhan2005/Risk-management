import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess, validateBody } from '@/lib/api/server-helper';
import { ValidationRunDTO } from '@/packages/contracts/src';
import { z } from 'zod';

const CreateValidationRunSchema = z.object({
  jobId: z.string().uuid().optional(),
  datasetSeed: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  try {
    const supabase = createServerSupabaseClient(request);
    const { data, error } = await supabase
      .from('validation_runs')
      .select('id, job_id, dataset_seed, started_at, completed_at, status, summary')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return jsonSuccess([], { requestId, totalCount: 0 });
    }

    const runs: ValidationRunDTO[] = (data || []).map((row) => ({
      id: row.id,
      jobId: row.job_id,
      datasetSeed: row.dataset_seed,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      status: row.status,
      summary: row.summary,
    }));

    return jsonSuccess(runs, { requestId, totalCount: runs.length });
  } catch (err) {
    console.error('[GET /api/v1/validation-runs]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch validation runs', requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const bodyResult = await validateBody(request, CreateValidationRunSchema, requestId);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { jobId, datasetSeed } = bodyResult.data;

    const supabase = createServerSupabaseClient(request);
    const { data, error } = await supabase
      .from('validation_runs')
      .insert({
        job_id: jobId || null,
        dataset_seed: datasetSeed || '20261022',
        status: 'PENDING',
      })
      .select('id, job_id, dataset_seed, started_at, status')
      .single();

    if (error || !data) {
      return jsonError(500, 'DB_ERROR', 'Failed to create validation run', requestId);
    }

    const run: ValidationRunDTO = {
      id: data.id,
      jobId: data.job_id,
      datasetSeed: data.dataset_seed,
      startedAt: data.started_at,
      status: data.status,
    };

    return jsonSuccess(run, { requestId });
  } catch (err) {
    console.error('[POST /api/v1/validation-runs]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to create validation run', requestId);
  }
}


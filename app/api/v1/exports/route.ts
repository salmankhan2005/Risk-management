import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess, validateBody } from '@/lib/api/server-helper';
import { z } from 'zod';

const CreateExportSchema = z.object({
  format: z.enum(['CSV', 'JSON', 'SQL']).default('JSON'),
  scope: z.enum(['FULL', 'TRANSACTIONS', 'ALERTS', 'CASES', 'GROUND_TRUTH']).default('FULL'),
  jobId: z.string().uuid().optional(),
  includeManifest: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const bodyResult = await validateBody(request, CreateExportSchema, requestId);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { format, scope, jobId, includeManifest } = bodyResult.data;

    const supabase = createServerSupabaseClient(request);
    const { data, error } = await supabase
      .from('export_jobs')
      .insert({
        format,
        scope,
        job_id: jobId || null,
        include_manifest: includeManifest,
        status: 'PENDING',
      })
      .select('id, format, scope, status, created_at')
      .single();

    if (error || !data) {
      return jsonError(500, 'DB_ERROR', 'Failed to create export job', requestId);
    }

    return jsonSuccess(
      {
        exportJobId: data.id,
        format: data.format,
        scope: data.scope,
        status: data.status,
        createdAt: data.created_at,
        message: 'Export job queued. Poll GET /api/v1/exports/:id for status.',
      },
      { requestId }
    );
  } catch (err) {
    console.error('[POST /api/v1/exports]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to create export job', requestId);
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  try {
    const supabase = createServerSupabaseClient(request);
    const { data, error } = await supabase
      .from('export_jobs')
      .select('id, format, scope, status, created_at, completed_at, file_url, checksum_sha256, error_message')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return jsonSuccess([], { requestId, totalCount: 0 });
    }

    return jsonSuccess(data || [], { requestId, totalCount: (data || []).length });
  } catch (err) {
    console.error('[GET /api/v1/exports]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch exports', requestId);
  }
}


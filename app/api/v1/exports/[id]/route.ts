import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('export_jobs')
      .select('id, format, scope, status, created_at, completed_at, file_url, checksum_sha256, error_message')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return jsonError(404, 'NOT_FOUND', `Export job ${id} not found`, requestId);
    }

    return jsonSuccess(row, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/exports/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch export job', requestId);
  }
}


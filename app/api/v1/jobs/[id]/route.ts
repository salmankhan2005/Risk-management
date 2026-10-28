import { NextRequest } from 'next/server';
import {
  createServerSupabaseClient,
  getRequestId,
  jsonError,
  jsonSuccess,
} from '@/lib/api/server-helper';
import { GenerationJobDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    return jsonError(404, 'JOB_NOT_FOUND', `Job ${jobId} was not found.`, requestId);
  }

  const dto: GenerationJobDTO = {
    id: data.id,
    jobType: data.job_type,
    status: data.status,
    seed: data.seed,
    targetCustomers: data.target_customers,
    targetAccounts: data.target_accounts,
    targetTransactions: data.target_transactions,
    generatedCustomers: data.generated_customers,
    generatedAccounts: data.generated_accounts,
    generatedTransactions: data.generated_transactions,
    generatedAlerts: data.generated_alerts,
    currentStage: data.current_stage,
    progressPercent: Number(data.progress_percent),
    errorMessage: data.error_message,
    createdAt: data.created_at,
    startedAt: data.started_at,
    completedAt: data.completed_at,
  };

  return jsonSuccess(dto, { requestId });
}


import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  getRequestId,
  jsonError,
  validateBody,
} from '@/lib/api/server-helper';
import { GenerationJobRequestSchema } from '@/packages/contracts/src';

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  const validation = await validateBody(request, GenerationJobRequestSchema, requestId);
  if (validation.error) {
    return validation.error;
  }

  const { seed, targetCustomers, targetAccounts, targetTransactions } = validation.data;

  const { data, error } = await supabase
    .from('generation_jobs')
    .insert({
      job_type: 'SYNTHETIC_DATASET',
      status: 'PENDING',
      seed,
      target_customers: targetCustomers,
      target_accounts: targetAccounts,
      target_transactions: targetTransactions,
      current_stage: 'QUEUED',
      progress_percent: 0.0,
    })
    .select('*')
    .single();

  if (error) {
    return jsonError(500, 'JOB_SUBMISSION_FAILED', error.message, requestId);
  }

  return NextResponse.json(
    {
      data: {
        jobId: data.id,
        status: data.status,
        seed: data.seed,
        targetTransactions: data.target_transactions,
        createdAt: data.created_at,
      },
      meta: { requestId },
    },
    { status: 202 }
  );
}


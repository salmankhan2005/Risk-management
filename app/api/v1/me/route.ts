import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  // Attempt to read current user from Supabase auth
  const { data: { user } } = await supabase.auth.getUser();

  const userProfile = {
    userId: user?.id || 'demo_user',
    displayName: user?.email ? user.email.split('@')[0] : 'Neha Sen (Analyst)',
    email: user?.email || 'neha.sen@riskwatch.local',
    roles: ['operations_analyst', 'risk_reviewer'],
    permissions: [
      'cases:read',
      'cases:annotate',
      'cases:disposition',
      'alerts:read',
      'transactions:read',
      'rules:simulate',
    ],
  };

  return jsonSuccess(userProfile, { requestId });
}


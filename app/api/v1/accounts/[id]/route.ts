import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_ACCOUNTS } from '@/lib/data';
import { AccountDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('accounts')
      .select(`
        id, business_id, customer_id, account_type, status, currency,
        current_balance, opened_at, closed_at, overdraft_allowed,
        overdraft_limit, last_transaction_at, risk_score, risk_tier
      `)
      .or(`id.eq.${id},business_id.eq.${id}`)
      .maybeSingle();

    if (error || !row) {
      const mock = INITIAL_ACCOUNTS.find((a) => a.id === id);
      if (!mock) return jsonError(404, 'NOT_FOUND', `Account ${id} not found`, requestId);
      const account: AccountDTO = {
        id: mock.id,
        businessId: mock.id,
        primaryCustomerId: mock.customerId,
        accountType: (mock.accountType.toUpperCase() as 'SAVINGS' | 'CURRENT' | 'CORPORATE' | 'ESCROW'),
        status: (mock.status.toUpperCase() as 'ACTIVE' | 'DORMANT' | 'CLOSED'),
        currency: mock.currency as 'INR' | 'USD' | 'EUR',
        currentBalance: mock.currentBalance.toFixed(2),
        openedAt: mock.openedAt,
        closedAt: mock.closedAt ?? null,
        allowOverdraft: mock.overdraftAllowed,
        overdraftLimit: mock.overdraftLimit.toFixed(2),
      };
      return jsonSuccess(account, { requestId });
    }

    const account: AccountDTO = {
      id: row.id,
      businessId: row.business_id,
      primaryCustomerId: row.customer_id,
      accountType: row.account_type,
      status: row.status,
      currency: row.currency,
      currentBalance: row.current_balance,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      allowOverdraft: row.overdraft_allowed,
      overdraftLimit: row.overdraft_limit,
    };

    return jsonSuccess(account, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/accounts/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch account', requestId);
  }
}


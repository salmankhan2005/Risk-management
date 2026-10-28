import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_ACCOUNTS } from '@/lib/data';
import { AccountDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const cursor = searchParams.get('cursor');
  const customerId = searchParams.get('customerId');
  const status = searchParams.get('status');

  try {
    const supabase = createServerSupabaseClient(request);
    let query = supabase
      .from('accounts')
      .select('id, business_id, customer_id, account_type, status, currency, current_balance, opened_at, closed_at, overdraft_allowed, overdraft_limit, last_transaction_at, risk_score, risk_tier')
      .order('opened_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt('opened_at', cursor);
    if (customerId) query = query.eq('customer_id', customerId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const accounts: AccountDTO[] = INITIAL_ACCOUNTS.slice(0, limit).map((a) => ({
        id: a.id,
        businessId: a.id,
        primaryCustomerId: a.customerId,
        accountType: (a.accountType.toUpperCase() as 'SAVINGS' | 'CURRENT' | 'CORPORATE' | 'ESCROW'),
        status: (a.status.toUpperCase() as 'ACTIVE' | 'DORMANT' | 'CLOSED'),
        currency: a.currency as 'INR' | 'USD' | 'EUR',
        currentBalance: a.currentBalance.toFixed(2),
        openedAt: a.openedAt,
        overdraftLimit: a.overdraftLimit.toFixed(2),
        allowOverdraft: a.overdraftAllowed,
        closedAt: null,
      }));
      return jsonSuccess(accounts, { requestId, totalCount: accounts.length });
    }

    const hasMore = data.length > limit;
    const rows = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? rows[rows.length - 1].opened_at : null;

    const accounts: AccountDTO[] = rows.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      primaryCustomerId: row.customer_id,
      accountType: row.account_type,
      status: row.status,
      currency: row.currency,
      currentBalance: row.current_balance,
      openedAt: row.opened_at,
      overdraftLimit: row.overdraft_limit,
      allowOverdraft: row.overdraft_allowed,
      closedAt: row.closed_at,
    }));

    return jsonSuccess(accounts, { requestId, nextCursor, hasMore, totalCount: accounts.length });
  } catch (err) {
    console.error('[GET /api/v1/accounts]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch accounts', requestId);
  }
}


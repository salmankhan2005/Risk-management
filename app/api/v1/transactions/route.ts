import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_TRANSACTIONS } from '@/lib/data';
import { TransactionDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);
  const { searchParams } = new URL(request.url);

  const accountId = searchParams.get('accountId');
  const type = searchParams.get('type');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

  try {
    let query = supabase.from('transactions').select('*').order('occurred_at', { ascending: false });

    if (accountId) query = query.eq('account_id', accountId);
    if (type) query = query.eq('type', type);

    const { data, error } = await query.limit(limit);

    if (error || !data || data.length === 0) {
      const mapped: TransactionDTO[] = INITIAL_TRANSACTIONS.slice(0, limit).map((t) => {
        const isDebit = t.direction === 'Debit';
        return {
          id: t.id,
          businessId: t.id,
          accountId: t.accountId,
          accountBusinessId: t.accountId,
          customerName: 'Customer ' + t.customerId,
          type: (isDebit ? 'DEBIT' : 'CREDIT') as 'DEBIT' | 'CREDIT',
          amount: t.amount.toFixed(2),
          signedAmount: (isDebit ? -t.amount : t.amount).toFixed(2),
          currency: 'USD',
          balanceBefore: (t.balanceBefore || 5000).toFixed(2),
          balanceAfter: (t.balanceAfter || 5000 + (isDebit ? -t.amount : t.amount)).toFixed(2),
          status: 'POSTED',
          channel: 'API',
          merchantName: t.merchantId || null,
          deviceFingerprint: t.deviceId || null,
          description: t.description || 'Standard transaction posting',
          occurredAt: t.timestamp,
        };
      });
      return jsonSuccess(mapped, { requestId, totalCount: mapped.length });
    }

    const txns: TransactionDTO[] = data.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      accountId: row.account_id,
      type: row.type,
      amount: row.amount,
      signedAmount: row.signed_amount,
      currency: row.currency,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      status: row.status,
      channel: row.channel,
      description: row.description,
      occurredAt: row.occurred_at,
    }));

    return jsonSuccess(txns, { requestId, totalCount: txns.length });
  } catch {
    return jsonSuccess([], { requestId, totalCount: 0 });
  }
}


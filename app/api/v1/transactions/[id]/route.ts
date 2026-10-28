import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_TRANSACTIONS } from '@/lib/data';
import { TransactionDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);
    const { data: row, error } = await supabase
      .from('transactions')
      .select(`
        id, business_id, account_id, type, amount, signed_amount, currency,
        balance_before, balance_after, status, channel, merchant_id, device_id,
        initiated_at, settled_at, description, risk_score, risk_tier,
        transfer_links!source_transaction_id (id, business_id, dest_account_id, reconciliation_status)
      `)
      .or(`id.eq.${id},business_id.eq.${id}`)
      .maybeSingle();

    if (error || !row) {
      const mock = INITIAL_TRANSACTIONS.find((t) => t.id === id);
      if (!mock) return jsonError(404, 'NOT_FOUND', `Transaction ${id} not found`, requestId);
      const isDebit = mock.direction === 'Debit';
      const txn: TransactionDTO = {
        id: mock.id,
        businessId: mock.id,
        accountId: mock.accountId,
        accountBusinessId: mock.accountId,
        customerName: 'Customer ' + mock.customerId,
        type: (isDebit ? 'DEBIT' : 'CREDIT') as 'DEBIT' | 'CREDIT',
        amount: mock.amount.toFixed(2),
        signedAmount: (isDebit ? -mock.amount : mock.amount).toFixed(2),
        currency: mock.currency as 'INR' | 'USD' | 'EUR',
        balanceBefore: (mock.balanceBefore || 5000).toFixed(2),
        balanceAfter: (mock.balanceAfter || 5000 + (isDebit ? -mock.amount : mock.amount)).toFixed(2),
        status: 'POSTED',
        channel: 'API',
        merchantId: mock.merchantId,
        deviceId: mock.deviceId,
        description: mock.description,
        occurredAt: mock.timestamp,
        initiatedAt: mock.timestamp,
        settledAt: mock.timestamp,
        riskScore: mock.riskScore,
        riskTier: 'MEDIUM',
      };
      return jsonSuccess(txn, { requestId });
    }

    const txn: TransactionDTO = {
      id: row.id,
      businessId: row.business_id,
      accountId: row.account_id,
      accountBusinessId: row.account_id,
      type: row.type,
      amount: row.amount,
      signedAmount: row.signed_amount,
      currency: row.currency,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      status: row.status,
      channel: row.channel,
      merchantId: row.merchant_id,
      deviceId: row.device_id,
      occurredAt: row.initiated_at ?? row.settled_at ?? new Date().toISOString(),
      initiatedAt: row.initiated_at,
      settledAt: row.settled_at,
      description: row.description,
      riskScore: row.risk_score,
      riskTier: row.risk_tier,
    };

    return jsonSuccess(txn, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/transactions/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch transaction', requestId);
  }
}


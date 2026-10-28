import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_CUSTOMERS } from '@/lib/data';
import { CustomerDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const cursor = searchParams.get('cursor');
  const status = searchParams.get('status');
  const riskTier = searchParams.get('riskTier');
  const kycStatus = searchParams.get('kycStatus');

  try {
    const supabase = createServerSupabaseClient(request);
    let query = supabase
      .from('customers')
      .select('id, business_id, display_name, email, phone, country, risk_tier, kyc_status, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt('created_at', cursor);
    if (status) query = query.eq('status', status);
    if (riskTier) query = query.eq('risk_tier', riskTier);
    if (kycStatus) query = query.eq('kyc_status', kycStatus);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to mock data
      const customers: CustomerDTO[] = INITIAL_CUSTOMERS.slice(0, limit).map((c) => ({
        id: c.id,
        businessId: c.id,
        displayName: c.displayName,
        email: c.email,
        phone: c.phone,
        country: c.country,
        riskTier: (c.riskTier.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        kycStatus: (c.kycStatus === 'Verified' ? 'VERIFIED' : c.kycStatus === 'Pending' ? 'PENDING' : 'REQUIRES_REVIEW') as 'VERIFIED' | 'PENDING' | 'REQUIRES_REVIEW' | 'REJECTED',
        status: (c.status.toUpperCase() as 'ACTIVE' | 'DORMANT' | 'SUSPENDED'),
        createdAt: c.createdAt,
        accountsCount: c.accountsCount,
      }));
      return jsonSuccess(customers, { requestId, totalCount: customers.length });
    }

    const hasMore = data.length > limit;
    const rows = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? rows[rows.length - 1].created_at : null;

    const customers: CustomerDTO[] = rows.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      displayName: row.display_name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      riskTier: row.risk_tier,
      kycStatus: row.kyc_status,
      status: row.status,
      createdAt: row.created_at,
    }));

    return jsonSuccess(customers, { requestId, nextCursor, hasMore, totalCount: customers.length });
  } catch (err) {
    console.error('[GET /api/v1/customers]', err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch customers', requestId);
  }
}


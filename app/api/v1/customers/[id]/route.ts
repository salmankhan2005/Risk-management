import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_CUSTOMERS, INITIAL_ACCOUNTS } from '@/lib/data';
import { CustomerDTO } from '@/packages/contracts/src';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient(request);

    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select(`
        id, business_id, display_name, email, phone, country,
        risk_tier, kyc_status, status, created_at,
        kyc_profiles (
          id, document_type, document_number_masked,
          id_score, pep_check_passed, sanction_check_passed, verified_at
        )
      `)
      .or(`id.eq.${id},business_id.eq.${id}`)
      .maybeSingle();

    if (customerError || !customerRow) {
      // Try mock data
      const mock = INITIAL_CUSTOMERS.find((c) => c.id === id);
      if (!mock) return jsonError(404, 'NOT_FOUND', `Customer ${id} not found`, requestId);

      const mockAccounts = INITIAL_ACCOUNTS.filter((a) => a.customerId === id);
      const customer: CustomerDTO = {
        id: mock.id,
        businessId: mock.id,
        displayName: mock.displayName,
        email: mock.email,
        phone: mock.phone,
        country: mock.country,
        riskTier: (mock.riskTier.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
        kycStatus: (mock.kycStatus === 'Verified' ? 'VERIFIED' : mock.kycStatus === 'Pending' ? 'PENDING' : 'REQUIRES_REVIEW') as 'VERIFIED' | 'PENDING' | 'REQUIRES_REVIEW' | 'REJECTED',
        status: (mock.status.toUpperCase() as 'ACTIVE' | 'DORMANT' | 'SUSPENDED'),
        createdAt: mock.createdAt,
        accountsCount: mockAccounts.length,
      };
      return jsonSuccess(customer, { requestId });
    }

    const customer: CustomerDTO = {
      id: customerRow.id,
      businessId: customerRow.business_id,
      displayName: customerRow.display_name,
      email: customerRow.email,
      phone: customerRow.phone,
      country: customerRow.country,
      riskTier: customerRow.risk_tier,
      kycStatus: customerRow.kyc_status,
      status: customerRow.status,
      createdAt: customerRow.created_at,
    };

    return jsonSuccess(customer, { requestId });
  } catch (err) {
    console.error(`[GET /api/v1/customers/${id}]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to fetch customer', requestId);
  }
}


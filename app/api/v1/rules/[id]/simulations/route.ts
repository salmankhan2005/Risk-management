import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonError, jsonSuccess, validateBody } from '@/lib/api/server-helper';
import { z } from 'zod';

const SimulateRuleSchema = z.object({
  draftConfig: z.record(z.string(), z.unknown()),
  timeWindowDays: z.number().int().min(1).max(90).default(7),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id } = await params;

  try {
    const bodyResult = await validateBody(request, SimulateRuleSchema, requestId);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { draftConfig, timeWindowDays } = bodyResult.data;
    const supabase = createServerSupabaseClient(request);

    // Fetch rule details
    const { data: rule } = await supabase
      .from('risk_rules')
      .select('id, rule_code, name, category')
      .or(`id.eq.${id},rule_code.eq.${id}`)
      .maybeSingle();

    const threshold = Number(draftConfig.thresholdValue ?? draftConfig.threshold ?? 5);

    // Run a lightweight simulation query against recent transactions
    const { data: sampleTxns } = await supabase
      .from('transactions')
      .select('id, business_id, amount, currency, status, occurred_at')
      .gte('occurred_at', new Date(Date.now() - timeWindowDays * 86400 * 1000).toISOString())
      .limit(100);

    const txns = sampleTxns || [];
    const matches = txns.filter((t) => {
      if (rule?.rule_code === 'RULE-LRG-01' || id.includes('LRG')) {
        return Number(t.amount) >= (threshold > 0 ? threshold : 50000);
      }
      return false;
    });

    const triggerCount = matches.length;

    return jsonSuccess(
      {
        ruleId: id,
        ruleCode: rule?.rule_code || id,
        timeWindowDays,
        simulatedAt: new Date().toISOString(),
        triggerCount,
        sampleMatches: matches.slice(0, 10),
      },
      { requestId }
    );
  } catch (err) {
    console.error(`[POST /api/v1/rules/${id}/simulations]`, err);
    return jsonError(500, 'INTERNAL_ERROR', 'Rule simulation failed', requestId);
  }
}

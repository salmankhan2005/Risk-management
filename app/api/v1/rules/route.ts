import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_RULES } from '@/lib/data';
import { RiskRuleDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  try {
    const { data, error } = await supabase.from('risk_rules').select('*').order('rule_code');

    if (error || !data || data.length === 0) {
      const mapped: RiskRuleDTO[] = INITIAL_RULES.map((r) => ({
        id: r.id,
        ruleCode: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
      }));
      return jsonSuccess(mapped, { requestId, totalCount: mapped.length });
    }

    const rules: RiskRuleDTO[] = data.map((row) => ({
      id: row.id,
      ruleCode: row.rule_code,
      name: row.name,
      description: row.description,
      category: row.category,
    }));

    return jsonSuccess(rules, { requestId, totalCount: rules.length });
  } catch {
    return jsonSuccess([], { requestId, totalCount: 0 });
  }
}


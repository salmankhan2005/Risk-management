import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getRequestId, jsonSuccess } from '@/lib/api/server-helper';
import { INITIAL_AUDIT } from '@/lib/data';
import { AuditEventDTO } from '@/packages/contracts/src';

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const supabase = createServerSupabaseClient(request);

  try {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      const mapped: AuditEventDTO[] = INITIAL_AUDIT.map((a) => ({
        id: a.id,
        actorId: a.actor,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        beforeSummary: a.beforeSummary,
        afterSummary: a.afterSummary,
        reason: a.reason,
        requestId: a.id,
        createdAt: a.timestamp,
      }));
      return jsonSuccess(mapped, { requestId, totalCount: mapped.length });
    }

    const events: AuditEventDTO[] = data.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      beforeSummary: row.before_summary,
      afterSummary: row.after_summary,
      reason: row.reason,
      requestId: row.request_id,
      createdAt: row.created_at,
    }));

    return jsonSuccess(events, { requestId, totalCount: events.length });
  } catch {
    return jsonSuccess([], { requestId, totalCount: 0 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError, ApiSuccess } from '@/packages/contracts/src';

export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const authHeader = request.headers.get('authorization');

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export function jsonSuccess<T>(data: T, meta: { requestId: string; nextCursor?: string | null; hasMore?: boolean; totalCount?: number }): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, meta }, { status: 200 });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  requestId: string,
  fieldErrors?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        fieldErrors,
        requestId,
      },
    },
    { status }
  );
}

export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  requestId: string
): Promise<{ data: T; error?: null } | { data?: null; error: NextResponse<ApiError> }> {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path.join('.') || 'body';
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      return {
        error: jsonError(400, 'VALIDATION_ERROR', 'The request payload failed validation.', requestId, fieldErrors),
      };
    }
    return { data: parsed.data };
  } catch {
    return {
      error: jsonError(400, 'INVALID_JSON', 'Malformed JSON in request body.', requestId),
    };
  }
}

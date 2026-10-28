import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/app/overview';
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.redirect(new URL('/sign-in?error=callback', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=callback', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=callback', request.url));
  }

  const destination = new URL(getSafeNextPath(requestUrl.searchParams.get('next')), request.url);
  if (destination.origin !== requestUrl.origin) {
    return NextResponse.redirect(new URL('/app/overview', request.url));
  }

  return NextResponse.redirect(destination);
}

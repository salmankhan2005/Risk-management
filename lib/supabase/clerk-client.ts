import { createClient } from '@supabase/supabase-js';

type ClerkTokenGetter = () => Promise<string | null>;

export function createClerkSupabaseClient(getToken: ClerkTokenGetter) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  return createClient(supabaseUrl, publishableKey, {
    accessToken: getToken,
  });
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

type ClerkTokenGetter = () => Promise<string | null>;

let publicClientInstance: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  if (!publicClientInstance) {
    publicClientInstance = createClient(supabaseUrl, publishableKey);
  }
  return publicClientInstance;
}

export function createClerkSupabaseClient(getToken?: ClerkTokenGetter): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  if (!getToken) {
    return getPublicSupabaseClient();
  }

  return createClient(supabaseUrl, publishableKey, {
    accessToken: async () => {
      try {
        const token = await getToken();
        return token;
      } catch {
        return null;
      }
    },
  });
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

// Create actual client if configured, otherwise create a mock or disabled instance
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export type SupabaseConnectionStatus = 'checking' | 'connected' | 'error' | 'unconfigured' | 'demo_mode';

/**
 * Real connectivity health-check against Supabase.
 * Does not pretend to show connectivity unless genuinely tested.
 */
export async function checkSupabaseHealth(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured) {
    return 'unconfigured';
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return 'error';
    }
    return 'connected';
  } catch {
    return 'error';
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve Supabase URL from Vite env vars (supports VITE_ and SUPABASE_ prefixes) or localStorage
export function getActiveSupabaseConfig() {
  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    (import.meta.env as unknown as Record<string, string>).SUPABASE_URL ||
    (import.meta.env as unknown as Record<string, string>).VITE_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (import.meta.env as unknown as Record<string, string>).SUPABASE_ANON_KEY ||
    (import.meta.env as unknown as Record<string, string>).SUPABASE_KEY ||
    (import.meta.env as unknown as Record<string, string>).VITE_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem('init_habits_custom_supabase_url') || '' : '').trim();
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem('init_habits_custom_supabase_key') || '' : '').trim();

  const url = (envUrl && !envUrl.includes('your-project-id')) ? envUrl : localUrl;
  const key = (envKey && !envKey.includes('your-publishable-key') && !envKey.includes('your-supabase')) ? envKey : localKey;

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('placeholder')
  );

  return {
    url,
    key,
    isConfigured,
    isFromLocalStorage: !envUrl && Boolean(localUrl),
  };
}

export function saveCustomSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('init_habits_custom_supabase_url', url.trim());
    localStorage.setItem('init_habits_custom_supabase_key', key.trim());
    localStorage.removeItem('init_habits_use_demo');
    window.location.reload();
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('init_habits_custom_supabase_url');
    localStorage.removeItem('init_habits_custom_supabase_key');
    window.location.reload();
  }
}

const config = getActiveSupabaseConfig();

export const isSupabaseConfigured = config.isConfigured;

// Create actual client if configured, otherwise create a mock or disabled instance
export const supabase: SupabaseClient = config.isConfigured
  ? createClient(config.url, config.key, {
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

export type SupabaseConnectionStatus = 'checking' | 'connected' | 'error' | 'unconfigured';

/**
 * Real connectivity health-check against Supabase.
 * Does not pretend to show connectivity unless genuinely tested.
 */
export async function checkSupabaseHealth(): Promise<SupabaseConnectionStatus> {
  const currentConfig = getActiveSupabaseConfig();
  if (!currentConfig.isConfigured) {
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

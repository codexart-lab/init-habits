import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, checkSupabaseHealth, SupabaseConnectionStatus } from '../lib/supabase';
import { Profile, UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  isDemoMode: boolean;
  connectionStatus: SupabaseConnectionStatus;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  enableDemoMode: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_ID = 'demo-terminal-user-0001';

const DEFAULT_DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  username: 'developer',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_SETTINGS: UserSettings = {
  user_id: DEMO_USER_ID,
  daily_goal: 70,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  preferences: {
    theme: 'neon-green',
    sound_enabled: false,
    compact_view: true,
    developer_quotes: true,
  },
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus>(
    isSupabaseConfigured ? 'checking' : 'unconfigured'
  );

  const fetchProfileAndSettings = async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      } else if (profileError && profileError.code === 'PGRST116') {
        // Record not found - fallback insert
        const fallbackUsername = user?.email ? user.email.split('@')[0] : 'user';
        const newProfile: Partial<Profile> = {
          id: userId,
          username: fallbackUsername,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        };
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
        if (created) setProfile(created as Profile);
      }

      // 2. Fetch Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        setSettings(settingsData as UserSettings);
      } else if (settingsError && settingsError.code === 'PGRST116') {
        const newSettings: Partial<UserSettings> = {
          user_id: userId,
          daily_goal: 70,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          preferences: {
            theme: 'neon-green',
            sound_enabled: false,
            compact_view: true,
            developer_quotes: true,
          },
        };
        const { data: createdSettings } = await supabase.from('user_settings').insert(newSettings).select().single();
        if (createdSettings) setSettings(createdSettings as UserSettings);
      }
    } catch (err) {
      console.error('Failed to load profile/settings:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        // Run in local terminal demo mode
        setIsDemoMode(true);
        setConnectionStatus('unconfigured');
        const storedProfile = localStorage.getItem('init_habits_demo_profile');
        const storedSettings = localStorage.getItem('init_habits_demo_settings');
        setProfile(storedProfile ? JSON.parse(storedProfile) : DEFAULT_DEMO_PROFILE);
        setSettings(storedSettings ? JSON.parse(storedSettings) : DEFAULT_DEMO_SETTINGS);
        setUser({
          id: DEMO_USER_ID,
          app_metadata: {},
          user_metadata: { username: 'developer' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'developer@init.habits',
        } as User);
        setLoading(false);
        return;
      }

      // Supabase is configured
      const health = await checkSupabaseHealth();
      if (mounted) setConnectionStatus(health);

      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        setIsDemoMode(false);
        await fetchProfileAndSettings(initialSession.user.id);
      } else {
        // Check if user specifically requested demo mode locally
        const demoPreference = localStorage.getItem('init_habits_use_demo');
        if (demoPreference === 'true') {
          setIsDemoMode(true);
          const storedProfile = localStorage.getItem('init_habits_demo_profile');
          const storedSettings = localStorage.getItem('init_habits_demo_settings');
          setProfile(storedProfile ? JSON.parse(storedProfile) : DEFAULT_DEMO_PROFILE);
          setSettings(storedSettings ? JSON.parse(storedSettings) : DEFAULT_DEMO_SETTINGS);
          setUser({
            id: DEMO_USER_ID,
            app_metadata: {},
            user_metadata: { username: 'developer' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: 'developer@init.habits',
          } as User);
        } else {
          setUser(null);
          setSession(null);
        }
      }
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user || null);
          if (newSession?.user) {
            setIsDemoMode(false);
            await fetchProfileAndSettings(newSession.user.id);
          } else {
            setProfile(null);
            setSettings(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const enableDemoMode = () => {
    localStorage.setItem('init_habits_use_demo', 'true');
    setIsDemoMode(true);
    setUser({
      id: DEMO_USER_ID,
      app_metadata: {},
      user_metadata: { username: 'developer' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'developer@init.habits',
    } as User);
    setProfile(DEFAULT_DEMO_PROFILE);
    setSettings(DEFAULT_DEMO_SETTINGS);
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) return { error };

      const needsConfirmation = data.user && !data.session;
      return { error: null, needsConfirmation: Boolean(needsConfirmation) };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Signup failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      localStorage.removeItem('init_habits_use_demo');
      setIsDemoMode(false);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('init_habits_use_demo');
      setUser(null);
      setProfile(null);
      setSettings(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSettings(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Failed to send reset email') };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (isDemoMode) {
      const updated = { ...profile, ...updates, updated_at: new Date().toISOString() } as Profile;
      setProfile(updated);
      localStorage.setItem('init_habits_demo_profile', JSON.stringify(updated));
      return { error: null };
    }

    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { error };
      setProfile(data as Profile);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Failed to update profile') };
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (isDemoMode) {
      const updated = { ...settings, ...updates, updated_at: new Date().toISOString() } as UserSettings;
      setSettings(updated);
      localStorage.setItem('init_habits_demo_settings', JSON.stringify(updated));
      return { error: null };
    }

    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { error };
      setSettings(data as UserSettings);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Failed to update settings') };
    }
  };

  const deleteAccount = async () => {
    if (isDemoMode) {
      localStorage.removeItem('init_habits_demo_profile');
      localStorage.removeItem('init_habits_demo_settings');
      localStorage.removeItem('init_habits_demo_habits');
      localStorage.removeItem('init_habits_demo_completions');
      localStorage.removeItem('init_habits_demo_xp');
      await signOut();
      return { error: null };
    }

    if (!user) return { error: new Error('Not authenticated') };

    try {
      // In Supabase, deleting habits/completions/profiles is cascade-handled by user deletion,
      // but client-side users can clear their data or call an administrative edge function.
      // We first clean user rows:
      await supabase.from('habits').delete().eq('user_id', user.id);
      await supabase.from('habit_completions').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      await signOut();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Account deletion failed') };
    }
  };

  const refreshUserData = async () => {
    if (user && !isDemoMode) {
      await fetchProfileAndSettings(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        settings,
        loading,
        isDemoMode,
        connectionStatus,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        updateSettings,
        deleteAccount,
        enableDemoMode,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

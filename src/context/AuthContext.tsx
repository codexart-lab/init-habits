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
  connectionStatus: SupabaseConnectionStatus;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
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
        setConnectionStatus('unconfigured');
        setUser(null);
        setSession(null);
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
        await fetchProfileAndSettings(initialSession.user.id);
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user || null);
          if (newSession?.user) {
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

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please connect Supabase URL and Publishable Key.') };
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
      return { error: new Error('Supabase is not configured. Please connect Supabase credentials.') };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signOut = async () => {
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
    if (!user) return { error: new Error('Not authenticated') };

    try {
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
    if (user) {
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
        connectionStatus,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        updateSettings,
        deleteAccount,
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

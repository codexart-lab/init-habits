-- Migration: 20261010_init_habits.sql
-- Description: Core schema, tables, constraints, RLS policies, triggers, and XP ledger for init.Habits
-- Fully idempotent: safe to execute multiple times in Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT 'user',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal INTEGER NOT NULL DEFAULT 70 CHECK (daily_goal >= 0 AND daily_goal <= 100),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    preferences JSONB NOT NULL DEFAULT '{"theme": "neon-green", "sound_enabled": false, "compact_view": true}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    emoji TEXT NOT NULL DEFAULT '🎯',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    target_value NUMERIC DEFAULT 1 CHECK (target_value > 0),
    target_unit TEXT DEFAULT 'times',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Habit Completions Table
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completed_on DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_habit_completed_on UNIQUE (habit_id, completed_on)
);

-- 5. XP Ledger Table
CREATE TABLE IF NOT EXISTS public.xp_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completion_id UUID NOT NULL REFERENCES public.habit_completions(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL DEFAULT 15 CHECK (xp_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_xp_completion UNIQUE (user_id, habit_id, completion_id)
);

-- Indexes for high-performance queries
CREATE INDEX IF NOT EXISTS idx_habits_user_active_pos ON public.habits(user_id, is_active, position);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON public.habit_completions(user_id, completed_on);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON public.habit_completions(habit_id, completed_on);
CREATE INDEX IF NOT EXISTS idx_xp_user ON public.xp_ledger(user_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (with DROP IF EXISTS to ensure idempotency)
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_settings_updated ON public.user_settings;
CREATE TRIGGER on_user_settings_updated
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_habits_updated ON public.habits;
CREATE TRIGGER on_habits_updated
    BEFORE UPDATE ON public.habits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatic XP awarding trigger on habit completion
CREATE OR REPLACE FUNCTION public.handle_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.xp_ledger (user_id, habit_id, completion_id, xp_amount)
        VALUES (NEW.user_id, NEW.habit_id, NEW.id, 15)
        ON CONFLICT (user_id, habit_id, completion_id) DO NOTHING;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM public.xp_ledger
        WHERE completion_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_habit_completion_xp ON public.habit_completions;
CREATE TRIGGER on_habit_completion_xp
    AFTER INSERT OR DELETE ON public.habit_completions
    FOR EACH ROW EXECUTE FUNCTION public.handle_completion_xp();

-- Automatic profile and settings creation upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    clean_username TEXT;
BEGIN
    clean_username := COALESCE(
        SPLIT_PART(NEW.email, '@', 1),
        'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
    );

    INSERT INTO public.profiles (id, username, timezone)
    VALUES (NEW.id, clean_username, 'UTC')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id, daily_goal, timezone)
    VALUES (NEW.id, 70, 'UTC')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- User Settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Habits policies
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- Habit Completions policies
DROP POLICY IF EXISTS "Users can view their own completions" ON public.habit_completions;
CREATE POLICY "Users can view their own completions"
    ON public.habit_completions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own completions for owned habits" ON public.habit_completions;
CREATE POLICY "Users can insert their own completions for owned habits"
    ON public.habit_completions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE habits.id = habit_completions.habit_id
            AND habits.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own completions" ON public.habit_completions;
CREATE POLICY "Users can delete their own completions"
    ON public.habit_completions FOR DELETE
    USING (auth.uid() = user_id);

-- XP Ledger policies (Read-only for users; inserts/deletes occur through security definer trigger)
DROP POLICY IF EXISTS "Users can view their own XP ledger" ON public.xp_ledger;
CREATE POLICY "Users can view their own XP ledger"
    ON public.xp_ledger FOR SELECT
    USING (auth.uid() = user_id);

-- Function to seed starter habits for a user
CREATE OR REPLACE FUNCTION public.seed_starter_habits(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.habits (user_id, name, emoji, category, position) VALUES
        (target_user_id, 'Wake up (6 am)', '⏰', 'Morning', 1),
        (target_user_id, 'DSA (1hrs)', '📚', 'Learning', 2),
        (target_user_id, 'Meditation', '🧘', 'Mindfulness', 3),
        (target_user_id, 'No fake dopamine', '📱', 'Focus', 4),
        (target_user_id, 'Water intake (2.5 litres)', '💧', 'Health', 5),
        (target_user_id, 'Plan next day', '📋', 'Productivity', 6),
        (target_user_id, 'Maintain GitHub/LeetCode streak', '💻', 'Coding', 7),
        (target_user_id, 'Read Atomic Habits', '📗', 'Reading', 8),
        (target_user_id, 'Sleep before 11PM', '🌙', 'Health', 9)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

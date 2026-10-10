# init.Habits — Terminal-Style Habit Tracker

> `user@init.Habits $ daily`
> 
> *A minimalist, high-performance personal habit-tracking environment that feels like using a modern developer terminal tool.*

---

## 1. Product Vision & Visual Design

`init.Habits` is designed for engineers, coders, and terminal enthusiasts. Instead of generic SaaS cards, bloated graphics, and sluggish animations, it delivers a high-density, keyboard-friendly command-line dashboard:

- **Near-Black Background**: `#050505` terminal canvas.
- **Neon Green Accent**: `#4ADE65` (`rgb(74, 222, 101)`) for prompt markers, active tabs, completed commits, and streak flames.
- **Monospace Typography**: JetBrains Mono & IBM Plex Mono.
- **Terminal Aesthetics**: ASCII progress bars (`████████████████░░░░ 70%`), terminal prompt headers (`user@init.Habits $ daily`), blinking cursors, and custom slim dark scrollbars.
- **Theme Engine**: Selectable terminal aesthetics in Profile settings:
  - Neon Green (`#4ADE65`)
  - Matrix Emerald (`#10B981`)
  - Amber CRT (`#F59E0B`)
  - Cyberpunk Cyan (`#06B6D4`)
  - Monochrome Silver (`#E4E4E7`)
- **Mobile-First Responsiveness**: Designed for Android phones and Termux users, supporting 360px viewports with touch-friendly targets, no horizontal page overflow, and responsive horizontal scrolling on the 52-week heatmap.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom terminal design tokens
- **Icons**: Lucide React
- **Celebrations**: Canvas-Confetti (disabled automatically if `prefers-reduced-motion` is active)
- **Database & Auth**: Supabase (`@supabase/supabase-js`, PostgreSQL, Supabase Auth, Row Level Security)
- **Testing**: Vitest unit testing suite (streaks, dates, XP curves, statistics)
- **Hosting**: Cloudflare Pages (with `_redirects` SPA routing and `_headers` security)

---

## 3. Features Implemented

### A. Navigation & Terminal Header
- Compact terminal header showing active command (`$ daily`, `$ stats --all`, `$ config --user`).
- Live application status indicator (`CONNECTED`, `DEMO_MODE`, `CHECKING`, `DISCONNECTED`, `UNCONFIGURED`) without faking server connectivity.
- Three primary tabs with neon-green underline:
  1. `Habits` (`1`)
  2. `Stats` (`2`)
  3. `Profile` (`3`)
- Keyboard navigation: press `1`, `2`, or `3` anywhere outside text fields to switch tabs.

### B. Habits Dashboard
- **Developer Quotes Banner**: Rotating dev-style quotes (e.g. `// the irony of tracking habits: it's a habit you have to build first.`).
- **Compact 7-Day Calendar**:
  - Full Monday–Sunday strip.
  - Previous (`<`) and next (`>`) week navigation.
  - Quick `$ cd today` reset button.
  - Distinct highlights for today's date vs. selected date.
  - Daily completion dot indicators.
  - Timezone-aware date calculations.
- **Habit Rows**:
  - Terminal checkbox (`[ ]` / `[x]`).
  - Star / favorite indicator (`★` / `☆`).
  - Emoji picker and custom emoji support.
  - Habit title and category hashtag.
  - Timezone-aware streak counter (`🔥 8d`).
  - Action menu: View Statistics, Edit Habit, Move Up / Down reordering, Archive / Restore, and Delete with double confirmation.
- **Optimistic Updates & Rollback**:
  - Checkbox toggles trigger immediate UI updates and celebratory micro-confetti.
  - If a network request or database write fails, the UI automatically rolls back and displays a notification toast.
- **Onboarding Starter Habits**:
  - Optional starter modal featuring 10 curated developer habits:
    - ⏰ Wake up (6 am)
    - 📚 DSA (1hrs)
    - 🧘 Meditation
    - 📱 No fake dopamine
    - 💧 Water intake (2.5 litres)
    - 📋 Plan next day
    - 🧘 No masturbation
    - 💻 Maintain GitHub/LeetCode streak
    - 📗 Read Atomic Habits
    - 🌙 Sleep before 11PM
- **Daily Progress Bar**:
  - ASCII bar (`████████████████░░░░ 70% [7/10]`).
  - User-configurable daily goal indicator (`// goal: 70% — met ✓`).

### C. Statistics Dashboard
- **Activity Metrics**:
  - Total completions in last 30 days.
  - Number of active habits.
  - Number of categories / routines.
  - Best-performing habit (highest current streak).
  - Habit needing attention (longest elapsed days since last completion).
  - Most improved habit (completions in last 14 days vs. prior 14 days).
  - Clearly distinguishes unavailable statistics (`// [N/A]`) from zero values.
- **52-Week GitHub-style Contribution Heatmap**:
  - 364-cell grid spanning the past 12 months.
  - Green intensity based on daily completions (0 to 4+).
  - Month and weekday labels.
  - Responsive horizontal scrolling for mobile devices.
  - Tap / hover tooltips displaying date and completion count.
- **Idempotent XP & Level System**:
  - XP progression curve: `Threshold(Level) = 50 * (Level - 1) * Level`.
  - Base reward: `+15 XP` per habit completion.
  - Developer rank titles: Script Apprentice (Lvl 1), Junior Engineer (Lvl 2), Full-Stack Developer (Lvl 3), Senior Systems Hacker (Lvl 4), Staff Architect (Lvl 5), Principal Kernel Master (Lvl 6+).
  - XP progress bar toward the next tier and remaining XP calculation.
  - Anti-duplication guarded by database unique constraints and idempotency checks.
- **Top Habits Leaderboard**:
  - Ranks top 5 active habits by current streak.
  - Click any habit in the leaderboard or action menu to inspect its individual statistics modal (streak, longest streak, 30d completion rate, micro-heatmap, and recent completion log).

### D. Profile & Settings Dashboard
- Edit username / terminal handle.
- View account email and registration date.
- Timezone selector for streak midnight cutoff.
- Daily completion goal slider (10% to 100%).
- Monospace theme selection.
- Database architecture status overview.
- Secure session logout.
- Account deletion with double confirmation typing requirement (`DELETE`).

### E. Authentication & Security
- Supabase Auth integration (email & password).
- Sign up, login, persistent sessions, and password reset.
- Offline / Local Terminal Demo Mode fallback when Supabase is unconfigured or when testing offline on Termux.
- Row Level Security (RLS) on all PostgreSQL tables.
- Input validation and anti-injection protections.
- Zero privileged secrets in the frontend bundle.

---

## 4. Database Schema & Supabase Setup

The database migration is located at:
[`supabase/migrations/20261010_init_habits.sql`](file:///workspace/habit-tracker/supabase/migrations/20261010_init_habits.sql)

### Tables
1. **`profiles`**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `username TEXT NOT NULL DEFAULT 'user'`
   - `timezone TEXT NOT NULL DEFAULT 'UTC'`
   - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
2. **`user_settings`**:
   - `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `daily_goal INTEGER NOT NULL DEFAULT 70`
   - `timezone TEXT NOT NULL DEFAULT 'UTC'`
   - `preferences JSONB NOT NULL DEFAULT '{"theme": "neon-green", "sound_enabled": false, "compact_view": true}'::jsonb`
   - `updated_at TIMESTAMPTZ`
3. **`habits`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `name TEXT NOT NULL`
   - `emoji TEXT NOT NULL DEFAULT '🎯'`
   - `description TEXT DEFAULT ''`
   - `category TEXT DEFAULT 'General'`
   - `target_value NUMERIC DEFAULT 1`
   - `target_unit TEXT DEFAULT 'times'`
   - `is_active BOOLEAN NOT NULL DEFAULT true`
   - `is_favorite BOOLEAN NOT NULL DEFAULT false`
   - `position INTEGER NOT NULL DEFAULT 0`
   - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
4. **`habit_completions`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE`
   - `completed_on DATE NOT NULL`
   - `created_at TIMESTAMPTZ`
   - **Constraint**: `UNIQUE (habit_id, completed_on)` — guarantees at most 1 completion per habit per calendar date.
5. **`xp_ledger`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE`
   - `completion_id UUID NOT NULL REFERENCES habit_completions(id) ON DELETE CASCADE`
   - `xp_amount INTEGER NOT NULL DEFAULT 15`
   - `created_at TIMESTAMPTZ`
   - **Constraint**: `UNIQUE (user_id, habit_id, completion_id)` — strictly prevents duplicate XP awards.

### Setup Instructions
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new Supabase Project.
3. In the left sidebar, click **SQL Editor** -> **New Query**.
4. Paste the entire content of [`supabase/migrations/20261010_init_habits.sql`](file:///workspace/habit-tracker/supabase/migrations/20261010_init_habits.sql) and click **Run**.
5. In **Project Settings** -> **API**:
   - Copy **Project URL**.
   - Copy **anon / public key** (or publishable key).
6. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   Add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-actual-anon-key
   ```
7. In **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Cloudflare Pages domain (e.g. `https://init-habits.pages.dev` or `http://localhost:5173` for local development).
   - In **Redirect URLs**, add:
     - `http://localhost:5173/**`
     - `https://*.pages.dev/**`

---

## 5. Development & Testing

### Installation
```bash
npm install
```

### Local Dev Server
```bash
npm run dev
```

### Running Unit Tests
```bash
npm test
```
The test suite validates:
- **`src/utils/__tests__/dates.test.ts`**: Formatting, parsing, timezone boundaries, leap years, week generation.
- **`src/utils/__tests__/streaks.test.ts`**: Consecutive days, missed day break rules, same-day duplicate guards, and rule 6 (incomplete today does not break active streak).
- **`src/utils/__tests__/xp.test.ts`**: Level thresholds, quadratic inverse derivation, percentage calculations, idempotency.
- **`src/utils/__tests__/statistics.test.ts`**: 30-day window aggregation, 52-week heatmap generation, best/attention habit identification, streak ranking.

### Production Build
```bash
npm run build
```
Creates an optimized production bundle inside `dist/`.

---

## 6. Cloudflare Pages Deployment

### Option A: Cloudflare Dashboard (Git Integration — Recommended)
1. Push your repository to GitHub / GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Compute (Workers) > Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: `your-supabase-publishable-or-anon-key`
6. Click **Save and Deploy**.

### Option B: Direct CLI Deployment via Wrangler (Termux friendly)
If you are developing inside Android Termux or prefer direct CLI deployment:
```bash
# 1. Build the production application
npm run build

# 2. Deploy using Wrangler
npx wrangler pages deploy dist --project-name=init-habits
```

SPA routing (`/* /index.html 200`) is automatically configured via [`public/_redirects`](file:///workspace/habit-tracker/public/_redirects), and security headers are provided via [`public/_headers`](file:///workspace/habit-tracker/public/_headers).

---

## 7. History-Retention & Habit Deletion Policy

- **Archiving Habits**:
  - Sets `is_active = false`.
  - The habit is removed from the active list and daily goal denominator.
  - All historical completions and XP records are 100% retained and visible in historical heatmaps.
  - Habits can be restored at any time via the "Archived" tab.
- **Deleting Habits**:
  - Permanently removes the habit from the database.
  - Requires user confirmation.
  - Associated completion and XP ledger records are cascaded cleanly in the database schema (`ON DELETE CASCADE`), ensuring foreign key integrity.

---

## 8. Keyboard Shortcuts Quick Reference

| Key | Action |
| :--- | :--- |
| `1` | Navigate to **Habits** dashboard |
| `2` | Navigate to **Stats** dashboard |
| `3` | Navigate to **Profile** dashboard |
| `Esc` | Close any open modal |

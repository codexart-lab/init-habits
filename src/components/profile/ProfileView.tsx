import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Calendar,
  Globe,
  Target,
  Palette,
  LogOut,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitsContext';
import { formatReadableDate } from '../../utils/dates';
import { UserPreferences } from '../../types';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const THEMES: { id: UserPreferences['theme']; label: string; previewColor: string }[] = [
  { id: 'neon-green', label: 'Neon Green (Default)', previewColor: '#4ADE65' },
  { id: 'matrix', label: 'Matrix Emerald', previewColor: '#10B981' },
  { id: 'amber-crt', label: 'Amber CRT Terminal', previewColor: '#F59E0B' },
  { id: 'cyberpunk-cyan', label: 'Cyberpunk Cyan', previewColor: '#06B6D4' },
  { id: 'monochrome', label: 'Monochrome Silver', previewColor: '#E4E4E7' },
];

export const ProfileView: React.FC = () => {
  const {
    user,
    profile,
    settings,
    signOut,
    updateProfile,
    updateSettings,
    deleteAccount,
  } = useAuth();
  const { addNotification } = useHabits();

  const [username, setUsername] = useState(profile?.username || 'user');
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC');
  const [dailyGoal, setDailyGoal] = useState(settings?.daily_goal ?? 70);
  const [selectedTheme, setSelectedTheme] = useState<UserPreferences['theme']>(
    settings?.preferences?.theme || 'neon-green'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
    if (settings?.timezone) setTimezone(settings.timezone);
    if (settings?.daily_goal !== undefined) setDailyGoal(settings.daily_goal);
    if (settings?.preferences?.theme) {
      setSelectedTheme(settings.preferences.theme);
      document.documentElement.setAttribute('data-theme', settings.preferences.theme);
    }
  }, [profile, settings]);

  const handleThemeChange = (theme: UserPreferences['theme']) => {
    setSelectedTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const profileRes = await updateProfile({ username: username.trim() });
    const settingsRes = await updateSettings({
      daily_goal: Number(dailyGoal),
      timezone,
      preferences: {
        ...(settings?.preferences || { sound_enabled: false }),
        theme: selectedTheme,
      },
    });

    setIsSaving(false);
    if (!profileRes.error && !settingsRes.error) {
      addNotification('Profile & settings saved successfully', 'success');
    } else {
      addNotification('Failed to save profile settings', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') return;
    setIsDeleting(true);
    const res = await deleteAccount();
    setIsDeleting(false);
    if (res.error) {
      addNotification(res.error.message, 'error');
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Terminal Header */}
      <div className="px-3 py-2 rounded border border-[#1f2421] bg-[#070b08] text-xs text-zinc-400 flex items-center justify-between">
        <span>$ user --config --show</span>
        <span className="text-[#4ADE65] font-semibold">[AUTHENTICATED]</span>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* User Identity Card */}
        <div className="p-4 sm:p-5 rounded border border-[#1f2421] bg-[#0a0a0a] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 border-b border-[#181d19] pb-2">
            <User className="w-4 h-4 text-[#4ADE65]" />
            <span>Developer Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Username / Terminal Handle
              </label>
              <div className="flex items-center bg-[#141414] border border-[#27272a] rounded px-3 py-2 focus-within:border-[#4ADE65]">
                <span className="text-zinc-600 text-xs mr-1.5 select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-zinc-100 outline-none w-full"
                  required
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Email Address
              </label>
              <div className="flex items-center bg-[#101010] border border-zinc-800 rounded px-3 py-2 text-zinc-400 text-xs sm:text-sm">
                <Mail className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                <span className="truncate">{user?.email || 'offline@init.habits'}</span>
              </div>
            </div>

            {/* Created At Date */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Account Created
              </label>
              <div className="flex items-center bg-[#101010] border border-zinc-800 rounded px-3 py-2 text-zinc-400 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                <span>
                  {profile?.created_at
                    ? formatReadableDate(profile.created_at.split('T')[0])
                    : 'Current session'}
                </span>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium flex items-center justify-between">
                <span>Timezone</span>
                <span className="text-[10px] text-zinc-500">(For streak midnight cutoff)</span>
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#141414] border border-[#27272a] rounded px-3 py-2 text-xs text-zinc-100 outline-none focus:border-[#4ADE65] appearance-none"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#0f0f0f] text-zinc-200">
                      {tz}
                    </option>
                  ))}
                </select>
                <Globe className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Habits Goal & Theme Customization Card */}
        <div className="p-4 sm:p-5 rounded border border-[#1f2421] bg-[#0a0a0a] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 border-b border-[#181d19] pb-2">
            <Target className="w-4 h-4 text-[#4ADE65]" />
            <span>Daily Goal & Terminal Theme</span>
          </div>

          {/* Daily Goal Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="text-zinc-400 font-medium">
                Daily Completion Goal
              </label>
              <span className="text-[#4ADE65] font-bold text-sm">{dailyGoal}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full accent-[#4ADE65] bg-[#1a1a1a] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>Relaxed (50%)</span>
              <span>Balanced (70%)</span>
              <span>Intense (90%+)</span>
            </div>
          </div>

          {/* Theme Palette Selection */}
          <div className="pt-2">
            <label className="block text-xs text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              <span>Monospace Terminal Themes</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`p-2.5 rounded border cursor-pointer flex items-center justify-between transition-all select-none ${
                      isSelected
                        ? 'border-[#4ADE65] bg-[#0c2413]'
                        : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.previewColor }}
                      />
                      <span className={`text-xs ${isSelected ? 'text-zinc-100 font-semibold' : 'text-zinc-300'}`}>
                        {theme.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#4ADE65]" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Changes button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold rounded bg-[#4ADE65] text-[#050505] hover:bg-[#43c75b] transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(74,222,101,0.3)] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Supabase Connection Architecture Info */}
      <div className="p-4 rounded border border-[#1f2421] bg-[#0a0a0a] text-xs space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Storage & Cloud Database Architecture</span>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Connected to <strong>Supabase PostgreSQL</strong>. Row Level Security (RLS) is active. All habit rows, completion timestamps, and XP ledger transactions are cryptographically isolated to your authenticated user UID.
        </p>
      </div>

      {/* Account Management & Danger Zone */}
      <div className="p-4 sm:p-5 rounded border border-red-950/60 bg-[#0d0707] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400 border-b border-red-950 pb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Account Management</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-zinc-200">Session Logout</div>
            <div className="text-[11px] text-zinc-500">
              End your active session on this device.
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="px-3.5 py-1.5 text-xs rounded border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        <div className="border-t border-red-950/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-red-400">Delete Account & Data</div>
            <div className="text-[11px] text-zinc-500">
              Permanently purge all habits, historical completions, and XP records.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-1.5 text-xs rounded border border-red-800 bg-red-950/60 text-red-300 hover:bg-red-900/60 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Double Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs font-mono">
          <div className="w-full max-w-md rounded border border-red-800 bg-[#0f0909] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Permanent Account Deletion</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This action is permanent and cannot be undone. All your habits, streaks, heatmap data, and XP points will be deleted forever.
            </p>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Type <span className="text-red-400 font-bold select-all">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs bg-[#1a0f0f] border border-red-800 rounded text-red-200 outline-none focus:border-red-500 font-bold"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
                className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-1.5 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

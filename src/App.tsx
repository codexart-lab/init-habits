import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitsProvider, useHabits } from './context/HabitsContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { NotificationToast } from './components/layout/NotificationToast';
import { HabitList } from './components/habits/HabitList';
import { StatsView } from './components/stats/StatsView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthView } from './components/auth/AuthView';
import { TabType } from './types';

const MainApplication: React.FC = () => {
  const { user, loading, settings } = useAuth();
  const { notifications, removeNotification } = useHabits();
  const [activeTab, setActiveTab] = useState<TabType>('habits');

  // Apply theme if configured in user settings
  useEffect(() => {
    if (settings?.preferences?.theme) {
      document.documentElement.setAttribute('data-theme', settings.preferences.theme);
    }
  }, [settings?.preferences?.theme]);

  // Keyboard navigation shortcuts (1: habits, 2: stats, 3: profile)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === '1') setActiveTab('habits');
      else if (e.key === '2') setActiveTab('stats');
      else if (e.key === '3') setActiveTab('profile');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#4ADE65] font-mono flex flex-col items-center justify-center p-4">
        <div className="text-sm font-semibold tracking-wider flex items-center gap-2">
          <span>&gt; init.Habits</span>
          <span className="inline-block w-2 h-4 bg-[#4ADE65] animate-blink"></span>
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          [BOOT] Initializing terminal runtime &amp; verifying crypto tokens...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] font-mono flex flex-col selection:bg-[#4ADE65] selection:text-[#050505]">
      {/* Terminal Header */}
      <Header activeTab={activeTab} />

      {/* Primary Navigation Tabs */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {activeTab === 'habits' && <HabitList />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-[#181d19] bg-[#070707] py-3 px-4 text-center text-[11px] text-zinc-600 font-mono">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>init.Habits &bull; developer habit tracking</span>
          <span className="text-zinc-500">
            press <code className="text-zinc-400 bg-zinc-900 px-1 rounded">1</code>,{' '}
            <code className="text-zinc-400 bg-zinc-900 px-1 rounded">2</code>,{' '}
            <code className="text-zinc-400 bg-zinc-900 px-1 rounded">3</code> to switch tabs
          </span>
        </div>
      </footer>

      {/* Global Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={removeNotification}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <HabitsProvider>
        <MainApplication />
      </HabitsProvider>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { Terminal, WifiOff, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, profile, isDemoMode, connectionStatus } = useAuth();

  const username = profile?.username || (user?.email ? user.email.split('@')[0] : 'guest');
  const commandMap: Record<TabType, string> = {
    habits: 'daily',
    stats: 'stats --all',
    profile: 'config --user',
  };

  const getStatusBadge = () => {
    if (isDemoMode) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-amber-900/60 bg-amber-950/30 text-amber-400 font-mono"
          title="Running in local offline preview mode. Add Supabase credentials in .env to persist to database."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          DEMO_MODE
        </span>
      );
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-emerald-900/60 bg-emerald-950/30 text-[#4ADE65] font-mono"
            title="Connected to Supabase PostgreSQL database."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE65] animate-ping opacity-75"></span>
            CONNECTED
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
            CHECKING...
          </span>
        );
      case 'error':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-red-900/60 bg-red-950/30 text-red-400 font-mono"
            title="Connection error to Supabase. Check network or credentials."
          >
            <WifiOff className="w-3 h-3 text-red-400" />
            DISCONNECTED
          </span>
        );
      case 'unconfigured':
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono"
            title="Supabase credentials not configured in environment variables."
          >
            <HelpCircle className="w-3 h-3 text-zinc-400" />
            UNCONFIGURED
          </span>
        );
    }
  };

  return (
    <header className="border-b border-[#1f2421] bg-[#050505]/95 backdrop-blur-sm sticky top-0 z-30 px-3 py-2.5 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Terminal Prompt Header */}
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-[#4ADE65] shrink-0" />
          <div className="text-xs sm:text-sm font-mono truncate tracking-tight">
            <span className="text-[#a1a1aa]">{username}</span>
            <span className="text-zinc-600">@</span>
            <span className="text-[#4ADE65] font-semibold">init.Habits</span>
            <span className="text-zinc-500 mx-1">$</span>
            <span className="text-zinc-200">{commandMap[activeTab]}</span>
            <span className="inline-block w-1.5 h-3.5 bg-[#4ADE65] ml-1 align-middle animate-blink"></span>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>
    </header>
  );
};

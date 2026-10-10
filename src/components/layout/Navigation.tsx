import React from 'react';
import { CheckSquare, BarChart3, UserCheck } from 'lucide-react';
import { TabType } from '../../types';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; cmd: string }[] = [
    { id: 'habits', label: 'Habits', icon: <CheckSquare className="w-4 h-4" />, cmd: '1.habits' },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" />, cmd: '2.stats' },
    { id: 'profile', label: 'Profile', icon: <UserCheck className="w-4 h-4" />, cmd: '3.profile' },
  ];

  return (
    <nav className="border-b border-[#1f2421] bg-[#080808] px-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-around sm:justify-start sm:gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3 px-3 sm:px-4 text-xs sm:text-sm font-mono flex items-center gap-2 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[#4ADE65] ${
                isActive
                  ? 'text-[#4ADE65] font-medium'
                  : 'text-[#a1a1aa] hover:text-zinc-200'
              }`}
            >
              <span className={isActive ? 'text-[#4ADE65]' : 'text-zinc-500'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>

              {/* Neon Green Underline Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4ADE65] shadow-[0_0_8px_rgba(74,222,101,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

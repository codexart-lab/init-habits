import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      {notifications.map((n) => {
        let borderClass = 'border-zinc-800 bg-[#0a0a0a] text-zinc-300';
        let icon = <Info className="w-4 h-4 text-blue-400 shrink-0" />;

        if (n.type === 'success') {
          borderClass = 'border-[#166534] bg-[#061408] text-[#4ADE65]';
          icon = <CheckCircle2 className="w-4 h-4 text-[#4ADE65] shrink-0" />;
        } else if (n.type === 'error') {
          borderClass = 'border-red-900/80 bg-[#160808] text-red-400';
          icon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
        } else if (n.type === 'warning') {
          borderClass = 'border-amber-900/80 bg-[#140e04] text-amber-400';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-3 text-xs font-mono border rounded shadow-lg flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <div className="flex items-start gap-2.5">
              {icon}
              <span className="leading-snug break-words">{n.message}</span>
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              className="text-zinc-500 hover:text-zinc-300 shrink-0 p-0.5"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

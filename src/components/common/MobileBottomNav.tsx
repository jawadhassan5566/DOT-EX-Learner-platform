import React from 'react';
import { Home, BookOpen, Bot, Video, Bell, User } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const MobileBottomNav: React.FC = () => {
  const { currentPage, navigateTo, unreadNotificationsCount } = useApp();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'ai-assistant', label: 'AI Tutor', icon: Bot, isAi: true },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotificationsCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around text-slate-400 select-none shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => navigateTo(tab.id as any)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all ${
              isActive
                ? 'text-blue-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${tab.isAi && isActive ? 'text-cyan-400 animate-pulse' : ''}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

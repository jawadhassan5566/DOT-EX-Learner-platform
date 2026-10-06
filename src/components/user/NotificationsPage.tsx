import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  BookOpen,
  Video,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Trash2,
  Landmark,
  Building2,
  ShieldCheck,
  Globe,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Notification } from '../../types/index.js';

export const NotificationsPage: React.FC = () => {
  const { refreshCounters, addToast, navigateTo, selectedInstituteId, selectedInstitute, instituteScopeVersion } = useApp();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'institute' | 'global' | 'announcement' | 'meeting' | 'book'>('all');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [selectedInstituteId, instituteScopeVersion, user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      refreshCounters();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshCounters();
      addToast({ type: 'success', message: 'All notifications marked as read.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const filtered = notifications.filter(n => {
    const isGlobal = n.visibility === 'global' || n.isGlobal === true || !n.instituteId || n.instituteId === 'all';
    if (filter === 'unread') return !n.isRead;
    if (filter === 'institute') return !isGlobal;
    if (filter === 'global') return isGlobal;
    if (filter === 'announcement') return n.type === 'announcement';
    if (filter === 'meeting') return n.type === 'meeting';
    if (filter === 'book') return n.type === 'book';
    return true;
  });

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span>Academic Notifications & Bulletins</span>
            </h1>
            {user?.instituteName && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                {user.instituteName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Campus announcements scoped to your institute as well as university-wide global bulletins.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Updates' },
          { id: 'institute', label: 'Option 1: Institute Students Only' },
          { id: 'global', label: 'Option 2: Show Global' },
          { id: 'unread', label: 'Unread' },
          { id: 'announcement', label: 'Announcements' },
          { id: 'meeting', label: 'Class Reminders' },
          { id: 'book', label: 'Curricula' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filter === t.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading academic bulletins...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs space-y-1">
          <p className="font-semibold text-slate-400">No notifications in this category.</p>
          <p className="text-[11px] text-slate-600">You are completely up to date with your academic notices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isUnread = !n.isRead;
            const isGlobal = n.visibility === 'global' || n.isGlobal === true || !n.instituteId || n.instituteId === 'all';
            return (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                  isUnread
                    ? 'bg-slate-900 border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/60 border-slate-800 opacity-85 hover:opacity-100'
                }`}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                  n.type === 'meeting' ? 'bg-emerald-500/20 text-emerald-400' :
                  n.type === 'book' ? 'bg-blue-500/20 text-blue-400' :
                  isGlobal ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {n.type === 'meeting' ? <Video className="w-4 h-4" /> :
                   n.type === 'book' ? <BookOpen className="w-4 h-4" /> :
                   isGlobal ? <Globe className="w-4 h-4" /> :
                   <Lock className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white">{n.title}</h3>
                      {/* Visibility scope badge */}
                      {isGlobal ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                          <Globe className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Option 2: Show Global (All Campuses)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Option 1: Institute Students Only</span>
                        </span>
                      )}

                      {n.instituteName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium flex items-center space-x-1">
                          <Landmark className="w-2.5 h-2.5 text-blue-400" />
                          <span>{n.instituteName}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                </div>

                {isUnread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 shadow-sm shadow-blue-500"></span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

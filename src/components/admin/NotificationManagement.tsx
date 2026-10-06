import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Plus,
  Trash2,
  Users,
  Info,
  CheckCircle2,
  X,
  Landmark,
  Building2,
  ShieldAlert,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Notification } from '../../types/index.js';

export const NotificationManagement: React.FC = () => {
  const { addToast, institutes } = useApp();
  const { user, isSuperAdmin } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'meeting' | 'book' | 'system'>('announcement');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'teachers'>('students');
  const [targetInstituteId, setTargetInstituteId] = useState<string>(user?.instituteId || 'all');
  const [visibilityOption, setVisibilityOption] = useState<'institute' | 'global'>('institute');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'institute' | 'global'>('all');
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    if (user?.instituteId && !isSuperAdmin) {
      setTargetInstituteId(user.instituteId);
    }
  }, [user]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isGlobal = visibilityOption === 'global';
    const effectiveInstId = isSuperAdmin ? targetInstituteId : (user?.instituteId || 'all');
    const matchedInst = institutes.find(i => i.id === effectiveInstId);
    const assignedInstName = matchedInst?.name || user?.instituteName || 'Dot X Central';

    try {
      const payload = {
        title,
        message,
        type,
        targetAudience,
        targetGroup: targetAudience,
        visibility: visibilityOption, // Option 1: 'institute' | Option 2: 'global'
        scope: visibilityOption,
        isGlobal,
        instituteId: effectiveInstId !== 'all' ? effectiveInstId : undefined,
        instituteName: assignedInstName
      };

      const res = await api.broadcastNotification(payload);
      if (res.success) {
        // Securely persist to Firestore announcements collection
        firestoreService.saveAnnouncement({
          ...payload,
          id: res.notification?.id || `notif_${Date.now()}`,
          createdAt: new Date().toISOString()
        }).catch(err => console.warn("Firestore announcement save fallback:", err));

        addToast({
          type: 'success',
          title: isGlobal ? 'Global Broadcast Dispatched' : 'Institute Broadcast Dispatched',
          message: isGlobal
            ? `Option 2: Announcement broadcasted globally to all students across every institute!`
            : `Option 1: Announcement routed strictly to students enrolled in ${assignedInstName}.`
        });
        setModalOpen(false);
        setTitle('');
        setMessage('');
        setVisibilityOption('institute');
        loadNotifications();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to dispatch broadcast notice' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Notice Deleted', message: res.message });
        loadNotifications();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to delete notification' });
    }
  };

  const isInstituteAdmin = user?.role === 'admin' && !isSuperAdmin;
  const currentInstituteName = isInstituteAdmin ? user?.instituteName : (institutes.find(i => i.id === targetInstituteId)?.name || 'Dot X Campus');

  const filteredNotifications = notifications.filter(n => {
    const isGlobal = n.visibility === 'global' || n.isGlobal === true || !n.instituteId || n.instituteId === 'all';
    if (scopeFilter === 'institute') return !isGlobal;
    if (scopeFilter === 'global') return isGlobal;
    return true;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span>
                {isInstituteAdmin
                  ? `${user?.instituteName || 'Institute'} Announcement Dispatcher`
                  : 'Academic Bulletin & Broadcast Center'}
              </span>
            </h2>
            {isInstituteAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                {user?.instituteName}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Dispatch announcements with flexible targeting: <strong>Option 1 (Institute Students Only)</strong> or <strong>Option 2 (Show Global to All Students)</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            if (user?.instituteId && !isSuperAdmin) {
              setTargetInstituteId(user.instituteId);
            }
            setVisibilityOption('institute');
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Broadcast Notice</span>
        </button>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setScopeFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
            scopeFilter === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Notices ({notifications.length})
        </button>
        <button
          onClick={() => setScopeFilter('institute')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            scopeFilter === 'institute'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-indigo-300" />
          <span>Option 1: Only show on institute students</span>
        </button>
        <button
          onClick={() => setScopeFilter('global')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
            scopeFilter === 'global'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-300" />
          <span>Option 2: Show global</span>
        </button>
      </div>

      {/* Broadcasts Feed Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4">Notice Title</th>
              <th className="p-4">Message</th>
              <th className="p-4">Scope & Visibility</th>
              <th className="p-4">Originating Campus</th>
              <th className="p-4">Audience</th>
              <th className="p-4">Type</th>
              <th className="p-4">Dispatched At</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No announcements found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredNotifications.map((n) => {
                const isGlobal = n.visibility === 'global' || n.isGlobal === true || !n.instituteId || n.instituteId === 'all';
                return (
                  <tr key={n.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-white max-w-[200px] truncate">{n.title}</td>
                    <td className="p-4 text-slate-300 max-w-sm truncate">{n.message}</td>
                    <td className="p-4">
                      {isGlobal ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center space-x-1.5 w-fit">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>Option 2: Global (All Students)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center space-x-1.5 w-fit">
                          <Lock className="w-3 h-3 text-indigo-400" />
                          <span>Option 1: Institute Students Only</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {n.instituteName || n.instituteId ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center space-x-1.5 w-fit">
                          <Landmark className="w-3 h-3 text-blue-400" />
                          <span className="truncate max-w-[130px]">{n.instituteName || n.instituteId}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                          Dot X Central
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 capitalize">{n.targetAudience || n.targetGroup || 'all'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300">
                        {n.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Broadcast Campus Bulletin</h3>
                <p className="text-[11px] text-slate-400">
                  Select whether to restrict this notice to your institute's students or broadcast globally.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              {/* Option 1 vs Option 2 Visibility Selector */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
                  <span>Announcement Visibility & Target Scope *</span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Required</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Institute Students Only */}
                  <div
                    onClick={() => setVisibilityOption('institute')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      visibilityOption === 'institute'
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10 text-white'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        visibilityOption === 'institute' ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                      }`}>
                        {visibilityOption === 'institute' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Option 1: Only show on institute students</span>
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 pl-6">
                      🔒 Only students enrolled in <strong>{currentInstituteName}</strong> will receive and view this announcement.
                    </p>
                  </div>

                  {/* Option 2: Show Global */}
                  <div
                    onClick={() => setVisibilityOption('global')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      visibilityOption === 'global'
                        ? 'bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-500/10 text-white'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        visibilityOption === 'global' ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-600'
                      }`}>
                        {visibilityOption === 'global' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Option 2: Show global</span>
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 pl-6">
                      🌐 Broadcast to <strong>all students across the entire platform</strong> globally, badged with {currentInstituteName}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Originating Institute Info / Selector */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Landmark className="w-3.5 h-3.5 text-blue-400" />
                    <span>Originating Campus *</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold">
                    {isInstituteAdmin ? 'Your Institute' : 'Campus Origin'}
                  </span>
                </label>

                {isInstituteAdmin ? (
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-medium flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="font-bold">{user?.instituteName}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      ({visibilityOption === 'institute' ? 'Restricted to enrolled students' : 'Broadcasting globally'})
                    </span>
                  </div>
                ) : (
                  <select
                    value={targetInstituteId}
                    onChange={(e) => setTargetInstituteId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Dot X Central University (Global Headquarters)</option>
                    {institutes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Bulletin Headline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Midterm Examination Schedule Finalized"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="meeting">Meeting Reminder</option>
                    <option value="book">New Book Arrival</option>
                    <option value="system">System Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Role</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="students">Students Only</option>
                    <option value="all">Entire Campus (All)</option>
                    <option value="teachers">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Detailed announcement content and instructions for students..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 text-white rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg cursor-pointer ${
                    visibilityOption === 'global'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Broadcasting...'
                      : visibilityOption === 'global'
                        ? 'Dispatch Option 2 (Show Global)'
                        : 'Dispatch Option 1 (Only Show on Institute Students)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

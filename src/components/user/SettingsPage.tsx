import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Lock,
  Bell,
  Shield,
  Trash2,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { addToast } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  // Preference switches
  const [meetingAlerts, setMeetingAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ type: 'warning', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ type: 'warning', message: 'Password must be at least 6 characters.' });
      return;
    }

    setLoadingPass(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        addToast({ type: 'success', title: 'Password Updated', message: res.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Password change failed.' });
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto text-xs">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure interface appearance, notification channels, and cryptographic credentials.
        </p>
      </div>

      {/* 1. Theme Configuration */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Appearance & Color Palette</span>
        </h2>
        <p className="text-slate-400">
          Select between our Dark Navy Academic Theme (optimized for night study) or Clean Light Modern Theme.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
              theme === 'dark'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Moon className="w-5 h-5 text-blue-400" />
            <div>
              <p className="font-bold text-xs text-white">Dark Navy (Recommended)</p>
              <p className="text-[11px] text-slate-400">Scholarly contrast</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
              theme === 'light'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-bold text-xs text-white">Clean Light</p>
              <p className="text-[11px] text-slate-400">High daylight clarity</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Password & Security */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Change Password (SHA-256 Protected)</span>
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loadingPass}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition-colors"
          >
            {loadingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 3. Notification Preferences */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <span>Notification Dispatch Channels</span>
        </h2>

        <div className="space-y-3 max-w-lg">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div>
              <p className="font-semibold text-white">Live Classroom Reminders</p>
              <p className="text-[11px] text-slate-400">Receive alerts 15 minutes before scheduled lectures</p>
            </div>
            <input
              type="checkbox"
              checked={meetingAlerts}
              onChange={(e) => setMeetingAlerts(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div>
              <p className="font-semibold text-white">AI Study Recommendations</p>
              <p className="text-[11px] text-slate-400">Receive reading suggestions based on your search history</p>
            </div>
            <input
              type="checkbox"
              checked={aiSuggestions}
              onChange={(e) => setAiSuggestions(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

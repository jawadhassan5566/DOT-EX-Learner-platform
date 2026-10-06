import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  ShieldAlert,
  HardDrive,
  FileCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const SystemSettings: React.FC = () => {
  const { addToast } = useApp();
  const { user } = useAuth();

  const [platformName, setPlatformName] = useState('Dot X Library');
  const [tagline, setTagline] = useState('Learn • Connect • Grow');
  const [supportEmail, setSupportEmail] = useState('support@dotxlibrary.com');
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(100);
  const [allowedExtensions, setAllowedExtensions] = useState('.pdf,.epub');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getSystemSettings();
        if (res.success && res.settings) {
          setPlatformName(res.settings.platformName || 'Dot X Library');
          setTagline(res.settings.tagline || 'Learn • Connect • Grow');
          setSupportEmail(res.settings.supportEmail || 'support@dotxlibrary.com');
          setMaxUploadSizeMb(res.settings.maxUploadSizeMb || 100);
          setAllowedExtensions((res.settings.allowedExtensions || ['.pdf', '.epub']).join(','));
          setAllowRegistration(res.settings.allowRegistration ?? true);
          setMaintenanceMode(res.settings.maintenanceMode ?? false);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSystemSettings({
        platformName,
        tagline,
        supportEmail,
        maxUploadSizeMb: Number(maxUploadSizeMb),
        allowedExtensions: allowedExtensions.split(',').map(s => s.trim()),
        allowRegistration,
        maintenanceMode
      });
      if (res.success) {
        addToast({
          type: 'success',
          title: 'System Reconfigured',
          message: res.message
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === 'subadmin') {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Access Restricted: Institution Settings</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sub-Admins have limited operational permissions and do not have access to institution or platform settings.
          Under system policy, Sub-Admins may only manage books, create announcements, and create meetings.
        </p>
        <p className="text-[11px] text-slate-500">
          Institution configuration for {user?.instituteName || 'this institution'} can only be adjusted by the Main Admin or Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs max-w-4xl">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <span>Platform Configuration & System Governance</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Configure global academic identity, campus support routing, and file ingestion limits.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Identity & Institutional Branding</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Institutional Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Official Support Desk Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* File Ingestion Limits */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Storage & File Ingestion Restrictions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Maximum Upload Size (MB)</label>
              <input
                type="number"
                value={maxUploadSizeMb}
                onChange={(e) => setMaxUploadSizeMb(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Whitelisted Extensions (comma-separated)</label>
              <input
                type="text"
                value={allowedExtensions}
                onChange={(e) => setAllowedExtensions(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Access Governance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Access Governance & Maintenance</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div>
                <p className="font-semibold text-white">Open Student Self-Registration</p>
                <p className="text-[11px] text-slate-400">Allow university candidates to register accounts with campus email</p>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div>
                <p className="font-semibold text-rose-400">Emergency Maintenance Mode</p>
                <p className="text-[11px] text-slate-400">Restricts public access exclusively to Super Administrators during updates</p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

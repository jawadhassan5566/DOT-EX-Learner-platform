import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Trash2,
  X,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
  Landmark,
  Users,
  AlertCircle,
  BookOpen,
  Bell,
  Video,
  Lock,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const AdminManagement: React.FC = () => {
  const { addToast } = useApp();
  const { user, isSuperAdmin, isMainAdmin } = useAuth();

  const [admins, setAdmins] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [subAdminQuota, setSubAdminQuota] = useState<{ count: number; maxLimit: number; remaining: number }>({
    count: 0,
    maxLimit: 4,
    remaining: 4
  });

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'main_admin' | 'sub_admin' | 'general_admin'>('sub_admin');

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('AdminPass123!');
  const [department, setDepartment] = useState('Academic Operations');
  const [selectedInstituteId, setSelectedInstituteId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsRes, instRes, subRes] = await Promise.all([
        api.getAdmins().catch(() => ({ success: false, admins: [] })),
        api.getInstitutes().catch(() => ({ success: false, institutes: [] })),
        api.getSubAdmins().catch(() => ({ success: false, subAdmins: [], count: 0, maxLimit: 4, remaining: 4 }))
      ]);

      if (adminsRes.success) setAdmins(adminsRes.admins);
      if (instRes.success && instRes.institutes.length > 0) {
        setInstitutes(instRes.institutes);
        if (!selectedInstituteId) {
          setSelectedInstituteId(instRes.institutes[0].id);
        }
      }
      if (subRes.success) {
        setSubAdmins(subRes.subAdmins);
        setSubAdminQuota({
          count: subRes.count,
          maxLimit: subRes.maxLimit || 4,
          remaining: subRes.remaining !== undefined ? subRes.remaining : Math.max(0, 4 - subRes.count)
        });
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Open creation modal
  const openCreateModal = (mode: 'main_admin' | 'sub_admin' | 'general_admin') => {
    setModalMode(mode);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('AdminPass123!');
    setDepartment(mode === 'sub_admin' ? 'Operations & Library' : 'Institutional Leadership');
    if (mode === 'sub_admin' && user?.instituteId) {
      setSelectedInstituteId(user.instituteId);
    }
    setModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === 'main_admin') {
        const res = await api.createMainAdmin({
          name,
          username,
          email,
          password,
          department,
          instituteId: selectedInstituteId
        });
        if (res.success) {
          addToast({ type: 'success', title: 'Main Admin Provisioned', message: res.message });
          setModalOpen(false);
          loadData();
        }
      } else if (modalMode === 'sub_admin') {
        const res = await api.createSubAdmin({
          name,
          username,
          email,
          password,
          department,
          instituteId: user?.instituteId || selectedInstituteId
        });
        if (res.success) {
          addToast({ type: 'success', title: 'Sub-Admin Created', message: res.message });
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createAdmin({
          name,
          username,
          email,
          password,
          department,
          roleId: 'admin_role'
        });
        if (res.success) {
          addToast({ type: 'success', title: 'Admin Created', message: res.message });
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Sub-Admin
  const handleDeleteSubAdmin = async (id: string, subAdminName: string) => {
    if (!window.confirm(`Are you sure you want to remove Sub-Admin "${subAdminName}"? This will restore 1 quota slot for your institution.`)) {
      return;
    }
    try {
      const res = await api.deleteSubAdmin(id);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              {isSuperAdmin
                ? 'Super Admin Administration & Institution Leadership'
                : `${user?.instituteName || 'Institution'} Sub-Admin Delegation`}
            </h2>
          </div>
          <p className="text-slate-400 text-xs">
            {isSuperAdmin
              ? 'As Super Admin, you provision the Main Admin for each institution. Each Main Admin then delegates authority to up to 4 Sub-Admins.'
              : `As Main Admin of ${user?.instituteName || 'your institution'}, you have the authority to create up to 4 Sub-Admins under you.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              onClick={() => openCreateModal('main_admin')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-bold flex items-center space-x-2 shadow-lg transition-all"
            >
              <Landmark className="w-4 h-4" />
              <span>Create Institution Main Admin</span>
            </button>
          )}

          {/* Sub-Admin Creation Button (for Main Admin and Super Admin) */}
          <button
            onClick={() => openCreateModal('sub_admin')}
            disabled={subAdminQuota.count >= 4 && !isSuperAdmin}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-lg transition-all ${
              subAdminQuota.count >= 4 && !isSuperAdmin
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {subAdminQuota.count >= 4 && !isSuperAdmin
                ? 'Sub-Admin Quota Full (4/4)'
                : `Create Sub-Admin (${subAdminQuota.remaining} Slots Left)`}
            </span>
          </button>
        </div>
      </div>

      {/* Quota & Policy Explanation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <span>Sub-Admin Security & Delegation Rules</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                Strictly Enforced
              </span>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              Each Main Admin is authorized to create <strong>up to four Sub-Admins</strong> under him. Sub-Admins have <strong>strictly limited permissions</strong>:
              they can only <strong>manage books</strong>, <strong>create announcements</strong>, and <strong>create/host meetings</strong>.
              Sub-Admins have <strong>no access</strong> to institution settings or user management.
            </p>
          </div>
        </div>

        {/* Live Quota Pill Indicator */}
        <div className="flex items-center space-x-3 shrink-0 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sub-Admin Quota</div>
            <div className="text-sm font-black text-white">
              <span className={subAdminQuota.count >= 4 ? 'text-amber-400' : 'text-emerald-400'}>
                {subAdminQuota.count}
              </span>
              <span className="text-slate-500"> / {subAdminQuota.maxLimit} Allocated</span>
            </div>
          </div>
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className={`w-3 h-6 rounded-md transition-all ${
                  slotIdx < subAdminQuota.count
                    ? 'bg-blue-500 border border-blue-400 shadow-sm shadow-blue-500/50'
                    : 'bg-slate-800 border border-slate-700/60'
                }`}
                title={slotIdx < subAdminQuota.count ? 'Sub-Admin Slot In Use' : 'Available Sub-Admin Slot'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: Sub-Admins List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Active Delegated Sub-Admins ({subAdmins.length} of 4)</span>
          </h3>
          <span className="text-slate-400 text-xs">
            Remaining Quota: <strong className="text-white">{subAdminQuota.remaining}</strong> slots available
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50 text-[11px] font-bold">
                <th className="p-4">Sub-Administrator</th>
                <th className="p-4">Parent Main Admin</th>
                <th className="p-4">Institution</th>
                <th className="p-4">Authorized Permissions</th>
                <th className="p-4">Restricted (Blocked)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <UserPlus className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400">No Sub-Admins created yet for this institution.</p>
                    <p className="text-[11px] mt-1">Click "Create Sub-Admin" above to delegate books, announcements, and meetings (up to 4 allowed).</p>
                  </td>
                </tr>
              ) : (
                subAdmins.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={sub.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={sub.name}
                          className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
                        />
                        <div>
                          <p className="font-bold text-white flex items-center space-x-1.5">
                            <span>{sub.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                              Sub-Admin
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      {sub.parentAdminName || 'Main Admin'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-semibold">
                        {sub.instituteName || 'Punjab College'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Books</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center space-x-1">
                          <Bell className="w-3 h-3" />
                          <span>Announcements</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>Meetings</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 line-through">
                          Settings
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 line-through">
                          Users
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteSubAdmin(sub.id, sub.name)}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold flex items-center space-x-1 ml-auto border border-red-500/20 transition-colors"
                        title="Remove Sub-Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Institution Main Admins & Super Admins (Visible to Super Admin & Main Admin) */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-amber-400" />
            <span>Institution Main Admins & Platform Leadership</span>
          </h3>
          <span className="text-slate-400 text-xs">
            Institutions: <strong className="text-white">{institutes.length}</strong> Partner Campuses
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50 text-[11px] font-bold">
                <th className="p-4">Administrator</th>
                <th className="p-4">Authority Tier</th>
                <th className="p-4">Assigned Institution</th>
                <th className="p-4">Sub-Admins Subordinate</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Authority Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {admins.filter(a => a.role === 'superadmin' || a.adminType === 'main' || a.role === 'admin').map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img src={adm.avatar} alt={adm.name} className="w-8 h-8 rounded-full object-cover border border-amber-500/40" />
                      <div>
                        <p className="font-bold text-white">{adm.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{adm.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      adm.role === 'superadmin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {adm.role === 'superadmin' ? 'Super Admin' : 'Main Admin'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">
                    {adm.instituteName || (adm.role === 'superadmin' ? 'Global Platform (All Institutes)' : 'Punjab College')}
                  </td>
                  <td className="p-4">
                    {adm.role === 'superadmin' ? (
                      <span className="text-slate-400 italic">Global Oversight</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[11px]">
                        Up to 4 Sub-Admins
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-slate-400 text-[11px]">
                      {adm.role === 'superadmin' ? 'Master Authority' : 'Institution Lead'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                {modalMode === 'main_admin' ? (
                  <>
                    <Landmark className="w-5 h-5 text-amber-400" />
                    <span>Create Institution Main Admin</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    <span>Create Sub-Admin (Under Main Admin)</span>
                  </>
                )}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informational Scope Notice */}
            {modalMode === 'sub_admin' ? (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-slate-300 text-[11px] space-y-1">
                <p className="font-bold text-blue-300">
                  Sub-Admin Delegation Scope:
                </p>
                <p>
                  This Sub-Admin will be granted access <strong>ONLY</strong> to:
                </p>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">1. Manage Books</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">2. Create Announcements</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">3. Create Meetings</span>
                </div>
                <p className="text-red-400 font-semibold pt-1">
                  ✗ Sub-Admins are strictly blocked from User Management and Institution Settings.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-300 text-[11px]">
                <p className="font-bold text-amber-300">
                  Main Admin Creation:
                </p>
                <p>
                  As Super Admin, you are appointing the primary administrative leader for the selected institution.
                  This Main Admin will have the authority to manage up to 4 Sub-Admins.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Institution Selector */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Institution</label>
                <select
                  value={selectedInstituteId}
                  onChange={(e) => setSelectedInstituteId(e.target.value)}
                  disabled={modalMode === 'sub_admin' && !isSuperAdmin && Boolean(user?.instituteId)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={modalMode === 'main_admin' ? "e.g. Prof. Muhammad Tariq" : "e.g. Hamza Malik"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. subadmin_ops"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    placeholder="e.g. Library Operations"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. subadmin@punjabcollege.edu"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl font-bold text-slate-950 transition-all ${
                    modalMode === 'main_admin'
                      ? 'bg-amber-500 hover:bg-amber-400'
                      : 'bg-blue-500 hover:bg-blue-400 text-white'
                  }`}
                >
                  {submitting ? 'Creating...' : modalMode === 'main_admin' ? 'Create Main Admin' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

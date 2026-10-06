import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Shield,
  Filter,
  Landmark,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { User } from '../../types/index.js';

export const UserManagement: React.FC = () => {
  const { addToast } = useApp();
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await api.getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter]);

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const res = await api.updateUserStatus(userId, status);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete student/faculty account: "${userName}"?`)) return;
    try {
      const res = await api.deleteUser(userId);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const isInstituteAdmin = currentUser?.role === 'admin' && !isSuperAdmin;

  if (currentUser?.role === 'subadmin') {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Access Restricted: User Management</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sub-Admins have limited operational permissions and do not have access to User Management.
          Under system policy, Sub-Admins may only manage books, create announcements, and create meetings.
        </p>
        <p className="text-[11px] text-slate-500">
          User accounts for {currentUser?.instituteName || 'this institution'} can only be managed by the Main Admin or Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>
                {isInstituteAdmin
                  ? `${currentUser?.instituteName || 'Institute'} Student & Faculty Directory`
                  : 'Student & Faculty Directory'}
              </span>
            </h2>
            {isInstituteAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                Isolated Institute Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isInstituteAdmin
              ? `Manage students enrolled specifically under ${currentUser?.instituteName}.`
              : 'Audit user accounts, monitor sign-up dates, and verify institute affiliations.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-300"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            {isSuperAdmin && <option value="superadmin">Super Admin</option>}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4">User</th>
              <th className="p-4">Enrolled Institute</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
              <th className="p-4">Registered</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {u.instituteName || 'Dot X Central University'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    u.role === 'superadmin' ? 'bg-amber-500/20 text-amber-300' :
                    u.role === 'admin' ? 'bg-blue-500/20 text-blue-300' :
                    u.role === 'teacher' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-slate-300">{u.department || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    u.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-500 text-[11px]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-1.5">
                  {u.role !== 'superadmin' && (
                    <>
                      {u.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(u.id, 'suspended')}
                          className="px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[10px] font-semibold"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, 'active')}
                          className="px-2 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-[10px] font-semibold"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Check,
  Plus,
  Save,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

export const RolePermissionManagement: React.FC = () => {
  const { addToast } = useApp();

  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getRolesAndPermissions();
      if (res.success) {
        setRoles(res.roles);
        setPermissions(res.permissions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePermission = (roleId: string, permKey: string) => {
    setRoles(prev =>
      prev.map(r => {
        if (r.id !== roleId) return r;
        if (r.id === 'superadmin_role') return r; // Super admin holds all permissions permanently

        const currentPerms = [...r.permissions];
        const exists = currentPerms.includes(permKey);
        const updated = exists
          ? currentPerms.filter(p => p !== permKey)
          : [...currentPerms, permKey];

        return { ...r, permissions: updated };
      })
    );
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      for (const r of roles) {
        if (r.id !== 'superadmin_role') {
          await api.updateRolePermissions(r.id, r.permissions);
        }
      }
      addToast({
        type: 'success',
        title: 'RBAC Matrix Enforced',
        message: 'Security policies and access control matrices successfully updated.'
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-blue-500" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Configure authorization boundaries across administrative roles, librarians, and faculty members.
          </p>
        </div>

        <button
          onClick={handleSaveMatrix}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enforcing...' : 'Save RBAC Matrix'}</span>
        </button>
      </div>

      {/* Matrix Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4 w-60">Permissions / Operations</th>
              {roles.map((r) => (
                <th key={r.id} className="p-4 text-center">
                  <div className="font-bold text-white whitespace-nowrap">{r.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{r.description}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {permissions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-[11px] text-slate-400">{p.description}</div>
                  <div className="text-[9px] font-mono text-blue-400 mt-0.5">{p.id}</div>
                </td>

                {roles.map((r) => {
                  const hasPerm = r.permissions.includes(p.id) || r.id === 'superadmin_role';
                  const isLocked = r.id === 'superadmin_role';

                  return (
                    <td key={r.id} className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(r.id, p.id)}
                        disabled={isLocked}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${
                          hasPerm
                            ? isLocked
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 border border-slate-700 hover:border-slate-500 text-transparent'
                        }`}
                        title={isLocked ? 'Super Admin permanently holds all privileges' : hasPerm ? 'Click to revoke' : 'Click to grant'}
                      >
                        {hasPerm && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

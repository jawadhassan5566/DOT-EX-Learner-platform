import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Download,
  Video,
  Bot,
  MessageSquare,
  TrendingUp,
  Plus,
  Shield,
  ArrowUpRight,
  Clock,
  Layers,
  Landmark,
  Building2,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const AdminDashboard: React.FC = () => {
  const { navigateTo, selectedInstituteId, selectedInstitute, instituteScopeVersion } = useApp();
  const { user, isSuperAdmin } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
          setMonthlyUsage(res.monthlyUsage);
          setCategoryStats(res.categoryStats);
          setRecentActivity(res.recentActivity);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [selectedInstituteId, instituteScopeVersion, user]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs">Gathering platform operational telemetry...</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Enrolled Students',
      value: stats?.totalUsers || 4,
      sub: !isSuperAdmin ? 'Your Institute' : 'Active Scope',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      link: 'admin-users'
    },
    {
      label: 'Academic Books',
      value: stats?.totalBooks || 8,
      sub: 'Visible to Everyone',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-600',
      link: 'admin-books'
    },
    {
      label: 'Total Downloads',
      value: stats?.totalDownloads || 1480,
      sub: 'Catalog Volume',
      icon: Download,
      color: 'from-amber-600 to-orange-600',
      link: 'admin-reports'
    },
    {
      label: 'Active Meetings',
      value: stats?.activeMeetings || 1,
      sub: 'Live Classes',
      icon: Video,
      color: 'from-purple-600 to-pink-600',
      link: 'admin-meetings'
    },
    {
      label: 'AI Inquiries Handled',
      value: stats?.aiUsage || 5800,
      sub: 'Pedagogical AI',
      icon: Bot,
      color: 'from-cyan-600 to-blue-600',
      link: 'admin-ai'
    },
    {
      label: 'Unread Inquiries',
      value: stats?.unreadMessages || 1,
      sub: 'Campus Support',
      icon: MessageSquare,
      color: 'from-rose-600 to-red-600',
      link: 'admin-contact'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 0. Dedicated Institute Administration Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                {!isSuperAdmin && user?.instituteName
                  ? `${user.instituteName} Administration Panel`
                  : (selectedInstitute ? `${selectedInstitute.name} Admin Panel` : 'Dot X Multi-Institute Administration Panel')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase">
                {!isSuperAdmin ? 'Separate Institute Portal' : 'Super Admin Scope'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Separate administration portal for student records and campus bulletins. Books remain globally visible to everyone.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => navigateTo('admin-notifications')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Dispatch Bulletin
          </button>
          <button
            onClick={() => navigateTo('library')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-colors"
          >
            Browse All Books &rarr;
          </button>
        </div>
      </div>

      {/* 1. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => navigateTo(kpi.link as any)}
              className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">{kpi.label}</span>
                  <span className="text-[10px] text-blue-400 font-medium">{kpi.sub}</span>
                </div>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white tracking-tight">{kpi.value}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Reads & Downloads Bar Chart Simulation */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Monthly Reading & Download Volume</span>
              </h3>
              <p className="text-[11px] text-slate-400">Institutional campus activity trend</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
              Current Academic Year
            </span>
          </div>

          {/* Simulated Bars */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-800 pb-2">
            {monthlyUsage.map((m, idx) => {
              const maxVal = 1400;
              const readsHeight = Math.min(100, Math.round((m.reads / maxVal) * 100));
              const downloadsHeight = Math.min(100, Math.round((m.downloads / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      className="w-3 bg-blue-600 rounded-t-sm group-hover:bg-blue-500 transition-all"
                      style={{ height: `${readsHeight}%` }}
                      title={`${m.reads} Reads`}
                    ></div>
                    <div
                      className="w-3 bg-cyan-400 rounded-t-sm group-hover:bg-cyan-300 transition-all"
                      style={{ height: `${downloadsHeight}%` }}
                      title={`${m.downloads} Downloads`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
              <span>Online Book Reads</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-400"></span>
              <span>Authorized PDF Downloads</span>
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Category Distribution</span>
          </h3>

          <div className="space-y-3 pt-2">
            {categoryStats.slice(0, 6).map((c, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{c.name}</span>
                  <span className="font-mono text-slate-400">{c.count} titles</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, c.count * 25 + 15)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Recent Audit Logs */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Real-Time Security & Action Trail</span>
          </h3>
          <button
            onClick={() => navigateTo('admin-logs')}
            className="text-xs text-blue-400 hover:underline"
          >
            View Full Audit Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">User</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Details</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentActivity.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-medium text-white">{log.userName}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold uppercase">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{log.action}</td>
                  <td className="py-2.5 text-slate-400 truncate max-w-xs">{log.details}</td>
                  <td className="py-2.5 text-slate-500 text-[11px] font-mono">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

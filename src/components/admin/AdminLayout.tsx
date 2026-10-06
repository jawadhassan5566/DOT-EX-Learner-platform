import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  ShieldCheck,
  KeyRound,
  Bell,
  Video,
  Radio,
  Bot,
  MessageSquare,
  BarChart3,
  ShieldAlert,
  Settings,
  ArrowLeft,
  Landmark
} from 'lucide-react';
import { DotXLogo } from '../common/DotXLogo.js';
import { useApp, PageId } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: PageId;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const { navigateTo } = useApp();
  const { user, isSuperAdmin } = useAuth();

  const isSubAdmin = user?.role === 'subadmin' || user?.adminType === 'sub';
  const isMainAdmin = user?.role === 'admin' || user?.adminType === 'main';

  const menuItems = [
    { id: 'admin-dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'admin-institutes', label: 'Institutes & Organizations', icon: Landmark, superAdminOnly: true, subAdminBlocked: true },
    { id: 'admin-books', label: 'Book Management', icon: BookOpen },
    { id: 'admin-categories', label: 'Categories', icon: Layers },
    { id: 'admin-lectures', label: 'Study Lectures & Media', icon: Video },
    { id: 'admin-users', label: 'User Management', icon: Users, subAdminBlocked: true },
    {
      id: 'admin-admins',
      label: isSuperAdmin ? 'Main Admins Directory' : 'Sub-Admin Delegation',
      icon: ShieldCheck,
      subAdminBlocked: true
    },
    { id: 'admin-roles', label: 'Roles & RBAC Matrix', icon: KeyRound, superAdminOnly: true, subAdminBlocked: true },
    { id: 'admin-notifications', label: 'Notifications & Alerts', icon: Bell },
    { id: 'admin-meetings', label: 'Meeting Schedules', icon: Video },
    { id: 'admin-live-control', label: 'Live Host Controls', icon: Radio },
    { id: 'admin-ai', label: 'AI Model Management', icon: Bot, superAdminOnly: true, subAdminBlocked: true },
    { id: 'admin-contact', label: 'Support Inquiries', icon: MessageSquare, subAdminBlocked: true },
    { id: 'admin-reports', label: 'Reports & Analytics', icon: BarChart3, subAdminBlocked: true },
    { id: 'admin-logs', label: 'Security & Audit Logs', icon: ShieldAlert, subAdminBlocked: true },
    { id: 'admin-settings', label: 'System Settings', icon: Settings, subAdminBlocked: true },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Admin Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateTo('home')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Return to Student Portal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <DotXLogo size="md" variant="light" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-extrabold text-base text-white tracking-tight flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-blue-400" />
                <span>
                  {!isSuperAdmin && user?.instituteName
                    ? `${user.instituteName} Admin Panel`
                    : 'Dot X Administration Control Center'}
                </span>
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : isSubAdmin
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {isSuperAdmin
                  ? 'Super Administrator'
                  : isSubAdmin
                  ? 'Sub-Admin (Books • Notices • Meetings)'
                  : 'Institution Main Admin'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Logged in as <strong className="text-white">{user?.name}</strong> •{' '}
              {isSubAdmin ? (
                <span>Delegated operator for <strong className="text-cyan-300">{user?.instituteName || 'Institution'}</strong> (Authorized: Books, Announcements, Meetings)</span>
              ) : !isSuperAdmin && user?.instituteName ? (
                <span>Main Administrator for <strong className="text-blue-300">{user.instituteName}</strong> (Authority over up to 4 Sub-Admins)</span>
              ) : (
                <span>Super Administrator • Full platform authority across all institutions</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="self-start sm:self-center px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          View Public Student Site &rarr;
        </button>
      </div>

      {/* Main Admin Split: Left Nav Sidebar & Center Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md h-fit">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
            {isSubAdmin ? 'Sub-Admin Navigation' : 'Admin Navigation'}
          </div>
          {menuItems.map((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return null;
            if (item.subAdminBlocked && isSubAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as any)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Admin Sub-Panel */}
        <div className="lg:col-span-4 min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
};

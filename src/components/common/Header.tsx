import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  Video,
  PenTool,
  MessageSquare,
  Search,
  Bell,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  ShieldAlert,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
  Info,
  PhoneCall,
  Menu,
  X,
  CheckCircle2,
  Music,
  Landmark,
  Building2,
  Check,
  Target,
  UserPlus
} from 'lucide-react';
import { DotXLogo } from './DotXLogo.js';
import { PWAInstallButton } from './PWAInstallButton.js';
import { Database, HardDrive, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useApp } from '../../context/AppContext.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export const Header: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, logout, quickSwitchAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    currentPage,
    navigateTo,
    globalSearchQuery,
    setGlobalSearchQuery,
    isMobileSimulator,
    toggleMobileSimulator,
    unreadNotificationsCount,
    selectedInstituteId,
    selectedInstitute,
    institutes,
    setSelectedInstituteId,
    openAuthModal
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [instituteDropdownOpen, setInstituteDropdownOpen] = useState(false);
  const [instituteSearch, setInstituteSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { isOnline } = useOnlineStatus();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchQuery.trim()) {
      navigateTo('search', { searchQuery: globalSearchQuery.trim() });
    }
  };

  const navItems = [
    { id: 'library', label: 'Digital Library', icon: BookOpen },
    { id: 'lectures', label: 'Study Lectures', icon: Video, badge: 'New' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, highlight: true },
    { id: 'flashcards', label: 'AI Flashcards', icon: Sparkles, badge: 'AI' },
    { id: 'music', label: 'AI Music', icon: Music },
    { id: 'meetings', label: 'Online Meetings', icon: Video, badge: 'Live' },
    { id: 'whiteboard', label: 'Whiteboard', icon: PenTool },
    { id: 'chat', label: 'Chat System', icon: MessageSquare },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md text-slate-100 transition-colors dark:bg-slate-950/95 dark:border-slate-800/80 light:bg-white light:border-slate-200 light:text-slate-800">
      {/* Top Banner Notice matching the reference blueprint style */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 px-4 py-1.5 text-xs text-white flex items-center justify-between font-medium shadow-inner">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="tracking-wide">
              Dot X Academic Learning Platform • <span className="italic font-serif font-bold text-sky-200">Learn • Connect • Grow with Dot X</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 text-blue-100 text-xs">
            {/* Quick Demo Role Switcher for instant evaluation */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="hover:text-white flex items-center space-x-1.5 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-400/30 transition-all text-[11px]"
                title="Switch demo persona for instant evaluation"
              >
                <span>Role: <strong className="text-white capitalize">{user?.role || 'Guest'}</strong></span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {roleSwitcherOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-60 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-slate-200"
                  onClick={() => setRoleSwitcherOpen(false)}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Select Demo Persona:
                  </div>
                  <button
                    onClick={() => quickSwitchAccount('student')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Jawad Hassan</div>
                      <div className="text-[10px] text-slate-400">Student Account</div>
                    </div>
                    {user?.role === 'student' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => quickSwitchAccount('teacher')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Dr. Sarah Khan</div>
                      <div className="text-[10px] text-slate-400">Teacher / Faculty Host</div>
                    </div>
                    {user?.role === 'teacher' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => quickSwitchAccount('subadmin')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Hamza Malik</div>
                      <div className="text-[10px] text-cyan-300">Sub-Admin (Books, Notices, Meets)</div>
                    </div>
                    {user?.role === 'subadmin' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => quickSwitchAccount('admin')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Prof. Muhammad Tariq</div>
                      <div className="text-[10px] text-blue-300">Main Admin (Punjab College)</div>
                    </div>
                    {user?.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => quickSwitchAccount('superadmin')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Super Admin</div>
                      <div className="text-[10px] text-amber-400">Full System & Multi-Institute</div>
                    </div>
                    {user?.role === 'superadmin' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Mode: Web vs Mobile simulator */}
            <button
              onClick={toggleMobileSimulator}
              className="flex items-center space-x-1 hover:text-white transition-colors bg-white/10 px-2 py-0.5 rounded text-[11px]"
              title="Toggle simulated mobile viewport or full desktop"
            >
              {isMobileSimulator ? <Monitor className="w-3 h-3 text-sky-300" /> : <Smartphone className="w-3 h-3 text-amber-300" />}
              <span>{isMobileSimulator ? 'Switch to Desktop Web' : 'Mobile Simulator'}</span>
            </button>

            {/* Firebase Auth & Firestore Status Tag */}
            <div className="hidden md:flex items-center space-x-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Firebase Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo matching reference .X Dot X Learner Platform */}
        <div
          onClick={() => navigateTo('home')}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          <DotXLogo size="lg" variant="light" />
          <div>
            <div className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              <span>Dot X Learner Platform</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-400 font-medium tracking-wide">
              Advanced Academic Learning Platform
            </p>
          </div>
        </div>

        {/* Persistent Institute Selector for Super Admins */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={() => setInstituteDropdownOpen(!instituteDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/40 hover:border-amber-400 text-xs text-slate-100 transition-all shadow-sm group"
              title="Super Admin: Switch between active institutes to change global application scope"
            >
              <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Landmark className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex items-center space-x-1.5">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold hidden sm:inline">Institute:</span>
                <span className="font-semibold text-white max-w-[120px] sm:max-w-[170px] truncate">
                  {selectedInstituteId === 'all' ? 'All Institutes (Global)' : (selectedInstitute?.name || 'Dot X Central')}
                </span>
                {selectedInstitute?.code && selectedInstituteId !== 'all' && (
                  <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[9px] font-bold rounded">
                    {selectedInstitute.code}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${instituteDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {instituteDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setInstituteDropdownOpen(false)} />
                <div
                  className="absolute left-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Landmark className="w-4 h-4 text-amber-400" />
                      <span>Switch Active Institute Scope</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Isolates catalog, students, and classrooms
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase border border-amber-500/30">
                    Super Admin
                  </span>
                </div>

                {/* Filter input */}
                {institutes.length > 2 && (
                  <div className="my-2">
                    <input
                      type="text"
                      placeholder="Search institutes..."
                      value={instituteSearch}
                      onChange={(e) => setInstituteSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Institutes List */}
                <div className="max-h-60 overflow-y-auto space-y-1 my-2 pr-1">
                  {/* Option: All Institutes */}
                  <button
                    onClick={() => {
                      setSelectedInstituteId('all');
                      setInstituteDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      selectedInstituteId === 'all'
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                        ALL
                      </div>
                      <div>
                        <div className="font-semibold text-white">All Institutes (Global Overview)</div>
                        <div className="text-[10px] text-slate-400">Aggregated view across all campuses</div>
                      </div>
                    </div>
                    {selectedInstituteId === 'all' && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>

                  {institutes
                    .filter(inst => !instituteSearch || inst.name.toLowerCase().includes(instituteSearch.toLowerCase()) || inst.code.toLowerCase().includes(instituteSearch.toLowerCase()))
                    .map((inst) => {
                      const isSelected = selectedInstituteId === inst.id;
                      return (
                        <button
                          key={inst.id}
                          onClick={() => {
                            setSelectedInstituteId(inst.id);
                            setInstituteDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-500/50 text-white font-semibold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                              {inst.code}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white flex items-center space-x-1.5 truncate">
                                <span className="truncate">{inst.name}</span>
                                {inst.status === 'suspended' && (
                                  <span className="text-[9px] px-1 bg-rose-500/20 text-rose-300 rounded font-normal shrink-0">Suspended</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[190px]">
                                Admin: {inst.adminName} • {inst.bookCount ?? 0} Books
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                </div>

                {/* Footer Link to Institute Management */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setInstituteDropdownOpen(false);
                      navigateTo('admin-institutes');
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Manage Institutes & Data &rarr;</span>
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* Global Search Input (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, authors, courses, meetings..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:bg-slate-900 dark:border-slate-800 light:bg-slate-100 light:border-slate-300 light:text-slate-900"
            />
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs">
                <div className="text-slate-400 font-medium mb-1.5">Quick Academic Searches:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Python Programming', 'Algorithms', 'Discrete Math', 'Physics', 'Live Classes'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setGlobalSearchQuery(tag);
                        navigateTo('search', { searchQuery: tag });
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600/30 text-blue-300 rounded-full transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Navigation Items (Desktop) */}
        <nav className="hidden xl:flex items-center space-x-1 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as any)}
                className={`relative px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions Right */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Offline Status Badge if disconnected */}
          {!isOnline && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </div>
          )}

          {/* In-App PWA Install Prompt Button */}
          <PWAInstallButton compact />

          {/* Offline Vault Shortcut */}
          <button
            onClick={() => navigateTo('library')}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            title="Open Offline Vault (IndexedDB Cached Books & Notes)"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Offline Vault</span>
          </button>

          {/* Notifications Shortcut */}
          <button
            onClick={() => navigateTo('notifications')}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* Admin Panel Button */}
          {isAdmin && (
            <button
              onClick={() => navigateTo('admin-dashboard')}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                currentPage.startsWith('admin-')
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* User Profile Avatar / Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all dark:bg-slate-900 dark:border-slate-800 light:bg-slate-100 light:border-slate-300"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-blue-500/40"
                />
                <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => navigateTo('profile')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>My Profile & Reading History</span>
                  </button>

                  <button
                    onClick={() => navigateTo('profile')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-amber-500/10 text-amber-300 flex items-center space-x-2 transition-colors"
                  >
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>Reading Goals & Targets</span>
                  </button>

                  <button
                    onClick={() => navigateTo('settings')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => navigateTo('admin-dashboard')}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-amber-500/10 text-amber-300 flex items-center space-x-2 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Admin Control Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openAuthModal('register');
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-blue-600/10 text-blue-300 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span>Register New Student Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Log In to Another Account</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books & academic material..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
            />
          </form>

          {/* Super Admin Mobile Institute Selector */}
          {isSuperAdmin && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 mb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Active Institute Scope:</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                  Super Admin
                </span>
              </div>
              <select
                value={selectedInstituteId}
                onChange={(e) => setSelectedInstituteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2 focus:border-amber-400 focus:outline-none"
              >
                <option value="all">🌐 All Institutes (Global Overview)</option>
                {institutes.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    🏛️ [{inst.code}] {inst.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-lg flex items-center space-x-2 text-xs font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-blue-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                navigateTo('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center space-x-2 mt-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Management Portal</span>
            </button>
          )}

          {!user ? (
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="flex-1 py-2.5 text-center text-xs font-bold bg-blue-600 text-white rounded-xl shadow"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="w-full py-2 text-center text-xs font-semibold text-blue-400 bg-blue-950/40 border border-blue-900/60 rounded-xl flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Student Account</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

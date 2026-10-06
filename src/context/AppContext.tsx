import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getSelectedInstituteId, setSelectedInstituteId as persistInstituteId } from '../services/api.js';
import { playNotificationTune, getActiveNotificationTune } from '../services/soundService.js';
import { Institute } from '../types/index.js';

export type PageId =
  | 'home'
  | 'dashboard'
  | 'library'
  | 'book-details'
  | 'reading'
  | 'search'
  | 'notifications'
  | 'ai-assistant'
  | 'flashcards'
  | 'music'
  | 'meetings'
  | 'meeting-room'
  | 'whiteboard'
  | 'chat'
  | 'lectures'
  | 'contact'
  | 'about'
  | 'profile'
  | 'settings'
  // Admin pages
  | 'admin-dashboard'
  | 'admin-institutes'
  | 'admin-books'
  | 'admin-categories'
  | 'admin-lectures'
  | 'admin-users'
  | 'admin-admins'
  | 'admin-roles'
  | 'admin-notifications'
  | 'admin-meetings'
  | 'admin-live-control'
  | 'admin-ai'
  | 'admin-contact'
  | 'admin-content'
  | 'admin-reports'
  | 'admin-logs'
  | 'admin-settings'
  // Auth pages
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'otp';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextType {
  currentPage: PageId;
  navigateTo: (page: PageId, options?: { bookId?: string; meetingId?: string; searchQuery?: string }) => void;
  selectedBookId: string | null;
  setSelectedBookId: (id: string | null) => void;
  selectedMeetingId: string | null;
  setSelectedMeetingId: (id: string | null) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  isMobileSimulator: boolean;
  setIsMobileSimulator: (val: boolean) => void;
  toggleMobileSimulator: () => void;
  unreadNotificationsCount: number;
  unreadChatCount: number;
  refreshCounters: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  // Institute Scoping
  selectedInstituteId: string;
  selectedInstitute: Institute | null;
  institutes: Institute[];
  setSelectedInstituteId: (id: string) => void;
  refreshInstitutes: () => Promise<void>;
  instituteScopeVersion: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Parse URL search parameters on boot for meeting links: ?meetingId=... or ?meetCode=... or ?code=...
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const paramMeetingId = urlParams?.get('meetingId');
  const paramMeetCode = urlParams?.get('meetCode') || urlParams?.get('code');

  const initialMeetingId = paramMeetingId || 'meet_cs_live';
  const initialPage: PageId = (paramMeetingId || paramMeetCode) ? 'meeting-room' : 'home';

  const [currentPage, setCurrentPage] = useState<PageId>(initialPage);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(urlParams?.get('bookId') || 'book_python_prog');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(initialMeetingId);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isMobileSimulator, setIsMobileSimulator] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Institute Multi-Tenant Context State
  const [selectedInstituteId, setSelectedInstituteIdState] = useState<string>(() => getSelectedInstituteId() || 'inst_dotx');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [instituteScopeVersion, setInstituteScopeVersion] = useState<number>(0);

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };
  const closeAuthModal = () => setAuthModalOpen(false);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { ...toast, id }]);

    // Play user-selected notification tune
    try {
      const activeTune = getActiveNotificationTune();
      playNotificationTune(activeTune);
    } catch {}

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshInstitutes = async () => {
    try {
      const res = await api.getInstitutes();
      if (res.success && Array.isArray(res.institutes)) {
        setInstitutes(res.institutes);
      }
    } catch (e) {
      console.error("Failed to load institutes:", e);
    }
  };

  const setSelectedInstituteId = (id: string) => {
    setSelectedInstituteIdState(id);
    persistInstituteId(id);
    setInstituteScopeVersion(v => v + 1);

    const match = institutes.find(i => i.id === id);
    if (id === 'all') {
      addToast({
        type: 'info',
        title: 'Global Scope Activated',
        message: 'Viewing aggregated catalog, users, and classrooms across all institutes.'
      });
    } else if (match) {
      addToast({
        type: 'success',
        title: 'Institute Scope Switched',
        message: `Active workspace switched to ${match.name} (${match.code}).`
      });
    }
    refreshCounters();
  };

  const selectedInstitute = institutes.find(i => i.id === selectedInstituteId) || null;

  const refreshCounters = async () => {
    try {
      const notifs = await api.getNotifications();
      if (notifs.success) {
        const unread = notifs.notifications.filter((n: any) => !n.isRead).length;
        setUnreadNotificationsCount(unread);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshInstitutes();
    refreshCounters();

    // Auto-resolve meeting code if provided in query param
    if (paramMeetCode && !paramMeetingId) {
      api.getMeetingByCode(paramMeetCode).then(res => {
        if (res.success && res.meeting) {
          setSelectedMeetingId(res.meeting.id);
          setCurrentPage('meeting-room');
        }
      }).catch(err => console.warn('Could not auto-resolve meet code:', err));
    }

    const interval = setInterval(refreshCounters, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigateTo = (page: PageId, options?: { bookId?: string; meetingId?: string; searchQuery?: string }) => {
    if (page === 'login') {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      setCurrentPage('login');
      return;
    }
    if (page === 'signup') {
      setAuthModalMode('register');
      setAuthModalOpen(true);
      setCurrentPage('signup');
      return;
    }

    if (options?.bookId) setSelectedBookId(options.bookId);
    if (options?.meetingId) setSelectedMeetingId(options.meetingId);
    if (options?.searchQuery !== undefined) setGlobalSearchQuery(options.searchQuery);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMobileSimulator = () => {
    setIsMobileSimulator(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
        selectedBookId,
        setSelectedBookId,
        selectedMeetingId,
        setSelectedMeetingId,
        globalSearchQuery,
        setGlobalSearchQuery,
        isMobileSimulator,
        setIsMobileSimulator,
        toggleMobileSimulator,
        unreadNotificationsCount,
        unreadChatCount,
        refreshCounters,
        toasts,
        addToast,
        removeToast,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        selectedInstituteId,
        selectedInstitute,
        institutes,
        setSelectedInstituteId,
        refreshInstitutes,
        instituteScopeVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};


import React from 'react';
import { useApp } from './context/AppContext.js';
import { useAuth } from './context/AuthContext.js';
import { useTheme } from './context/ThemeContext.js';

// Common Components
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { MobileBottomNav } from './components/common/MobileBottomNav.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { OfflineIndicator } from './components/common/OfflineIndicator.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { AuthPage } from './components/auth/AuthPage.js';

// User / Student Pages
import { HomePage } from './components/user/HomePage.js';
import { LibraryPage } from './components/user/LibraryPage.js';
import { BookDetailsPage } from './components/user/BookDetailsPage.js';
import { PdfReaderPage } from './components/user/PdfReaderPage.js';
import { AiAssistantPage } from './components/user/AiAssistantPage.js';
import { FlashcardsPage } from './components/user/FlashcardsPage.js';
import { MusicGenerationPage } from './components/user/MusicGenerationPage.js';
import { MeetingsPage } from './components/user/MeetingsPage.js';
import { MeetingRoomPage } from './components/user/MeetingRoomPage.js';
import { WhiteboardPage } from './components/user/WhiteboardPage.js';
import { ChatPage } from './components/user/ChatPage.js';
import { LecturesHubPage } from './components/user/LecturesHubPage.js';
import { SearchPage } from './components/user/SearchPage.js';
import { NotificationsPage } from './components/user/NotificationsPage.js';
import { ContactPage } from './components/user/ContactPage.js';
import { AboutPage } from './components/user/AboutPage.js';
import { ProfilePage } from './components/user/ProfilePage.js';
import { SettingsPage } from './components/user/SettingsPage.js';
import { JobProfilePage } from './components/user/JobProfilePage.js';
import { PrivateChatDock } from './components/chat/PrivateChatDock.js';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { InstituteManagement } from './components/admin/InstituteManagement.js';
import { BookManagement } from './components/admin/BookManagement.js';
import { CategoryManagement } from './components/admin/CategoryManagement.js';
import { UserManagement } from './components/admin/UserManagement.js';
import { AdminManagement } from './components/admin/AdminManagement.js';
import { RolePermissionManagement } from './components/admin/RolePermissionManagement.js';
import { NotificationManagement } from './components/admin/NotificationManagement.js';
import { MeetingManagement } from './components/admin/MeetingManagement.js';
import { LiveMeetingControl } from './components/admin/LiveMeetingControl.js';
import { AiManagement } from './components/admin/AiManagement.js';
import { ContactManagement } from './components/admin/ContactManagement.js';
import { ReportsAnalytics } from './components/admin/ReportsAnalytics.js';
import { SecurityActivityLogs } from './components/admin/SecurityActivityLogs.js';
import { SystemSettings } from './components/admin/SystemSettings.js';

export function App() {
  const { currentPage, authModalOpen, authModalMode, closeAuthModal } = useApp();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();

  // Determine if this is an admin page
  const isAdminPage = currentPage.startsWith('admin-');

  // Render the current view
  const renderCurrentView = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'library':
        return <LibraryPage />;
      case 'book-details':
        return <BookDetailsPage />;
      case 'reading':
        return <PdfReaderPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'music':
        return <MusicGenerationPage />;
      case 'meetings':
        return <MeetingsPage />;
      case 'meeting-room':
        return <MeetingRoomPage />;
      case 'whiteboard':
        return <WhiteboardPage />;
      case 'chat':
        return <ChatPage />;
      case 'lectures':
        return <LecturesHubPage />;
      case 'search':
        return <SearchPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'contact':
        return <ContactPage />;
      case 'about':
        return <AboutPage />;
      case 'dashboard':
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'job-profile':
      case 'jobs':
        return <JobProfilePage />;

      // Admin Pages
      case 'admin-dashboard':
        return (
          <AdminLayout activeTab="admin-dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      case 'admin-institutes':
        return (
          <AdminLayout activeTab="admin-institutes">
            <InstituteManagement />
          </AdminLayout>
        );
      case 'admin-books':
        return (
          <AdminLayout activeTab="admin-books">
            <BookManagement />
          </AdminLayout>
        );
      case 'admin-categories':
        return (
          <AdminLayout activeTab="admin-categories">
            <CategoryManagement />
          </AdminLayout>
        );
      case 'admin-lectures':
        return (
          <AdminLayout activeTab="admin-lectures">
            <LecturesHubPage />
          </AdminLayout>
        );
      case 'admin-users':
        return (
          <AdminLayout activeTab="admin-users">
            <UserManagement />
          </AdminLayout>
        );
      case 'admin-admins':
        return (
          <AdminLayout activeTab="admin-admins">
            <AdminManagement />
          </AdminLayout>
        );
      case 'admin-roles':
        return (
          <AdminLayout activeTab="admin-roles">
            <RolePermissionManagement />
          </AdminLayout>
        );
      case 'admin-notifications':
        return (
          <AdminLayout activeTab="admin-notifications">
            <NotificationManagement />
          </AdminLayout>
        );
      case 'admin-meetings':
        return (
          <AdminLayout activeTab="admin-meetings">
            <MeetingManagement />
          </AdminLayout>
        );
      case 'admin-live-control':
        return (
          <AdminLayout activeTab="admin-live-control">
            <LiveMeetingControl />
          </AdminLayout>
        );
      case 'admin-ai':
        return (
          <AdminLayout activeTab="admin-ai">
            <AiManagement />
          </AdminLayout>
        );
      case 'admin-contact':
        return (
          <AdminLayout activeTab="admin-contact">
            <ContactManagement />
          </AdminLayout>
        );
      case 'admin-reports':
        return (
          <AdminLayout activeTab="admin-reports">
            <ReportsAnalytics />
          </AdminLayout>
        );
      case 'admin-logs':
        return (
          <AdminLayout activeTab="admin-logs">
            <SecurityActivityLogs />
          </AdminLayout>
        );
      case 'admin-settings':
        return (
          <AdminLayout activeTab="admin-settings">
            <SystemSettings />
          </AdminLayout>
        );

      // Auth Dedicated Page Views
      case 'login':
        return <AuthPage initialMode="login" />;
      case 'signup':
        return <AuthPage initialMode="register" />;

      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[#080c14] text-slate-100' : 'bg-slate-50 text-slate-900'} antialiased flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Header & Navigation */}
      <Header />

      {/* Main Page Area */}
      <main className={`flex-1 w-full mx-auto ${currentPage === 'ai-assistant' ? 'max-w-6xl px-2 sm:px-4 pt-3 pb-6' : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-5'}`}>
        {renderCurrentView()}
      </main>

      {/* Global Footer with Brand Pillars & Viewport Selectors */}
      <Footer />

      {/* Mobile Sticky Bottom Navigation (Hidden on desktop) */}
      <MobileBottomNav />

      {/* Interactive Global Elements */}
      <ToastContainer />
      <OfflineIndicator />
      <PrivateChatDock />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />
    </div>
  );
}

export default App;

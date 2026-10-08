import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Bot,
  Video,
  PenTool,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Star,
  Download,
  Bookmark,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  Layers,
  Award,
  Plus,
  Share2,
  Music,
  Target,
  UserPlus,
  Bell,
  Globe,
  Lock,
  Brain,
  Upload,
  Image as ImageIcon,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Book, Category, Meeting, Notification } from '../../types/index.js';
import { DotXLogo } from '../common/DotXLogo.js';
import { ReadingGoalsTracker } from './ReadingGoalsTracker.js';

export const HomePage: React.FC = () => {
  const { navigateTo, setGlobalSearchQuery, addToast, openAuthModal } = useApp();
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [booksRes, catsRes, meetsRes, notifsRes] = await Promise.all([
          api.getBooks({ limit: 12 }),
          api.getCategories(),
          api.getMeetings({ status: 'upcoming' }),
          api.getNotifications().catch(() => ({ success: false, notifications: [] }))
        ]);

        if (booksRes.success) {
          setFeaturedBooks(booksRes.books.filter(b => b.isFeatured));
          setPopularBooks(booksRes.books.slice(0, 6));
        }
        if (catsRes.success) {
          setCategories(catsRes.categories.slice(0, 8));
        }
        if (meetsRes.success) {
          setUpcomingMeetings(meetsRes.meetings.slice(0, 3));
        }
        if (notifsRes.success && notifsRes.notifications) {
          setAnnouncements(notifsRes.notifications.slice(0, 3));
        }
      } catch (err) {
        console.error("Home data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setGlobalSearchQuery(searchInput.trim());
      navigateTo('search', { searchQuery: searchInput.trim() });
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    try {
      const res = await api.toggleBookmark(bookId);
      if (res.success) {
        addToast({
          type: 'success',
          title: res.isBookmarked ? 'Book Saved' : 'Bookmark Removed',
          message: res.message
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update bookmark' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-3 mb-4">
            <DotXLogo size="md" variant="light" />
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Advanced Academic Learning Platform</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Welcome to Dot X Learner Platform
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {user
              ? `Hello ${user.name}! Your complete academic learning platform with textbooks, interactive PDF reader, live meetings, whiteboard, and pedagogical AI assistance.`
              : 'Your complete academic learning platform with textbooks, interactive PDF reader, live meetings, whiteboard, and pedagogical AI assistance.'}
          </p>

          {/* Quick guest onboarding buttons */}
          {!user && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up with Institute</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Log In</span>
              </button>
            </div>
          )}

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Python, Algorithms, Calculus, Quantum Physics..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Search Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Stats Badges */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span><strong>328+</strong> Academic Books</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Video className="w-4 h-4 text-emerald-400" />
              <span><strong>Live</strong> Classrooms & Whiteboard</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span><strong>24/7</strong> AI Academic Tutor</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Action Icons Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {[
          { label: 'Digital Library', desc: 'Browse all textbooks', icon: BookOpen, color: 'from-blue-600 to-indigo-600', action: () => navigateTo('library') },
          { label: 'Study Lectures', desc: 'Admin videos & pictures', icon: Video, color: 'from-indigo-600 to-sky-600', action: () => navigateTo('lectures'), badge: 'New' },
          { label: 'AI Flashcards', desc: 'Chapter study decks', icon: Brain, color: 'from-purple-600 to-indigo-600', action: () => navigateTo('flashcards'), badge: 'AI' },
          { label: 'Gemini Assistant', desc: 'Google Gemini 2.0 AI', icon: Sparkles, color: 'from-blue-600 via-indigo-600 to-rose-500', action: () => navigateTo('ai-assistant'), badge: 'Gemini' },
          { label: 'Focus Music', desc: 'Lyria study audio', icon: Music, color: 'from-pink-600 to-purple-600', action: () => navigateTo('music'), badge: 'Lyria' },
          { label: 'Live Meetings', desc: 'Join online classes', icon: Video, color: 'from-emerald-600 to-teal-600', action: () => navigateTo('meetings'), badge: 'Live' },
          { label: 'Whiteboard', desc: 'Collaborative canvas', icon: PenTool, color: 'from-indigo-600 to-purple-600', action: () => navigateTo('whiteboard') },
          { label: 'Live Chat', desc: 'Teacher & student inbox', icon: MessageSquare, color: 'from-amber-600 to-orange-600', action: () => navigateTo('chat') },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <div
              key={idx}
              onClick={action.action}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                  {action.label}
                </h3>
                {action.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    {action.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
            </div>
          );
        })}
      </section>

      {/* AI Flashcards Feature Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-blue-950/60 border border-purple-500/30 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Active-Recall Exam Preparation</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              AI Chapter Flashcard Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Select any textbook chapter from your course catalog. Gemini AI automatically extracts key concepts, mathematical invariants, and core principles into interactive study flashcards for 2x faster retention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('flashcards')}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>Launch Flashcards Studio &rarr;</span>
            </button>
            <button
              onClick={() => navigateTo('library')}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-2xl text-xs border border-slate-700 transition-colors"
            >
              Browse Library Books
            </button>
          </div>
        </div>
      </section>

      {/* Study Lectures & Visual Media Hub Feature Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-cyan-300" />
              <span>Admin Study Hub • Videos & Pictures</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Study Lectures & Visual Media
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Academic administrators upload lecture videos and study pictures. Easily like, react with emojis (your name is shown to everyone!), join comments, share links, and switch between <strong>Private (Institute Only)</strong> and <strong>Global (All Users)</strong> materials.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Video className="w-3 h-3 text-cyan-400" />
                <span>Lecture Videos</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 text-purple-400" />
                <span>Study Infographics</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Reactions with Names</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center space-x-1">
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span>One-Click Share</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('lectures')}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Explore Study Lectures &rarr;</span>
            </button>
            {user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'subadmin') && (
              <button
                onClick={() => navigateTo('lectures')}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-2xl text-xs border border-slate-700 transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Upload</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Campus Announcements (Option 1: Institute-Only vs Option 2: Global) */}
      {announcements.length > 0 && (
        <section className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-inner">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Campus Announcements & Notices</span>
                  {user?.instituteName && (
                    <span className="text-[10px] font-semibold text-blue-400">({user.instituteName})</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Campus updates: Option 1 (Enrolled Institute Only) & Option 2 (Show Global Bulletins)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('notifications')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>View All Updates ({announcements.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {announcements.slice(0, 3).map((item) => {
              const isGlobal = item.visibility === 'global' || item.isGlobal === true || !item.instituteId || item.instituteId === 'all';
              return (
                <div
                  key={item.id}
                  onClick={() => navigateTo('notifications')}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      {isGlobal ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                          <Globe className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Option 2: Show Global</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Option 1: Institute Only</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {item.instituteName && (
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1.5 border-t border-slate-900">
                      <span>🏛️ {item.instituteName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2.5 Student Academic Dashboard - Reading Goals Tracker */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Student Reading Goals & Targets</h2>
          </div>
          <span className="text-xs text-slate-400">
            {user ? `${user.name}'s Academic Dashboard` : 'Personalized Target Tracker'}
          </span>
        </div>
        <ReadingGoalsTracker />
      </section>

      {/* 3. Featured Books Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Featured Textbooks</h2>
          </div>
          <button
            onClick={() => navigateTo('library')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => navigateTo('book-details', { bookId: book.id })}
              className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-blue-500/50 hover:shadow-xl transition-all duration-200 flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 right-2.5 flex space-x-1">
                  <button
                    onClick={(e) => handleBookmarkToggle(e, book.id)}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-400 backdrop-blur-sm transition-colors"
                    title="Save to bookmarks"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/90 text-white backdrop-blur-sm">
                    {book.categoryName}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
                  <p className="text-xs text-slate-400/90 mt-2 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1 text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{book.rating}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('reading', { bookId: book.id });
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-[11px] transition-colors"
                    >
                      Read Online
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Split Section: Upcoming Meetings & Academic Categories */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Live Classes (1 Col) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Live Academic Classes</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTo('meetings')}
                className="text-xs text-blue-400 hover:underline"
              >
                All Meetings
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((meet) => (
              <div
                key={meet.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {meet.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{meet.startTime}</span>
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-white mt-1.5">{meet.title}</h4>
                  <p className="text-xs text-slate-400">Host: {meet.hostName}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Code: {meet.meetCode}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/?meetingId=${meet.id}&meetCode=${meet.meetCode}`;
                        navigator.clipboard.writeText(link);
                        addToast({
                          type: 'info',
                          title: 'Link Copied',
                          message: `Share link for "${meet.title}" copied!`
                        });
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                      title="Copy Share Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigateTo('meeting-room', { meetingId: meet.id })}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                    >
                      Join Class
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigateTo('meetings')}
            className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create / Schedule Meeting</span>
          </button>
        </div>

        {/* Categories Grid (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Academic Disciplines</h3>
            </div>
            <button
              onClick={() => navigateTo('library')}
              className="text-xs text-blue-400 hover:underline"
            >
              Browse Catalog
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigateTo('library')}
                className="group cursor-pointer p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-blue-600/10 hover:border-blue-500/40 transition-all text-center"
              >
                <div className="w-9 h-9 mx-auto rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.bookCount || 10}+ textbooks</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI Assistant Promotion Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-slate-900 border border-blue-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" />
            <span>Dedicated Pedagogical Assistant</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Need help understanding complex academic concepts?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Experience Google Gemini's latest AI assistant variant: empathetic, friendly, and deeply reliable with multimodal camera homework solver, clear step-by-step proofs, and clean formatting.
          </p>
        </div>

        <button
          onClick={() => navigateTo('ai-assistant')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Gemini Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};

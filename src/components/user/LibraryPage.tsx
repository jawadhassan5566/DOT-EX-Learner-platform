import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Download,
  Bookmark,
  Star,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Lock,
  Share2,
  HardDrive,
  CheckCircle2,
  Database,
  WifiOff,
  Sparkles,
  Brain
} from 'lucide-react';
import { Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Book, Category } from '../../types/index.js';
import { offlineDb } from '../../services/offlineDb.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { OfflineVaultView } from './OfflineVaultView.js';

export const LibraryPage: React.FC = () => {
  const { navigateTo, addToast, selectedInstituteId, selectedInstitute, instituteScopeVersion } = useApp();
  const { user, isSuperAdmin } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'catalog' | 'offline_vault'>('catalog');
  const [offlineBookIds, setOfflineBookIds] = useState<Set<string>>(new Set());
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<string>('popular');
  const [loading, setLoading] = useState(true);

  const refreshOfflineStatus = async () => {
    try {
      const offlineList = await offlineDb.getAllOfflineBooks();
      setOfflineBookIds(new Set(offlineList.map((b) => b.id)));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Categories & Books
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await refreshOfflineStatus();

        const [catRes, booksRes] = await Promise.all([
          api.getCategories().catch(() => ({ success: false, categories: [] })),
          api.getBooks({
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery.trim() || undefined,
            sort: selectedSort
          }).catch(() => ({ success: false, books: [] }))
        ]);

        if (catRes.success) setCategories(catRes.categories);
        if (booksRes.success && booksRes.books.length > 0) {
          setBooks(booksRes.books);
        } else if (!isOnline) {
          // If offline and no network response, fall back to offline cached books
          const cached = await offlineDb.getAllOfflineBooks();
          setBooks(cached as unknown as Book[]);
        }
      } catch (err) {
        console.error("Library fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, selectedSort, selectedInstituteId, instituteScopeVersion, isOnline]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getBooks({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sort: selectedSort
      });
      if (res.success) setBooks(res.books);
    } catch {
      if (!isOnline) {
        const cached = await offlineDb.getAllOfflineBooks();
        const filtered = cached.filter(b => 
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setBooks(filtered as unknown as Book[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    try {
      const res = await api.toggleBookmark(bookId);
      if (res.success) {
        addToast({
          type: 'success',
          title: res.isBookmarked ? 'Bookmarked' : 'Removed',
          message: res.message
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDownload = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    try {
      // Save directly to IndexedDB
      await offlineDb.saveBookOffline(book);
      await refreshOfflineStatus();
      addToast({
        type: 'success',
        title: 'Saved to Offline Vault',
        message: `"${book.title}" is cached in IndexedDB for offline reading.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Restricted',
        message: err.message || 'Permission denied for this academic file.'
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Offline Alert Banner if disconnected */}
      {!isOnline && (
        <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-4 text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-amber-300">You are currently operating in Offline Mode</p>
              <p className="text-[11px] text-amber-400/80">
                Viewing books and study notes persisted locally in IndexedDB.
              </p>
            </div>
          </div>
          <button
            onClick={() => setViewMode('offline_vault')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1 flex-shrink-0"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Open Offline Vault</span>
          </button>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <span>Digital Academic Library</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access thousands of certified academic textbooks, research papers, and lecture manuals.
          </p>
        </div>

        {/* View mode toggle & search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Catalog vs Offline Vault Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'catalog'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Academic Catalog
            </button>
            <button
              onClick={() => setViewMode('offline_vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'offline_vault'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Offline Vault ({offlineBookIds.size})</span>
            </button>
          </div>

          {viewMode === 'catalog' && (
            <>
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </form>

              {/* Sort Selector */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Additions</option>
                  <option value="rating">Highest Rated</option>
                  <option value="downloads">Most Downloaded</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* When in Offline Vault View */}
      {viewMode === 'offline_vault' ? (
        <OfflineVaultView onClose={() => setViewMode('catalog')} />
      ) : (
        /* Main Catalog View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Filter Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md sticky top-24">
              <div className="flex items-center space-x-2 text-white font-bold text-sm mb-3">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Categories</span>
              </div>

              <div className="space-y-1">
                {/* Offline Vault Shortcut button in sidebar */}
                <button
                  onClick={() => setViewMode('offline_vault')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between bg-blue-950/40 border border-blue-500/30 text-blue-300 hover:bg-blue-900/40 transition-colors mb-2"
                >
                  <span className="flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Offline Vault</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                    {offlineBookIds.size}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>All Academic Books</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
                    {books.length}
                  </span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate mr-2">{cat.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/60 text-slate-400">
                      {cat.bookCount || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Book Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-white font-bold text-base">No books found</h3>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or selecting a different category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {books.map((book) => {
                  const isCached = offlineBookIds.has(book.id);

                  return (
                    <div
                      key={book.id}
                      onClick={() => navigateTo('book-details', { bookId: book.id })}
                      className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-blue-500/50 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 right-2.5 flex space-x-1">
                          <button
                            onClick={(e) => handleBookmark(e, book.id)}
                            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-400 backdrop-blur-sm transition-colors"
                            title="Save to bookmarks"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/90 text-white backdrop-blur-sm">
                            {book.categoryName}
                          </span>
                          {isCached && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-sm flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Offline</span>
                            </span>
                          )}
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
                            {book.downloadAllowed ? (
                              <button
                                onClick={(e) => handleDownload(e, book)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isCached
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                                title={isCached ? 'Cached in IndexedDB' : 'Download and cache for offline reading'}
                              >
                                {isCached ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <span
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed"
                                title="Protected: Read Online Only"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sessionStorage.setItem('dotx_flashcard_book_id', book.id);
                                sessionStorage.setItem('dotx_flashcard_chapter_index', '0');
                                navigateTo('flashcards');
                              }}
                              className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/30 transition-colors"
                              title="Generate AI Active-Recall Study Flashcards"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo('reading', { bookId: book.id });
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-[11px] transition-colors"
                            >
                              {isCached ? 'Read Offline' : 'Read Online'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

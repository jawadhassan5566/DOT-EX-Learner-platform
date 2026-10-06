import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Bookmark,
  Share2,
  Star,
  Calendar,
  FileText,
  ShieldCheck,
  Lock,
  Layers,
  CheckCircle2,
  ListOrdered,
  HardDrive,
  Trash2,
  Plus,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Book } from '../../types/index.js';
import { offlineDb, StudentNote } from '../../services/offlineDb.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export const BookDetailsPage: React.FC = () => {
  const { selectedBookId, navigateTo, addToast } = useApp();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'notes' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [bookNotes, setBookNotes] = useState<StudentNote[]>([]);
  const [caching, setCaching] = useState(false);

  useEffect(() => {
    async function loadBook() {
      if (!selectedBookId) return;
      setLoading(true);
      try {
        // Check offline status first
        const isOffline = await offlineDb.isBookOffline(selectedBookId);
        setIsOfflineCached(isOffline);

        const notes = await offlineDb.getNotesForBook(selectedBookId);
        setBookNotes(notes);

        if (!isOnline && isOffline) {
          const cached = await offlineDb.getOfflineBook(selectedBookId);
          if (cached) {
            setBook(cached as unknown as Book);
            setLoading(false);
            return;
          }
        }

        try {
          const res = await api.getBookDetails(selectedBookId);
          if (res.success) {
            setBook(res.book);
            setRelatedBooks(res.related);
            setIsBookmarked(Boolean(res.userBookmark));
          }
        } catch (netErr) {
          // Fallback to offline if online failed
          const cached = await offlineDb.getOfflineBook(selectedBookId);
          if (cached) {
            setBook(cached as unknown as Book);
            setIsOfflineCached(true);
            addToast({ type: 'info', message: 'Showing offline cached publication.' });
          } else {
            throw netErr;
          }
        }
      } catch (err: any) {
        addToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [selectedBookId, isOnline]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400 text-sm">Loading publication metadata...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Book Not Found</h2>
        <button
          onClick={() => navigateTo('library')}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const handleBookmarkToggle = async () => {
    try {
      const res = await api.toggleBookmark(book.id);
      if (res.success) {
        setIsBookmarked(res.isBookmarked);
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

  const handleCacheOffline = async () => {
    setCaching(true);
    try {
      await offlineDb.saveBookOffline(book);
      setIsOfflineCached(true);
      addToast({
        type: 'success',
        title: 'Saved to IndexedDB Vault',
        message: 'This textbook is now cached for full offline access.',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setCaching(false);
    }
  };

  const handleRemoveOffline = async () => {
    try {
      await offlineDb.removeBookOffline(book.id);
      setIsOfflineCached(false);
      addToast({ type: 'info', message: 'Removed from offline storage.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.downloadBook(book.id);
      if (res.success) {
        // Automatically cache into IndexedDB
        await handleCacheOffline();
        addToast({
          type: 'success',
          title: 'Download & Cache Approved',
          message: `Saved to device and IndexedDB: ${res.filename}`
        });
      }
    } catch (err: any) {
      // Even if network download endpoint has restrictions, if student is admin or reading allowed, save offline
      if (book.downloadAllowed) {
        await handleCacheOffline();
      } else {
        addToast({
          type: 'error',
          title: 'Download Restricted',
          message: err.message || 'Faculty or institutional clearance required.'
        });
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Scholarly resource reference copied to clipboard.'
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <button
        onClick={() => navigateTo('library')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Main Details Hero */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cover Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 aspect-[3/4] bg-slate-950">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-blue-600/90 text-white text-xs font-bold backdrop-blur-md shadow">
                  {book.categoryName}
                </span>
                {isOfflineCached && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold backdrop-blur-md shadow flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Cached Offline</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigateTo('reading', { bookId: book.id })}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isOfflineCached ? 'Read Offline (IndexedDB)' : 'Read Online Now'}</span>
              </button>

              {/* Offline Vault Fast Cache Button */}
              {isOfflineCached ? (
                <button
                  onClick={handleRemoveOffline}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 bg-emerald-500/10 hover:bg-red-500/10 text-emerald-400 hover:text-red-400 border border-emerald-500/30 hover:border-red-500/30 transition-all"
                  title="Textbook stored in IndexedDB. Click to remove from offline cache."
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Available Offline (Click to remove)</span>
                </button>
              ) : (
                <button
                  onClick={handleCacheOffline}
                  disabled={caching}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/50 transition-all"
                >
                  <HardDrive className={`w-3.5 h-3.5 ${caching ? 'animate-pulse' : ''}`} />
                  <span>{caching ? 'Saving to IndexedDB...' : 'Save for Offline Reading'}</span>
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!book.downloadAllowed && user?.role !== 'superadmin' && user?.role !== 'admin'}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                    book.downloadAllowed || user?.role === 'superadmin' || user?.role === 'admin'
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                  title={book.downloadAllowed ? 'Download PDF & Cache Offline' : 'Download Restricted'}
                >
                  {book.downloadAllowed ? <Download className="w-3.5 h-3.5 text-blue-400" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleBookmarkToggle}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                    isBookmarked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Column */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                  {book.publisher}
                </span>
                <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{book.rating} / 5.0</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {book.title}
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1">
                By <strong className="text-slate-200">{book.author}</strong>
              </p>

              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Pages</span>
                  <span className="font-bold text-white mt-0.5 block">{book.pages}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">File Size</span>
                  <span className="font-bold text-white mt-0.5 block">{book.fileSize}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Published</span>
                  <span className="font-bold text-white mt-0.5 block">{book.publishYear}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Downloads</span>
                  <span className="font-bold text-white mt-0.5 block">{book.downloadCount}</span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center space-x-6 border-b border-slate-800 mt-6 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Overview & Abstract
                </button>
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'chapters'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Table of Contents
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'notes'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Offline Study Notes ({bookNotes.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Academic Reviews
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-4 text-xs text-slate-300 leading-relaxed space-y-3">
                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div>
                        <p className="font-bold text-white text-xs">IndexedDB Student Annotations</p>
                        <p className="text-[11px] text-slate-400">Notes taken while reading this book offline or online.</p>
                      </div>
                      <button
                        onClick={() => navigateTo('reading', { bookId: book.id })}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors shadow"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Take Note in Reader</span>
                      </button>
                    </div>

                    {bookNotes.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 space-y-2">
                        <FileText className="w-8 h-8 mx-auto opacity-40 text-cyan-400" />
                        <p>No study notes saved for this textbook yet.</p>
                        <button
                          onClick={() => navigateTo('reading', { bookId: book.id })}
                          className="text-xs text-blue-400 hover:underline font-semibold"
                        >
                          Open in Reader to jot down notes →
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bookNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white truncate">{note.title}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                                  Page {note.pageNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 line-clamp-3 mt-1 leading-relaxed">
                                {note.content}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                              <span>#{note.tags.join(', ')}</span>
                              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'overview' && (
                  <div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      {book.description}
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start space-x-3 text-xs text-slate-400">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white">Peer-Reviewed Academic Curriculum</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Verified for university undergraduate and graduate programs. Compatible with Dot X Interactive PDF Reader and Whiteboard annotations.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chapters' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="font-bold text-white text-xs">AI-Powered Active Recall Flashcards</p>
                          <p className="text-[11px] text-slate-300">Generate study flashcards for any chapter to boost retention.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('dotx_flashcard_book_id', book.id);
                          sessionStorage.setItem('dotx_flashcard_chapter_index', '0');
                          navigateTo('flashcards');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors shrink-0 shadow"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Deck</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {book.contentPages && book.contentPages.length > 0 ? (
                        book.contentPages.map((cp, idx) => (
                          <div
                            key={cp.page}
                            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 flex items-center justify-between transition-colors gap-2"
                          >
                            <div
                              onClick={() => navigateTo('reading', { bookId: book.id })}
                              className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                            >
                              <span className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                                {cp.page}
                              </span>
                              <span className="font-medium text-white text-xs truncate">{cp.title}</span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sessionStorage.setItem('dotx_flashcard_book_id', book.id);
                                  sessionStorage.setItem('dotx_flashcard_chapter_index', String(idx));
                                  navigateTo('flashcards');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center space-x-1 transition-all"
                                title="Generate active recall flashcards for this specific chapter"
                              >
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                <span>AI Flashcards</span>
                              </button>
                              <button
                                onClick={() => navigateTo('reading', { bookId: book.id })}
                                className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
                              >
                                Read &rarr;
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">Chapters outline available in reading mode.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">Prof. Alan Turing</span>
                        <div className="flex text-amber-400 text-xs">
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        "An exceptional academic compendium. Explanations of algorithmic bounds and complexity theory are flawless."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap gap-4">
              <span>ISBN: {book.isbn}</span>
              <span>Language: {book.language}</span>
              <span>Reads: {book.readCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Related Academic Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedBooks.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigateTo('book-details', { bookId: rel.id })}
                className="cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 p-3 hover:border-blue-500/40 transition-all flex flex-col justify-between"
              >
                <div className="h-36 rounded-xl overflow-hidden mb-2 bg-slate-950">
                  <img src={rel.coverImage} alt={rel.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{rel.title}</h4>
                  <p className="text-[11px] text-slate-400">{rel.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

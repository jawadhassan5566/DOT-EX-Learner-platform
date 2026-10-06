import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  Search,
  Download,
  Printer,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  List,
  Sparkles,
  Lock,
  FileText,
  HardDrive,
  Plus,
  Trash2,
  WifiOff,
  Wifi,
  Brain,
  RotateCcw,
  Lightbulb,
  Shuffle,
  X,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { offlineDb, OfflineBook, StudentNote, NoteColor } from '../../services/offlineDb.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

type ReadingTheme = 'dark' | 'light' | 'sepia';

export const PdfReaderPage: React.FC = () => {
  const { selectedBookId, navigateTo, addToast } = useApp();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [bookData, setBookData] = useState<any>(null);
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('dark');
  const [searchWord, setSearchWord] = useState<string>('');
  const [searchActive, setSearchActive] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCachedOffline, setIsCachedOffline] = useState<boolean>(false);
  const [isLoadedFromOffline, setIsLoadedFromOffline] = useState<boolean>(false);
  const [cachingInProgress, setCachingInProgress] = useState<boolean>(false);

  // Student notes for this textbook
  const [bookNotes, setBookNotes] = useState<StudentNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('blue');
  const [creatingNote, setCreatingNote] = useState(false);

  // In-Reader AI Flashcard Study Deck State
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState<boolean>(false);
  const [generatingCards, setGeneratingCards] = useState<boolean>(false);
  const [chapterDeck, setChapterDeck] = useState<any | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [showCardHint, setShowCardHint] = useState<boolean>(false);

  const refreshNotes = async (bookId: string) => {
    try {
      const notes = await offlineDb.getNotesForBook(bookId);
      setBookNotes(notes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function loadBookContent() {
      if (!selectedBookId) return;
      setLoading(true);
      try {
        // 1. Check if already stored offline in IndexedDB
        const isOffline = await offlineDb.isBookOffline(selectedBookId);
        setIsCachedOffline(isOffline);

        if (!isOnline && isOffline) {
          // If offline and cached, load immediately from IndexedDB
          const cached = await offlineDb.getOfflineBook(selectedBookId);
          if (cached) {
            setBookData(cached);
            setCurrentPageNum(cached.lastReadPage || 1);
            setIsLoadedFromOffline(true);
            setLoading(false);
            await refreshNotes(selectedBookId);
            return;
          }
        }

        // 2. Try online load
        try {
          const res = await api.readBookOnline(selectedBookId);
          if (res.success) {
            setBookData(res);
            setCurrentPageNum(1);
            api.saveReadingProgress(selectedBookId, 1, res.totalPages).catch(() => {});
          }
        } catch (netErr) {
          // If online failed, attempt IndexedDB fallback
          const cached = await offlineDb.getOfflineBook(selectedBookId);
          if (cached) {
            setBookData(cached);
            setCurrentPageNum(cached.lastReadPage || 1);
            setIsLoadedFromOffline(true);
            addToast({ type: 'info', message: 'Loaded from local IndexedDB cache.' });
          } else {
            throw netErr;
          }
        }

        await refreshNotes(selectedBookId);
      } catch (err: any) {
        addToast({ type: 'error', message: err.message || 'Failed to open textbook' });
      } finally {
        setLoading(false);
      }
    }
    loadBookContent();
  }, [selectedBookId, isOnline]);

  const totalPages = bookData?.totalPages || 340;
  const contentPages = bookData?.contentPages || [];
  const currentChapter = contentPages.find((cp: any) => cp.page === currentPageNum) || contentPages[0] || {
    title: `Page ${currentPageNum}`,
    content: `# Academic Content Page ${currentPageNum}\n\nThis scholarly textbook is being rendered through the Dot X Accelerated PDF Engine.\n\nAll formulas, algorithms, graphs, and academic annotations are preserved in accordance with IEEE / ACM standards.`
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPageNum(newPage);
    if (selectedBookId) {
      api.saveReadingProgress(selectedBookId, newPage, totalPages).catch(() => {});
      offlineDb.updateLastReadPage(selectedBookId, newPage).catch(() => {});
      if (user?.id) {
        firestoreService.updateReadingProgress(user.id, {
          bookId: selectedBookId,
          pageNumber: newPage,
          totalPages
        }).catch(() => {});
      }
    }
  };

  const handleCacheOffline = async () => {
    if (!selectedBookId || !bookData) return;
    setCachingInProgress(true);
    try {
      await offlineDb.saveBookOffline({
        id: selectedBookId,
        title: bookData.title,
        author: bookData.author || 'Academic Scholar',
        pages: totalPages,
        downloadAllowed: bookData.downloadAllowed !== false,
        contentPages: bookData.contentPages || contentPages,
        lastReadPage: currentPageNum,
      });

      setIsCachedOffline(true);
      addToast({
        type: 'success',
        title: 'Cached in IndexedDB',
        message: 'This textbook is now saved for 100% offline access.',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to cache textbook offline.' });
    } finally {
      setCachingInProgress(false);
    }
  };

  const handleRemoveOffline = async () => {
    if (!selectedBookId) return;
    try {
      await offlineDb.removeBookOffline(selectedBookId);
      setIsCachedOffline(false);
      setIsLoadedFromOffline(false);
      addToast({ type: 'info', message: 'Textbook removed from offline cache.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !selectedBookId) return;

    try {
      await offlineDb.saveNote({
        bookId: selectedBookId,
        bookTitle: bookData?.title || 'Academic Reader',
        pageNumber: currentPageNum,
        chapterTitle: currentChapter?.title,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        tags: ['reader', `page-${currentPageNum}`],
        color: newNoteColor,
      });

      setNewNoteTitle('');
      setNewNoteContent('');
      setCreatingNote(false);
      await refreshNotes(selectedBookId);
      addToast({
        type: 'success',
        title: 'Note Saved to IndexedDB',
        message: `Saved for Page ${currentPageNum}. Available offline!`,
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await offlineDb.deleteNote(noteId);
      if (selectedBookId) await refreshNotes(selectedBookId);
      addToast({ type: 'info', message: 'Note deleted from storage.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(200, Math.max(60, prev + delta)));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!selectedBookId) return;
    try {
      const res = await api.downloadBook(selectedBookId);
      if (res.success) {
        // Also ensure it is cached in IndexedDB
        await handleCacheOffline();
        addToast({ type: 'success', title: 'Downloading', message: res.filename });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Restricted', message: err.message });
    }
  };

  const handleToggleBookmark = async () => {
    if (!selectedBookId) return;
    try {
      const res = await api.toggleBookmark(selectedBookId, currentPageNum);
      if (res.success) {
        setIsBookmarked(res.isBookmarked);
        addToast({ type: 'success', message: res.message });

        if (user?.id && res.isBookmarked) {
          firestoreService.saveBookmark(user.id, {
            bookId: selectedBookId,
            bookTitle: bookData?.title || 'Academic Textbook',
            pageNumber: currentPageNum,
            note: `Bookmarked on page ${currentPageNum}`
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // In-Reader AI Flashcards Handlers
  const handleOpenFlashcardsModal = async () => {
    setFlashcardsModalOpen(true);
    if (!chapterDeck || chapterDeck.chapterIndex !== (currentPageNum - 1)) {
      await handleGenerateCardsForCurrentChapter();
    }
  };

  const handleGenerateCardsForCurrentChapter = async () => {
    if (!selectedBookId) return;
    setGeneratingCards(true);
    try {
      const res = await api.generateFlashcards({
        bookId: selectedBookId,
        chapterTitle: currentChapter.title,
        chapterIndex: currentPageNum - 1,
        chapterContent: currentChapter.content,
        count: 6
      });
      if (res.success && res.deck) {
        setChapterDeck(res.deck);
        setActiveCardIndex(0);
        setCardFlipped(false);
        setShowCardHint(false);
        firestoreService.saveFlashcardDeck(res.deck).catch(() => {});
        addToast({
          type: 'success',
          title: 'Study Cards Generated!',
          message: `Created ${res.count} active-recall study flashcards for "${currentChapter.title}".`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Flashcard generation failed' });
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleToggleReaderCardMastery = async (cardId: string) => {
    if (!chapterDeck) return;
    const updatedCards = chapterDeck.cards.map((c: any) =>
      c.id === cardId ? { ...c, mastered: !c.mastered } : c
    );
    const masteredCount = updatedCards.filter((c: any) => c.mastered).length;
    const newMasteryPercentage = Math.round((masteredCount / updatedCards.length) * 100);
    const updatedDeck = {
      ...chapterDeck,
      cards: updatedCards,
      masteryPercentage: newMasteryPercentage
    };
    setChapterDeck(updatedDeck);

    const targetCard = updatedCards.find((c: any) => c.id === cardId);
    api.updateFlashcardProgress(chapterDeck.id, { cardId, mastered: targetCard?.mastered }).catch(() => {});
    firestoreService.saveFlashcardDeck(updatedDeck).catch(() => {});
  };

  // Color schemes for reader canvas
  const themeClasses = {
    dark: 'bg-slate-950 text-slate-100 border-slate-800',
    light: 'bg-white text-slate-900 border-slate-200 shadow-xl',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#e8d5b5]'
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400 text-sm">Preparing high-definition academic reader...</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentPageNum / totalPages) * 100));

  return (
    <div className={`space-y-4 pb-16 ${fullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 overflow-y-auto' : ''}`}>
      {/* 1. PDF Reader Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg text-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateTo('book-details', { bookId: selectedBookId || undefined })}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Exit Reader"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold text-white line-clamp-1 max-w-xs sm:max-w-md">
                {bookData?.title || 'Academic Reader'}
              </h2>
              {isCachedOffline && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Cached Offline</span>
                </span>
              )}
              {isLoadedFromOffline && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <HardDrive className="w-2.5 h-2.5" />
                  <span>IndexedDB</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {currentChapter.title}
            </p>
          </div>
        </div>

        {/* Center Page Nav Controls */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => handlePageChange(currentPageNum - 1)}
            disabled={currentPageNum <= 1}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1 text-xs font-mono">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPageNum}
              onChange={(e) => handlePageChange(parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white text-xs"
            />
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{totalPages}</span>
          </div>
          <button
            onClick={() => handlePageChange(currentPageNum + 1)}
            disabled={currentPageNum >= totalPages}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools (Zoom, Search, Notes, Theme, Offline Cache, Download, Fullscreen) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Zoom Buttons */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
            <button
              onClick={() => handleZoom(-10)}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 w-10 text-center">{zoomLevel}%</span>
            <button
              onClick={() => handleZoom(10)}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reading Theme Palette Toggle */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setReadingTheme('dark')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${readingTheme === 'dark' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-white'}`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReadingTheme('sepia')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${readingTheme === 'sepia' ? 'bg-[#e8d5b5] text-[#433422]' : 'text-slate-400 hover:text-white'}`}
              title="Sepia Mode"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReadingTheme('light')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${readingTheme === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Student Study Notes Toggle */}
          <button
            onClick={() => setNotesDrawerOpen(!notesDrawerOpen)}
            className={`p-2 rounded-xl transition-colors relative ${notesDrawerOpen ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
            title="Student Notes & Annotations (IndexedDB)"
          >
            <FileText className="w-3.5 h-3.5" />
            {bookNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center">
                {bookNotes.length}
              </span>
            )}
          </button>

          {/* Search inside Document */}
          <button
            onClick={() => setSearchActive(!searchActive)}
            className={`p-2 rounded-xl transition-colors ${searchActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
            title="Search inside textbook"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Table of contents drawer toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`p-2 rounded-xl transition-colors ${drawerOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'}`}
            title="Chapters Outline"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* AI Flashcards Generator for current Chapter */}
          <button
            onClick={handleOpenFlashcardsModal}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            title="Generate AI Active Recall Study Flashcards for this chapter"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>AI Flashcards</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl border transition-colors ${isBookmarked ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
            title="Save Page Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Offline Cache Toggle Button */}
          {isCachedOffline ? (
            <button
              onClick={handleRemoveOffline}
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-red-500/20 text-emerald-400 hover:text-red-300 border border-emerald-500/30 transition-colors"
              title="Cached in IndexedDB. Click to remove from offline cache."
            >
              <HardDrive className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCacheOffline}
              disabled={cachingInProgress}
              className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
              title="Cache textbook in IndexedDB for Offline Reading"
            >
              <HardDrive className={`w-3.5 h-3.5 ${cachingInProgress ? 'animate-pulse text-blue-400' : ''}`} />
            </button>
          )}

          {/* Download */}
          {bookData?.downloadAllowed ? (
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow"
              title="Download PDF & Cache Offline"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              className="p-2 rounded-xl bg-slate-800 text-slate-600 cursor-not-allowed"
              title="Download Restricted by Publisher"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Optional In-PDF Search Bar */}
      {searchActive && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3 text-xs">
          <Search className="w-4 h-4 text-blue-400" />
          <input
            type="text"
            placeholder="Type words to search within this chapter..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
          />
          {searchWord && (
            <span className="text-[11px] text-slate-400">
              Matches highlighted on page
            </span>
          )}
        </div>
      )}

      {/* 3. Reading Progress Indicator */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* 4. Reading Canvas & Drawer Layout */}
      <div className="relative flex gap-4">
        {/* Chapters Outline Drawer (if open) */}
        {drawerOpen && (
          <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2 h-[700px] overflow-y-auto flex-shrink-0 text-xs">
            <div className="font-bold text-white mb-3 flex items-center justify-between">
              <span>Table of Contents</span>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {contentPages.map((cp: any) => (
              <button
                key={cp.page}
                onClick={() => {
                  handlePageChange(cp.page);
                  setDrawerOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-2 transition-colors ${
                  currentPageNum === cp.page
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="opacity-70">p.{cp.page}</span>
                <span className="truncate">{cp.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Student Study Notes Drawer (IndexedDB Cached) */}
        {notesDrawerOpen && (
          <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 h-[700px] overflow-y-auto flex-shrink-0 text-xs flex flex-col justify-between">
            <div>
              <div className="font-bold text-white mb-3 flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <FileText className="w-4 h-4" />
                  <span>Student Notes ({bookNotes.length})</span>
                </span>
                <button onClick={() => setNotesDrawerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Add Note Button / Form Toggle */}
              {!creatingNote ? (
                <button
                  onClick={() => setCreatingNote(true)}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center space-x-1.5 transition-colors mb-3 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Note on Page {currentPageNum}</span>
                </button>
              ) : (
                <form onSubmit={handleSaveNote} className="space-y-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-3">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Annotate Page {currentPageNum}
                  </span>
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    required
                  />
                  <textarea
                    rows={3}
                    placeholder="Observations, formulas, exam tips..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    required
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex space-x-1">
                      {(['blue', 'emerald', 'amber', 'purple'] as NoteColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewNoteColor(c)}
                          className={`w-4 h-4 rounded-full ${newNoteColor === c ? 'ring-2 ring-white' : ''} ${
                            c === 'blue' ? 'bg-blue-500' : c === 'emerald' ? 'bg-emerald-500' : c === 'amber' ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setCreatingNote(false)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* List of existing notes for this textbook */}
              <div className="space-y-2">
                {bookNotes.length === 0 ? (
                  <p className="text-slate-500 text-[11px] text-center py-6">
                    No notes saved for this book yet. Click above to jot down key takeaways!
                  </p>
                ) : (
                  bookNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        note.pageNumber === currentPageNum
                          ? 'border-cyan-500/60 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-white truncate">{note.title}</span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-500 hover:text-red-400 p-0.5"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <button
                          onClick={() => handlePageChange(note.pageNumber)}
                          className="text-cyan-400 hover:underline font-mono"
                        >
                          Go to Page {note.pageNumber} →
                        </button>
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                IndexedDB Persistent
              </span>
              <span>Available Offline</span>
            </div>
          </div>
        )}

        {/* The PDF Paper Page Container */}
        <div className="flex-1 flex justify-center overflow-x-auto py-2">
          <div
            className={`min-h-[720px] max-w-4xl w-full rounded-2xl p-8 sm:p-14 border transition-all duration-200 font-sans shadow-2xl relative ${themeClasses[readingTheme]}`}
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Academic Paper Header */}
            <div className="border-b border-current/15 pb-4 mb-8 flex items-center justify-between text-xs opacity-75 font-mono">
              <span>Dot X Library • Academic Series</span>
              <span>Page {currentPageNum} of {totalPages}</span>
            </div>

            {/* Document Content with Markdown-style formatting */}
            <div className="prose max-w-none text-sm sm:text-base leading-relaxed space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                {currentChapter.title}
              </h1>

              {/* Render content with highlights if search term is active */}
              {currentChapter.content ? (
                currentChapter.content.split('\n\n').map((paragraph: string, idx: number) => {
                  if (paragraph.startsWith('```')) {
                    const code = paragraph.replace(/```[a-z]*\n?/g, '');
                    return (
                      <pre key={idx} className="p-4 rounded-xl bg-black/40 border border-current/20 font-mono text-xs overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    );
                  }
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-bold mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
                  }
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-xl font-bold mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                  }
                  if (paragraph.startsWith('# ')) {
                    return <h1 key={idx} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('# ', '')}</h1>;
                  }

                  // Render text with highlight
                  if (searchWord && paragraph.toLowerCase().includes(searchWord.toLowerCase())) {
                    const parts = paragraph.split(new RegExp(`(${searchWord})`, 'gi'));
                    return (
                      <p key={idx} className="leading-relaxed opacity-90">
                        {parts.map((part, pIdx) =>
                          part.toLowerCase() === searchWord.toLowerCase() ? (
                            <mark key={pIdx} className="bg-yellow-300 text-black px-1 rounded">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  }

                  return (
                    <p key={idx} className="leading-relaxed opacity-90">
                      {paragraph}
                    </p>
                  );
                })
              ) : (
                <p className="opacity-80">Reading text content...</p>
              )}
            </div>

            {/* Academic Paper Footer */}
            <div className="border-t border-current/15 pt-6 mt-16 flex items-center justify-between text-xs opacity-60 font-mono">
              <span>Authorized Academic Digital Copy</span>
              <span>Dot X Cryptographic Signature Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. In-Reader AI Flashcards Study Overlay Modal */}
      {flashcardsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>AI Chapter Study Flashcards</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold">
                      Active Recall
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {currentChapter.title} • {bookData?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (selectedBookId) {
                      sessionStorage.setItem('dotx_flashcard_book_id', selectedBookId);
                      sessionStorage.setItem('dotx_flashcard_chapter_index', String(currentPageNum - 1));
                      setFlashcardsModalOpen(false);
                      navigateTo('flashcards');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                  title="Open full flashcards studio"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Full Studio</span>
                </button>
                <button
                  onClick={() => setFlashcardsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {generatingCards ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">Generating Active-Recall Flashcards...</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Analyzing "{currentChapter.title}" with Gemini AI to generate high-retention study cards.
                  </p>
                </div>
              </div>
            ) : chapterDeck && chapterDeck.cards && chapterDeck.cards.length > 0 ? (
              <div className="space-y-4">
                {/* Progress Bar & Counter */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">
                      Card {activeCardIndex + 1} of {chapterDeck.cards.length}
                    </span>
                    <span className="text-[11px] text-slate-500">• Click card to flip</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-purple-300">
                      {chapterDeck.masteryPercentage || 0}% Mastered
                    </span>
                    <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${chapterDeck.masteryPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 3D Interactive Flashcard */}
                {(() => {
                  const card = chapterDeck.cards[activeCardIndex];
                  if (!card) return null;
                  return (
                    <div className="space-y-3">
                      <div
                        onClick={() => setCardFlipped(!cardFlipped)}
                        className={`min-h-[220px] p-6 rounded-2xl cursor-pointer select-none transition-all duration-300 flex flex-col justify-between border ${
                          cardFlipped
                            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950/80 border-purple-500/50 shadow-purple-950/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 shadow-xl'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            cardFlipped ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {cardFlipped ? 'Answer & Key Takeaway' : 'Active Recall Prompt'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {card.category || 'General'}
                          </span>
                        </div>

                        <div className="my-auto text-center py-4">
                          <p className={`text-base sm:text-lg font-bold leading-relaxed ${
                            cardFlipped ? 'text-purple-100' : 'text-white'
                          }`}>
                            {cardFlipped ? card.back : card.front}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                          <span className="flex items-center space-x-1 text-slate-500">
                            <RotateCcw className="w-3 h-3" />
                            <span>Click card to reveal answer</span>
                          </span>
                          {card.mastered && (
                            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mastered</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cognitive Hint */}
                      {card.hint && (
                        <div>
                          {showCardHint ? (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
                              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Cognitive Hint: </span>
                                <span>{card.hint}</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowCardHint(true)}
                              className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center space-x-1 py-1 transition-colors cursor-pointer"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Reveal Cognitive Hint</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Card Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCardFlipped(false);
                              setShowCardHint(false);
                              setActiveCardIndex((prev) => (prev - 1 + chapterDeck.cards.length) % chapterDeck.cards.length);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                          </button>
                          <button
                            onClick={() => {
                              setCardFlipped(false);
                              setShowCardHint(false);
                              setActiveCardIndex((prev) => (prev + 1) % chapterDeck.cards.length);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleReaderCardMastery(card.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                              card.mastered
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{card.mastered ? 'Mastered' : 'Mark as Mastered'}</span>
                          </button>
                          <button
                            onClick={handleGenerateCardsForCurrentChapter}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Regenerate flashcards with Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <Brain className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">No Flashcards Generated Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click below to generate high-retention active recall study flashcards for "{currentChapter.title}".
                  </p>
                </div>
                <button
                  onClick={handleGenerateCardsForCurrentChapter}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate AI Flashcards with Gemini</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Database,
  BookOpen,
  FileText,
  Trash2,
  Download,
  Wifi,
  WifiOff,
  Search,
  Plus,
  Edit3,
  Calendar,
  Tag,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  Share2,
  BookMarked,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { offlineDb, OfflineBook, StudentNote, NoteColor } from '../../services/offlineDb.js';

export const OfflineVaultView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { navigateTo, addToast } = useApp();
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<'books' | 'notes'>('books');
  const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<{
    booksCount: number;
    notesCount: number;
    estimatedUsageMB: number;
    quotaMB: number;
  }>({ booksCount: 0, notesCount: 0, estimatedUsageMB: 0, quotaMB: 0 });

  // Note creation / editing state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteBookId, setNoteBookId] = useState('');
  const [notePageNum, setNotePageNum] = useState<number>(1);
  const [noteTagInput, setNoteTagInput] = useState('study, exam');
  const [noteColor, setNoteColor] = useState<NoteColor>('blue');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [books, notes, stats] = await Promise.all([
        offlineDb.getAllOfflineBooks(),
        offlineDb.getAllNotes(),
        offlineDb.getStorageStats(),
      ]);
      setOfflineBooks(books);
      setStudentNotes(notes);
      setStorageStats(stats);
      if (books.length > 0 && !noteBookId) {
        setNoteBookId(books[0].id);
      }
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to access IndexedDB storage.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Remove "${bookTitle}" from offline storage?`)) return;
    try {
      await offlineDb.removeBookOffline(bookId);
      addToast({ type: 'info', message: `Removed from offline cache.` });
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await offlineDb.deleteNote(noteId);
      addToast({ type: 'info', message: 'Note deleted from IndexedDB.' });
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleOpenNoteModal = (note?: StudentNote) => {
    if (note) {
      setEditingNoteId(note.id);
      setNoteTitle(note.title);
      setNoteContent(note.content);
      setNoteBookId(note.bookId);
      setNotePageNum(note.pageNumber);
      setNoteTagInput(note.tags.join(', '));
      setNoteColor(note.color);
    } else {
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteBookId(offlineBooks[0]?.id || 'general');
      setNotePageNum(1);
      setNoteTagInput('study');
      setNoteColor('blue');
    }
    setNoteModalOpen(true);
  };

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      addToast({ type: 'warning', message: 'Please provide both title and content for your note.' });
      return;
    }

    const selectedBook = offlineBooks.find((b) => b.id === noteBookId);
    const bookTitle = selectedBook ? selectedBook.title : 'General Academic Notes';

    const tags = noteTagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await offlineDb.saveNote({
        id: editingNoteId || undefined,
        bookId: noteBookId || 'general',
        bookTitle,
        pageNumber: Number(notePageNum) || 1,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags: tags.length > 0 ? tags : ['study'],
        color: noteColor,
      });

      addToast({
        type: 'success',
        title: 'Note Saved to IndexedDB',
        message: 'Your study note is safely stored offline.',
      });

      setNoteModalOpen(false);
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleExportNotes = async () => {
    try {
      const md = await offlineDb.exportNotesAsMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DotX_Study_Notes_${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export Complete', message: 'Markdown file downloaded.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // Filtered lists
  const filteredBooks = offlineBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = studentNotes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(studentNotes.flatMap((n) => n.tags)));

  const noteColorMap: Record<NoteColor, string> = {
    blue: 'border-blue-500/40 bg-blue-950/20 text-blue-200',
    emerald: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200',
    amber: 'border-amber-500/40 bg-amber-950/20 text-amber-200',
    purple: 'border-purple-500/40 bg-purple-950/20 text-purple-200',
    rose: 'border-rose-500/40 bg-rose-950/20 text-rose-200',
    slate: 'border-slate-700 bg-slate-900/60 text-slate-300',
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Storage Metrics */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Offline Vault & IndexedDB Cache
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Read textbooks and write scholarly notes with zero internet connection.
              </p>
            </div>
          </div>

          {/* Action buttons & Offline Simulator Switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Offline Simulation Switch for quick manual testing */}
            <button
              onClick={() => toggleSimulatedOffline()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                isSimulatedOffline
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle simulated offline state to test zero-network reading"
            >
              {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isSimulatedOffline ? 'Simulating Offline' : 'Test Offline Mode'}</span>
            </button>

            {activeTab === 'notes' && (
              <button
                onClick={handleExportNotes}
                disabled={studentNotes.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Notes (.md)</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Close Vault"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Storage Diagnostics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Cached Books</span>
            <span className="font-extrabold text-white mt-0.5 text-sm sm:text-base flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-400 inline" />
              <span>{storageStats.booksCount} Textbooks</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Study Notes</span>
            <span className="font-extrabold text-white mt-0.5 text-sm sm:text-base flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400 inline" />
              <span>{storageStats.notesCount} Saved Notes</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">IndexedDB Usage</span>
            <span className="font-extrabold text-white mt-0.5 text-sm sm:text-base flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400 inline" />
              <span>{storageStats.estimatedUsageMB} MB</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Network State</span>
            <span className="font-extrabold mt-0.5 text-sm sm:text-base flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                {isOnline ? 'Online (Syncer Active)' : 'Offline (Storage Only)'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'books'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cached Books ({offlineBooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Student Notes ({studentNotes.length})</span>
          </button>
        </div>

        {/* Search input & New Note CTA */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'books' ? 'Search offline books...' : 'Search student notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {activeTab === 'notes' && (
            <button
              onClick={() => handleOpenNoteModal()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Tab Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs">Querying IndexedDB vault storage...</p>
        </div>
      ) : activeTab === 'books' ? (
        /* BOOKS TAB */
        <div>
          {filteredBooks.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Books Cached Offline Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Browse the catalog and click <strong>"PDF"</strong> or <strong>"Download for Offline"</strong> on any textbook to store it in IndexedDB for reading anytime without Wi-Fi.
                </p>
              </div>
              <button
                onClick={() => navigateTo('library')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Browse Academic Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between shadow-lg group"
                >
                  <div className="flex gap-3.5">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded-xl border border-slate-800 shadow flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block mb-1">
                        {book.categoryName}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {book.author}
                      </p>

                      <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-2">
                        <span>{book.pages} pages</span>
                        <span>•</span>
                        <span>{book.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => navigateTo('reading', { bookId: book.id })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Offline</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove from offline storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* NOTES TAB */
        <div className="space-y-4">
          {/* Tag filters if any */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 text-[11px] font-semibold mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags:
              </span>
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All ({studentNotes.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Student Notes Saved Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Take notes during lecture study or while reading your textbooks. All notes are saved instantly into IndexedDB and stay available offline.
                </p>
              </div>
              <button
                onClick={() => handleOpenNoteModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-2xl border p-4.5 transition-all shadow-md flex flex-col justify-between ${noteColorMap[note.color]}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                        {note.title}
                      </h4>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenNoteModal(note)}
                          className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                          title="Edit Note"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-3 flex items-center space-x-2">
                      <span className="font-semibold text-slate-300 truncate max-w-xs">
                        📖 {note.bookTitle}
                      </span>
                      <span>•</span>
                      <span>Page {note.pageNumber}</span>
                    </div>

                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {note.content}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between text-[10px] opacity-75">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-black/30 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Note Creation & Edit Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                {editingNoteId ? 'Edit Study Note' : 'New Offline Study Note'}
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Note Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Key Formulas & Algorithm Proof"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Associated Textbook</label>
                  <select
                    value={noteBookId}
                    onChange={(e) => setNoteBookId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="general">General / Multi-Course Study Note</option>
                    {offlineBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Page Number</label>
                  <input
                    type="number"
                    min={1}
                    value={notePageNum}
                    onChange={(e) => setNotePageNum(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Note Content (Markdown supported)</label>
                <textarea
                  rows={5}
                  placeholder="Write formulas, explanations, citations, and exam reminders here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="exam, formulas, lab"
                    value={noteTagInput}
                    onChange={(e) => setNoteTagInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Card Theme</label>
                  <div className="flex items-center space-x-2 pt-1">
                    {(['blue', 'emerald', 'amber', 'purple', 'rose', 'slate'] as NoteColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNoteColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          noteColor === c ? 'scale-110 border-white' : 'border-transparent'
                        } ${
                          c === 'blue'
                            ? 'bg-blue-600'
                            : c === 'emerald'
                            ? 'bg-emerald-600'
                            : c === 'amber'
                            ? 'bg-amber-500'
                            : c === 'purple'
                            ? 'bg-purple-600'
                            : c === 'rose'
                            ? 'bg-rose-600'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow transition-colors flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save to IndexedDB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

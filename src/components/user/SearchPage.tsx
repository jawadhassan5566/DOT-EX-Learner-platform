import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Video,
  Layers,
  ArrowRight,
  Star,
  Download,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Book, Meeting, Category } from '../../types/index.js';

export const SearchPage: React.FC = () => {
  const { globalSearchQuery, setGlobalSearchQuery, navigateTo } = useApp();

  const [books, setBooks] = useState<Book[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'books' | 'meetings' | 'categories'>('all');
  const [loading, setLoading] = useState(false);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const [bRes, mRes, cRes] = await Promise.all([
        api.getBooks({ search: term }),
        api.getMeetings(),
        api.getCategories()
      ]);

      if (bRes.success) setBooks(bRes.books);
      if (mRes.success) {
        const filteredMeets = mRes.meetings.filter(m =>
          m.title.toLowerCase().includes(term.toLowerCase()) ||
          m.category.toLowerCase().includes(term.toLowerCase()) ||
          m.hostName.toLowerCase().includes(term.toLowerCase())
        );
        setMeetings(filteredMeets);
      }
      if (cRes.success) {
        const filteredCats = cRes.categories.filter(c =>
          c.name.toLowerCase().includes(term.toLowerCase()) ||
          c.description.toLowerCase().includes(term.toLowerCase())
        );
        setCategories(filteredCats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalSearchQuery) {
      performSearch(globalSearchQuery);
    } else {
      performSearch('');
    }
  }, [globalSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(globalSearchQuery);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-500" />
            <span>Global Academic Search</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search simultaneously across library textbooks, faculty meetings, lecture topics, and academic disciplines.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type to search (e.g. Python, Calculus, Operating Systems, Algorithms)..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 pt-1 text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'books', label: `Textbooks (${books.length})` },
            { id: 'meetings', label: `Meetings (${meetings.length})` },
            { id: 'categories', label: `Categories (${categories.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                filterType === f.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Sections */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs">Searching global academic index...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Books Results */}
          {(filterType === 'all' || filterType === 'books') && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Textbooks & Curated Publications ({books.length})</span>
              </h2>

              {books.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No textbooks matching the query.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigateTo('book-details', { bookId: b.id })}
                      className="cursor-pointer p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex gap-3 transition-all"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-20 h-28 object-cover rounded-xl bg-slate-950" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-400">{b.categoryName}</span>
                          <h4 className="font-bold text-xs text-white line-clamp-1">{b.title}</h4>
                          <p className="text-[11px] text-slate-400">{b.author}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2">
                          <span className="text-amber-400 flex items-center space-x-1 font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{b.rating}</span>
                          </span>
                          <span className="text-[11px] text-blue-400 hover:underline">View Book &rarr;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meetings Results */}
          {(filterType === 'all' || filterType === 'meetings') && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Classroom Meetings ({meetings.length})</span>
              </h2>

              {meetings.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No meetings matching the query.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          {m.category}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-white mt-1">{m.title}</h4>
                        <p className="text-xs text-slate-400">Host: {m.hostName}</p>
                      </div>
                      <button
                        onClick={() => navigateTo('meeting-room', { meetingId: m.id })}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
                      >
                        Join Room
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

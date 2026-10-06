import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Award,
  TrendingUp,
  FolderHeart,
  Trash2,
  Brain,
  Check,
  Zap,
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Book, Flashcard, FlashcardDeck } from '../../types/index.js';
import { firestoreService } from '../../services/firestoreService.js';

export const FlashcardsPage: React.FC = () => {
  const { addToast, navigateTo } = useApp();
  const { user } = useAuth();

  // Library & Selection State
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [focusArea, setFocusArea] = useState<string>('Comprehensive Conceptual Mastery');
  const [cardCount, setCardCount] = useState<number>(6);

  // Deck & Study State
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [loadingDecks, setLoadingDecks] = useState<boolean>(true);

  // Load books and existing study decks
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [booksRes, decksRes] = await Promise.all([
          api.getBooks({ limit: 50 }).catch(() => ({ success: false, books: [] })),
          api.getFlashcardDecks().catch(() => ({ success: false, decks: [] }))
        ]);

        if (booksRes.success && booksRes.books.length > 0) {
          setBooks(booksRes.books);
          // Check if there is a preselected book from navigation or storage
          const preselectedBookId = sessionStorage.getItem('dotx_flashcard_book_id');
          if (preselectedBookId && booksRes.books.some((b: Book) => b.id === preselectedBookId)) {
            setSelectedBookId(preselectedBookId);
            sessionStorage.removeItem('dotx_flashcard_book_id');
          } else {
            setSelectedBookId(booksRes.books[0].id);
          }

          const preselectedChapterIdx = sessionStorage.getItem('dotx_flashcard_chapter_index');
          if (preselectedChapterIdx !== null) {
            setSelectedChapterIndex(Number(preselectedChapterIdx) || 0);
            sessionStorage.removeItem('dotx_flashcard_chapter_index');
          }
        }

        if (decksRes.success && decksRes.decks.length > 0) {
          setSavedDecks(decksRes.decks);
          setActiveDeck(decksRes.decks[0]);
        }
      } catch (err) {
        console.error("Error loading flashcards data:", err);
      } finally {
        setLoadingDecks(false);
      }
    }

    loadInitialData();
  }, []);

  // Keyboard navigation for card flip and next/previous
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused on input/select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeck, currentCardIndex]);

  // Current selected book object
  const currentBook = books.find(b => b.id === selectedBookId) || books[0];
  const currentBookChapters = currentBook?.contentPages || [
    { page: 1, title: 'Chapter 1: Foundational Principles & Architecture', content: currentBook?.description || '' }
  ];

  // Handle Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!currentBook) {
      addToast({ type: 'warning', message: 'Please select a book first.' });
      return;
    }

    const chapter = currentBookChapters[selectedChapterIndex] || currentBookChapters[0];
    setGenerating(true);

    try {
      const res = await api.generateFlashcards({
        bookId: currentBook.id,
        chapterTitle: chapter.title,
        chapterIndex: selectedChapterIndex,
        chapterContent: chapter.content,
        focusArea,
        count: cardCount
      });

      if (res.success && res.deck) {
        setActiveDeck(res.deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowHint(false);

        // Save to Firestore for persistence
        firestoreService.saveFlashcardDeck(res.deck).catch(() => {});

        // Update saved decks list
        setSavedDecks(prev => [res.deck, ...prev.filter(d => d.id !== res.deck.id)]);

        addToast({
          type: 'success',
          title: 'Study Deck Generated!',
          message: `Created ${res.count} AI active-recall flashcards for "${chapter.title}".`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Flashcard generation failed.' });
    } finally {
      setGenerating(false);
    }
  };

  // Card Navigation
  const handleNextCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentCardIndex(prev => (prev + 1) % activeDeck.cards.length);
  };

  const handlePrevCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentCardIndex(prev => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
  };

  // Toggle Mastery
  const handleToggleMastery = async (cardId: string, currentMastered: boolean) => {
    if (!activeDeck) return;
    const newMastered = !currentMastered;

    // Optimistic UI update
    const updatedCards = activeDeck.cards.map(c => c.id === cardId ? { ...c, mastered: newMastered } : c);
    const masteredCount = updatedCards.filter(c => c.mastered).length;
    const newMasteryPercentage = Math.round((masteredCount / updatedCards.length) * 100);

    const updatedDeck = {
      ...activeDeck,
      cards: updatedCards,
      masteryPercentage: newMasteryPercentage,
      lastStudiedAt: new Date().toISOString()
    };

    setActiveDeck(updatedDeck);
    setSavedDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));

    try {
      await api.updateFlashcardProgress(activeDeck.id, { cardId, mastered: newMastered });
      firestoreService.saveFlashcardDeck(updatedDeck).catch(() => {});
    } catch (err) {
      console.warn("Error updating flashcard progress:", err);
    }
  };

  // Shuffle Deck
  const handleShuffleDeck = () => {
    if (!activeDeck) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setActiveDeck({ ...activeDeck, cards: shuffled });
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    addToast({ type: 'info', message: 'Deck shuffled! Ready for study.' });
  };

  // Reset Mastery Progress
  const handleResetProgress = async () => {
    if (!activeDeck) return;
    const resetCards = activeDeck.cards.map(c => ({ ...c, mastered: false }));
    const resetDeck = { ...activeDeck, cards: resetCards, masteryPercentage: 0 };
    setActiveDeck(resetDeck);
    setSavedDecks(prev => prev.map(d => d.id === resetDeck.id ? resetDeck : d));

    try {
      await api.updateFlashcardProgress(activeDeck.id, { reset: true });
      firestoreService.saveFlashcardDeck(resetDeck).catch(() => {});
      addToast({ type: 'info', message: 'Study progress reset. Practice again!' });
    } catch (err) {
      console.warn("Reset error:", err);
    }
  };

  // Delete Deck
  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm("Are you sure you want to remove this flashcard deck?")) return;
    try {
      await api.deleteFlashcardDeck(deckId);
      setSavedDecks(prev => prev.filter(d => d.id !== deckId));
      if (activeDeck?.id === deckId) {
        const remaining = savedDecks.filter(d => d.id !== deckId);
        setActiveDeck(remaining.length > 0 ? remaining[0] : null);
        setCurrentCardIndex(0);
      }
      addToast({ type: 'success', message: 'Flashcard deck removed.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const currentCard: Flashcard | undefined = activeDeck?.cards[currentCardIndex];
  const masteredCount = activeDeck?.cards.filter(c => c.mastered).length || 0;
  const totalCards = activeDeck?.cards.length || 0;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto text-xs">
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>AI Study Flashcards</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wide uppercase border border-purple-500/30">
                  Active Recall AI
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Select any book chapter to generate scientifically optimized study flashcards with spaced repetition and active recall.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="self-start md:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 transition-colors"
        >
          &larr; Back to Library Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Book & Chapter Generator Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Configure AI Study Deck</span>
            </div>

            {/* 1. Book Selector */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold text-xs flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Select Academic Book</span>
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setSelectedChapterIndex(0);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} ({b.categoryName})
                  </option>
                ))}
              </select>

              {/* Book Preview Chip */}
              {currentBook && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3 mt-2">
                  <img
                    src={currentBook.coverImage}
                    alt={currentBook.title}
                    className="w-12 h-16 rounded-lg object-cover shadow border border-slate-700 shrink-0"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="font-bold text-white truncate text-xs">{currentBook.title}</p>
                    <p className="text-[11px] text-slate-400">By {currentBook.author}</p>
                    <span className="inline-block px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold">
                      {currentBook.categoryName} • {currentBookChapters.length} Chapters Available
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Chapter Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-slate-300 font-bold text-xs flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Select Book Chapter / Module</span>
              </label>
              <select
                value={selectedChapterIndex}
                onChange={(e) => setSelectedChapterIndex(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                {currentBookChapters.map((ch, idx) => (
                  <option key={idx} value={idx}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Focus Area */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-slate-300 font-bold text-xs flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Pedagogical Focus Mode</span>
              </label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="Comprehensive Conceptual Mastery">Comprehensive Conceptual Mastery (All Aspects)</option>
                <option value="Definitions & Terminology">Definitions, Key Terminology & Syntax</option>
                <option value="Formulas & Algorithmic Complexities">Formulas, Theorems & Mathematical Properties</option>
                <option value="Exam Preparation & Edge Cases">Exam Review, Edge Cases & Practical Analysis</option>
              </select>
            </div>

            {/* 4. Number of Flashcards */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Number of Flashcards:</span>
                <span className="text-purple-300 font-bold font-mono">{cardCount} Cards</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[4, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCardCount(num)}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      cardCount === num
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {num} Cards
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateFlashcards}
              disabled={generating}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Flashcards with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Generate Flashcards for this Chapter</span>
                </>
              )}
            </button>
          </div>

          {/* Saved Decks Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white flex items-center space-x-2">
                <FolderHeart className="w-4 h-4 text-emerald-400" />
                <span>My Saved Flashcard Decks ({savedDecks.length})</span>
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {savedDecks.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No saved decks yet. Select a chapter above and click "Generate Flashcards"!
                </div>
              ) : (
                savedDecks.map((deck) => {
                  const isCurrent = activeDeck?.id === deck.id;
                  const deckMastered = deck.cards.filter(c => c.mastered).length;
                  const pct = Math.round((deckMastered / (deck.cards.length || 1)) * 100);

                  return (
                    <div
                      key={deck.id}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-purple-950/40 border-purple-500/50 shadow-md'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        setActiveDeck(deck);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                        setShowHint(false);
                      }}
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-white truncate text-xs">
                          {deck.chapterTitle}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {deck.bookTitle}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-0.5">
                          <span>{deck.cards.length} Cards</span>
                          <span>•</span>
                          <span className={pct === 100 ? 'text-emerald-400 font-bold' : 'text-purple-300 font-bold'}>
                            {pct}% Mastered
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className={`p-1.5 rounded-lg ${isCurrent ? 'text-purple-400' : 'text-slate-400'}`}>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Study Player */}
        <div className="lg:col-span-7 space-y-4">
          {activeDeck && currentCard ? (
            <div className="space-y-4">
              {/* Deck Info & Progress Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Now Studying: {activeDeck.bookTitle}
                    </span>
                    <h2 className="text-base font-black text-white tracking-tight">
                      {activeDeck.chapterTitle}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={handleShuffleDeck}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
                      title="Shuffle Study Order"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Shuffle</span>
                    </button>
                    <button
                      onClick={handleResetProgress}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
                      title="Reset Mastery"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">
                      Card <strong className="text-white font-mono">{currentCardIndex + 1}</strong> of <strong className="text-white font-mono">{totalCards}</strong>
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{masteredCount} of {totalCards} Mastered ({Math.round((masteredCount / totalCards) * 100)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${(masteredCount / totalCards) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 3D Flip Flashcard Container */}
              <div
                onClick={() => setIsFlipped(prev => !prev)}
                className="relative w-full h-[380px] cursor-pointer select-none perspective-1000 group"
              >
                <div
                  className={`w-full h-full duration-500 rounded-3xl transition-transform preserve-3d relative shadow-2xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE: Question / Term */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 group-hover:border-purple-500/50 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-2xl transition-colors"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                          {currentCard.category || 'Core Principle'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          currentCard.difficulty === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : currentCard.difficulty === 'hard'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {currentCard.difficulty}
                        </span>
                      </div>

                      {currentCard.mastered && (
                        <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mastered</span>
                        </span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        Question / Concept
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight max-w-xl">
                        {currentCard.front}
                      </h3>
                    </div>

                    {/* Hint & Flip Instructions */}
                    <div className="flex items-center justify-between text-slate-400 pt-3 border-t border-slate-800/80">
                      {currentCard.hint ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(prev => !prev);
                          }}
                          className="flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>{showHint ? 'Hide Clue' : 'Reveal Memory Clue'}</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <span>Click card or Press Space to Flip</span>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Revealed Hint Banner */}
                    {showHint && currentCard.hint && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left animate-fadeIn">
                        💡 <strong>Memory Anchor:</strong> {currentCard.hint}
                      </div>
                    )}
                  </div>

                  {/* BACK SIDE: Explanation / Answer */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-purple-500/40 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-2xl text-left"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Official Academic Solution
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {currentCard.category}
                      </span>
                    </div>

                    {/* Answer Text */}
                    <div className="py-4 space-y-3 overflow-y-auto max-h-[220px] pr-1">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                        Verified Explanation & Key Formula:
                      </span>
                      <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                        {currentCard.back}
                      </p>
                    </div>

                    {/* Bottom Instructions */}
                    <div className="flex items-center justify-between text-slate-400 pt-3 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-500">
                        Click card or Press Space to view question again
                      </span>
                      <span className="text-purple-400 font-bold">
                        Card {currentCardIndex + 1} of {totalCards}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Controller Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {/* Previous Card */}
                <button
                  onClick={handlePrevCard}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Mark Mastered / Still Reviewing Controls */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => handleToggleMastery(currentCard.id, Boolean(currentCard.mastered))}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md ${
                      currentCard.mastered
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentCard.mastered ? 'Mastered ✓' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-600/30"
                  >
                    <span>Next Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Study Keyboard Shortcuts Bar */}
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
                <span>Keyboard Shortcuts:</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Space</kbd> Flip Card</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">&larr;</kbd> Previous</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">&rarr;</kbd> Next</span>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
                <Brain className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight">
                  No Active Study Deck Selected
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select a book and chapter on the left, then click <strong>"Generate Flashcards for this Chapter"</strong> to synthesize high-yield study cards!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

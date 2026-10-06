import React, { useState, useEffect } from 'react';
import {
  Target,
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  BookOpen,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Clock,
  Award,
  Layers,
  Check,
  X,
  RefreshCw,
  Bell,
  ShieldAlert,
  RotateCcw,
  FastForward,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Book, ReadingGoal } from '../../types/index.js';

interface ReadingGoalsTrackerProps {
  compact?: boolean;
}

export const ReadingGoalsTracker: React.FC<ReadingGoalsTrackerProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const { addToast, navigateTo } = useApp();

  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [completedBooks, setCompletedBooks] = useState<Book[]>([]);
  const [activeReading, setActiveReading] = useState<any[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & Edit States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isLogBookModalOpen, setIsLogBookModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State for Target Adjustment
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [selectedTargetCount, setSelectedTargetCount] = useState<number>(2);
  const [selectedTargetPages, setSelectedTargetPages] = useState<number>(100);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  // Selected book to complete
  const [selectedBookToComplete, setSelectedBookToComplete] = useState<string>('');
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  const loadGoalData = async () => {
    try {
      // 1. Try fetching from API
      const res = await api.getReadingGoal();
      if (res.success && res.goal) {
        setGoal(res.goal);
        setCompletedBooks(res.completedBooks || []);
        setActiveReading(res.activeReading || []);
        setSelectedFrequency(res.goal.frequency);
        setSelectedTargetCount(res.goal.targetCount);
        setSelectedTargetPages(res.goal.targetPages || 100);
        setReminderEnabled(res.goal.reminderEnabled !== false);

        // Also sync to Firestore for user if logged in
        if (user?.id) {
          firestoreService.saveReadingGoal(user.id, res.goal).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("API goal fetch fallback to Firestore/Local:", err);
      // Fallback: Check Firestore
      if (user?.id) {
        try {
          const fGoal = await firestoreService.getUserReadingGoal(user.id);
          if (fGoal) {
            setGoal(fGoal);
            setSelectedFrequency(fGoal.frequency);
            setSelectedTargetCount(fGoal.targetCount);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalData();

    // Also load catalog books for quick-complete selector
    api.getBooks({ limit: 10 }).then(res => {
      if (res.success) setAvailableBooks(res.books);
    }).catch(() => {});
  }, [user]);

  const handleSaveGoalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.setReadingGoal({
        frequency: selectedFrequency,
        targetCount: selectedTargetCount,
        targetPages: selectedTargetPages,
        reminderEnabled
      });

      if (res.success) {
        setGoal(res.goal);
        setIsConfigModalOpen(false);
        addToast({
          type: 'success',
          title: 'Reading Target Configured',
          message: res.message || `Set ${selectedFrequency} target to ${selectedTargetCount} book(s)!`
        });

        if (user?.id) {
          firestoreService.saveReadingGoal(user.id, res.goal).catch(() => {});
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update reading goal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteBook = async (bookId: string) => {
    if (!bookId) return;
    setSubmitting(true);
    try {
      const book = availableBooks.find(b => b.id === bookId) || activeReading.find(r => r.bookId === bookId);
      const res = await api.completeGoalBook({ bookId, bookTitle: book?.title });
      if (res.success) {
        setGoal(res.goal);
        setIsLogBookModalOpen(false);
        setSelectedBookToComplete('');
        addToast({
          type: res.achieved ? 'success' : 'info',
          title: res.achieved ? '🎉 Goal Achieved!' : 'Book Completed!',
          message: res.message
        });

        if (user?.id) {
          firestoreService.saveReadingGoal(user.id, res.goal).catch(() => {});
        }

        await loadGoalData();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to record completion.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreStreak = async () => {
    setSubmitting(true);
    try {
      const res = await api.restoreStreak();
      if (res.success) {
        setGoal(res.goal);
        addToast({
          type: 'success',
          title: '🔥 Streak Restored!',
          message: res.message
        });

        if (user?.id) {
          firestoreService.saveReadingGoal(user.id, res.goal).catch(() => {});
        }

        await loadGoalData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to restore streak.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateTime = async (hours: number, reset?: boolean) => {
    setSubmitting(true);
    try {
      const res = await api.simulateStreakTime(hours, reset);
      if (res.success) {
        setGoal(res.goal);
        addToast({
          type: 'info',
          title: reset ? 'Clock Reset' : `+${hours}h Simulated`,
          message: res.message
        });
        await loadGoalData();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to simulate time.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs">Loading reading goals telemetry...</p>
      </div>
    );
  }

  const targetCount = goal?.targetCount || 2;
  const completedCount = goal?.completedCount || 0;
  const frequency = goal?.frequency || 'weekly';
  const streak = goal?.currentStreakDays || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100));
  const isAchieved = completedCount >= targetCount;

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 sm:p-7 shadow-xl relative overflow-hidden ${compact ? 'max-w-xl' : 'w-full'}`}>
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Target className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Student Reading Goals
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  isAchieved
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isAchieved ? 'Target Achieved' : `${frequency} Target`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track completion targets, build daily habits, and earn academic reading streaks
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {/* Unlimited Streak Badge */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-inner ${
                goal?.canRestoreStreak
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
                  : streak > 0
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Unlimited Streak: Complete goal to increase by 1. Return after 24h to increase again. If you miss a 24h cycle, you get 1 restore chance before it resets to 0."
            >
              <Flame className={`w-4 h-4 ${goal?.canRestoreStreak ? 'text-rose-400' : 'text-orange-400 animate-bounce'}`} />
              <span>{streak} Day Streak (Unlimited)</span>
            </div>

            {/* Test Simulation Button */}
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`p-2 rounded-xl border transition-colors ${
                showSimulator || Boolean(goal?.simulatedTimeOffsetHours)
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Toggle 24-Hour Streak Simulation Tester"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Adjust Target Button */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Configure Target & Frequency"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Emergency Streak Restore Banner (Appears once if student misses 24h cycle) */}
        {goal?.canRestoreStreak && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/70 to-slate-900 border-2 border-rose-500/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shrink-0 shadow-lg">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                    ⚠️ Streak at Risk!
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    One-Time Restore Available
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  You missed your 24-hour goal cycle! You have one opportunity to restore your <strong>{goal.savedStreakBeforeMiss || streak}-day streak</strong> before the 24-hour restore window expires, or it will restart from zero.
                </p>
              </div>
            </div>

            <button
              onClick={handleRestoreStreak}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-slate-950" />
              <span>Restore Streak</span>
            </button>
          </div>
        )}

        {/* Unlimited Streak Cycle Rules & Status */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-bold text-[10px] border border-orange-500/30 uppercase shrink-0">
              ♾️ Unlimited Streak
            </span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Complete your goal to increase streak by 1. Return after 24h to increase again. If you miss a day, a restore option appears once!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 shrink-0 self-end sm:self-auto"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Close Tester' : 'Test 24h Cycle'}</span>
          </button>
        </div>

        {/* Time Simulator Drawer (for Interactive Testing) */}
        {showSimulator && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <FastForward className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Interactive 24-Hour Streak Cycle Tester</span>
                {Boolean(goal?.simulatedTimeOffsetHours) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    +{goal?.simulatedTimeOffsetHours}h Simulated
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">Test: 24h increase &bull; 48h restore option &bull; 72h zero reset</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => handleSimulateTime(25)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium flex items-center space-x-1 cursor-pointer"
                title="Fast forward 25 hours. Completing your goal will increase your streak again!"
              >
                <span>+25h (Next 24h Cycle)</span>
              </button>
              <button
                onClick={() => handleSimulateTime(49)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-xs text-amber-300 border border-amber-600/40 font-medium flex items-center space-x-1 cursor-pointer"
                title="Fast forward 49 hours (missed 24h cycle). The restore option will appear once!"
              >
                <span>+49h (Missed 24h &rarr; Trigger Restore)</span>
              </button>
              <button
                onClick={() => handleSimulateTime(73)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-xs text-rose-300 border border-rose-600/40 font-medium flex items-center space-x-1 cursor-pointer"
                title="Fast forward 73 hours (missed 24h restore window). Streak restarts from zero!"
              >
                <span>+73h (Exceed Restore &rarr; Reset to 0)</span>
              </button>
              <button
                onClick={() => handleSimulateTime(0, true)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center space-x-1 cursor-pointer"
                title="Reset simulation offset to current clock time"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Clock</span>
              </button>
            </div>
          </div>
        )}

        {/* Progress Overview Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          {/* Main Progress Indicator */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  {frequency === 'daily' ? 'Today\'s Completion Target' : 'Current Week\'s Target'}
                </span>
                <div className="text-2xl font-black text-white flex items-baseline space-x-2 mt-0.5">
                  <span>{completedCount} of {targetCount}</span>
                  <span className="text-sm font-semibold text-slate-400">book{targetCount > 1 ? 's' : ''} finished</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">{progressPercent}%</span>
                <p className="text-[10px] text-slate-400">completion rate</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700/50 shadow-inner overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 relative ${
                  isAchieved
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20'
                }`}
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>

            {/* Target Guidance / Status Line */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                {isAchieved
                  ? '🎯 Target Reached! Outstanding scholarly pace.'
                  : `${targetCount - completedCount} more book${targetCount - completedCount > 1 ? 's' : ''} needed to hit your ${frequency} goal.`}
              </span>
              <span className="text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{frequency === 'daily' ? 'Resets daily at 00:00' : 'Weekly cycle'}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Box: Log Finished Book */}
          <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5 flex flex-col justify-center space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold">Track Progress:</span>
            <button
              onClick={() => setIsLogBookModalOpen(true)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all group"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Log Book Completed</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Finish a book to immediately advance your target progress.
            </p>
          </div>
        </div>

        {/* Completed Books in this Target Window */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Finished Toward Current Target ({completedBooks.length})</span>
            </span>
            {completedBooks.length > 0 && (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Recorded in Active Window</span>
              </span>
            )}
          </div>

          {completedBooks.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                No books completed yet this {frequency}. Pick a book from your reading list to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {completedBooks.map(b => (
                <div
                  key={b.id}
                  onClick={() => navigateTo('book-details', { bookId: b.id })}
                  className="cursor-pointer p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center space-x-3 transition-all group"
                >
                  <img
                    src={b.coverImage}
                    alt={b.title}
                    className="w-10 h-14 rounded-lg object-cover border border-slate-800 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-white truncate group-hover:text-blue-400 transition-colors">
                      {b.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate">{b.author}</p>
                    <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed ({b.pages} pages)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONFIGURE GOAL MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Configure Reading Target</h4>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalConfig} className="p-4 sm:p-6 space-y-4">
              {/* Frequency Selector: Daily vs Weekly */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Frequency:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFrequency('daily');
                      if (selectedTargetCount > 3) setSelectedTargetCount(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFrequency === 'daily'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Daily Target</span>
                      {selectedFrequency === 'daily' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Focus on daily reading routine</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFrequency('weekly');
                      if (selectedTargetCount < 2) setSelectedTargetCount(2);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFrequency === 'weekly'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Weekly Target</span>
                      {selectedFrequency === 'weekly' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Flexible 7-day study targets</p>
                  </button>
                </div>
              </div>

              {/* Target Completed Books Count */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Completed Books ({selectedFrequency === 'daily' ? 'Per Day' : 'Per Week'}):
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTargetCount(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedTargetCount === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {num} {num === 1 ? 'Book' : 'Books'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Reading Pages */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Optional Target Pages to Read ({selectedFrequency}):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={selectedTargetPages}
                    onChange={(e) => setSelectedTargetPages(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">pages</span>
                </div>
              </div>

              {/* Notification Reminder Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">Daily Study Reminders</div>
                    <div className="text-[10px] text-slate-500">Get gentle reading nudges on schedule</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG BOOK COMPLETION MODAL */}
      {isLogBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Log Book as Completed</h4>
              </div>
              <button
                onClick={() => setIsLogBookModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-300">
                Select a textbook or reading material to mark as 100% finished. This will automatically count toward your <strong>{frequency}</strong> target of {targetCount} books.
              </p>

              {/* Active Reading Books */}
              {activeReading.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    From In-Progress Reading List:
                  </span>
                  <div className="space-y-1.5">
                    {activeReading.map((ar) => (
                      <button
                        key={ar.bookId}
                        onClick={() => setSelectedBookToComplete(ar.bookId)}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          selectedBookToComplete === ar.bookId
                            ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-white truncate">{ar.bookTitle}</div>
                          <div className="text-[10px] text-slate-400">Page {ar.lastPage} of {ar.totalPages} ({ar.progressPercentage}% done)</div>
                        </div>
                        {selectedBookToComplete === ar.bookId && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Library Catalog Books Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or Pick from Academic Catalog:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableBooks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookToComplete(b.id)}
                      className={`w-full text-left p-2 rounded-xl border flex items-center space-x-2.5 transition-all ${
                        selectedBookToComplete === b.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <img src={b.coverImage} alt={b.title} className="w-7 h-10 rounded object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">{b.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{b.author} • {b.pages} pages</div>
                      </div>
                      {selectedBookToComplete === b.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsLogBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedBookToComplete || submitting}
                  onClick={() => handleCompleteBook(selectedBookToComplete)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record & Finish Book</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

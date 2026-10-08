import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  Trophy,
  Timer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  GraduationCap,
  Target,
  BarChart2,
  Check,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Zap
} from 'lucide-react';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types/index.js';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  chapterTitle: string;
  chapterIndex?: number;
  chapterContent: string;
  onQuizCompleted?: (attempt: QuizAttempt) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  bookCover,
  chapterTitle,
  chapterIndex,
  chapterContent,
  onQuizCompleted
}) => {
  const { user } = useAuth();
  const { addToast } = useApp();

  // Quiz State
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focusArea, setFocusArea] = useState<string>('Comprehensive Conceptual Mastery');
  const [showReviewFilter, setShowReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isOpen && quiz && !quizSubmitted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, quiz, quizSubmitted]);

  // Reset when opening a new chapter or closing
  useEffect(() => {
    if (!isOpen) {
      setQuizSubmitted(false);
      setQuizResult(null);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setTimeElapsed(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate 5-Question AI Quiz
  const handleGenerateQuiz = async () => {
    setLoading(true);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);

    try {
      const res = await api.generateQuiz({
        bookId,
        chapterTitle,
        chapterIndex,
        chapterContent,
        focusArea,
        difficulty
      });

      if (res.success && res.quiz) {
        setQuiz(res.quiz);
        // Persist generated quiz to Firestore
        firestoreService.saveGeneratedQuiz(res.quiz).catch(() => {});
        addToast({
          type: 'success',
          title: 'AI Quiz Generated!',
          message: `Created 5 academic multiple-choice questions for "${chapterTitle}".`
        });
      } else {
        throw new Error(res.message || 'Failed to build quiz questions');
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      addToast({
        type: 'error',
        title: 'Quiz Generation Notice',
        message: err.message || 'Could not generate quiz at this time.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Quiz for Automated Evaluation
  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < quiz.questions.length) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} of ${quiz.questions.length} questions. Are you ready to submit and calculate your final score?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitQuiz({
        quizId: quiz.id,
        bookId,
        chapterTitle,
        chapterIndex,
        answers: userAnswers,
        timeSpentSeconds: timeElapsed,
        questions: quiz.questions,
        bookTitle
      });

      if (res.success && res.attempt) {
        setQuizResult(res.attempt);
        setQuizSubmitted(true);

        // Save attempt to Firestore for user profile records
        if (user?.id) {
          firestoreService.saveQuizAttempt(user.id, res.attempt).catch(() => {});
        }

        if (onQuizCompleted) {
          onQuizCompleted(res.attempt);
        }

        addToast({
          type: res.attempt.percentage >= 80 ? 'success' : res.attempt.percentage >= 60 ? 'info' : 'warning',
          title: `Quiz Evaluated: ${res.attempt.grade} (${res.attempt.percentage}%)`,
          message: `Scored ${res.attempt.score}/${res.attempt.totalQuestions}. Earned +${res.attempt.xpEarned} XP!`
        });
      }
    } catch (err: any) {
      console.error('Quiz submit error:', err);
      addToast({
        type: 'error',
        title: 'Evaluation Notice',
        message: err.message || 'Failed to submit quiz results.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Retake current quiz
  const handleRetakeQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
  };

  const currentQuestion: QuizQuestion | undefined = quiz?.questions[currentQuestionIndex];
  const answeredTotal = quiz ? Object.keys(userAnswers).length : 0;
  const isAllAnswered = quiz ? answeredTotal === quiz.questions.length : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  AI Quiz Generator & Evaluation
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  5 MCQs
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {chapterTitle} • <span className="text-slate-300">{bookTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {quiz && !quizSubmitted && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-cyan-300">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatTimer(timeElapsed)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!quiz ? (
            /* 1. QUIZ GENERATOR LAUNCHER */
            <div className="py-6 sm:py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h4 className="text-lg font-extrabold text-white">
                  Generate Automated Chapter Quiz
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Our pedagogical AI analyzes the current PDF text in "{chapterTitle}" and constructs a 5-question multiple-choice examination with automated grading and explanations.
                </p>
              </div>

              {/* Generator Configuration Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 max-w-lg mx-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          difficulty === lvl
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Evaluation Focus Area
                  </label>
                  <select
                    value={focusArea}
                    onChange={e => setFocusArea(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Comprehensive Conceptual Mastery">Comprehensive Conceptual Mastery</option>
                    <option value="Key Formulas, Definitions & Proofs">Key Formulas, Definitions & Proofs</option>
                    <option value="System Architecture & Mechanics">System Architecture & Mechanics</option>
                    <option value="Rigorous Exam Preparation & Logic">Rigorous Exam Preparation & Logic</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Questions are synthesized directly from the active PDF document page and chapter text, ensuring 100% alignment with your syllabus.
                  </span>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleGenerateQuiz}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 transition-all flex items-center space-x-2.5 mx-auto cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                  <span>{loading ? 'Analyzing PDF & Synthesizing Quiz...' : 'Generate 5-Question AI Quiz'}</span>
                </button>
              </div>
            </div>
          ) : !quizSubmitted ? (
            /* 2. ACTIVE QUIZ QUESTION INTERACTION */
            <div className="space-y-6">
              {/* Progress & Jump Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    Question <strong className="text-white">{currentQuestionIndex + 1}</strong> of {quiz.questions.length}
                  </span>
                  <span className="text-cyan-400 font-mono">
                    {answeredTotal} of {quiz.questions.length} Answered
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>

                {/* Question Selector Dots / Pills */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = typeof userAnswers[q.id] === 'number';
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-500 text-slate-950 ring-2 ring-white shadow-lg shadow-cyan-500/30'
                            : isAnswered
                            ? 'bg-blue-600/40 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Question Card */}
              {currentQuestion && (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-5 shadow-xl">
                  {/* Category & Difficulty Badges */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{currentQuestion.category || 'Core Principle'}</span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      Difficulty: {currentQuestion.difficulty || 'Medium'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {currentQuestion.question}
                  </h4>

                  {/* 4 Multiple Choice Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[currentQuestion.id] === optIdx;
                      const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 group ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                            }`}
                          >
                            {optionLetter}
                          </div>
                          <p className={`text-xs sm:text-sm leading-snug flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'}`}>
                            {opt}
                          </p>
                          {isSelected && (
                            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation & Submission Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === quiz.questions.length - 1}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
                      isAllAnswered
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'Calculating Score...' : isAllAnswered ? 'Submit & Grade Quiz' : `Submit (${answeredTotal}/5)`}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 3. AUTOMATED SCORING & PERFORMANCE SUMMARY */
            quizResult && (
              <div className="space-y-6">
                {/* Score Header Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500"></div>

                  <div className="relative inline-block">
                    <div
                      className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto border-4 shadow-2xl transition-all ${
                        quizResult.percentage >= 80
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/20'
                          : quizResult.percentage >= 60
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 shadow-cyan-500/20'
                          : 'border-amber-400 bg-amber-500/10 text-amber-400 shadow-amber-500/20'
                      }`}
                    >
                      <span className="text-3xl font-black leading-none">{quizResult.score}/{quizResult.totalQuestions}</span>
                      <span className="text-[11px] font-bold opacity-80 mt-1">{quizResult.percentage}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {quizResult.percentage >= 80
                          ? 'Distinction Performance! 🌟'
                          : quizResult.percentage >= 60
                          ? 'Proficient Comprehension 👍'
                          : 'Revision Recommended 📚'}
                      </h4>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                        Grade {quizResult.grade}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Completed in {formatTimer(quizResult.timeSpentSeconds)}. Earned{' '}
                      <strong className="text-amber-400">+{quizResult.xpEarned} Academic XP</strong>.
                    </p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-lg mx-auto">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                      <span className="text-base font-black text-white">{quizResult.score} / 5</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accuracy</span>
                      <span className="text-base font-black text-cyan-400">{quizResult.percentage}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</span>
                      <span className="text-base font-black text-slate-300">{formatTimer(quizResult.timeSpentSeconds)}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">XP Awarded</span>
                      <span className="text-base font-black text-amber-400">+{quizResult.xpEarned} XP</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold">
                    <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Review:</span>
                    <button
                      onClick={() => setShowReviewFilter('all')}
                      className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        showReviewFilter === 'all'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      All (5)
                    </button>
                    <button
                      onClick={() => setShowReviewFilter('incorrect')}
                      className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        showReviewFilter === 'incorrect'
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Missed ({quizResult.totalQuestions - quizResult.score})
                    </button>
                    <button
                      onClick={() => setShowReviewFilter('correct')}
                      className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        showReviewFilter === 'correct'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Correct ({quizResult.score})
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRetakeQuiz}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                    <button
                      onClick={handleGenerateQuiz}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-600/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>New 5 Questions</span>
                    </button>
                  </div>
                </div>

                {/* Detailed Question Review List */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <span>In-Depth Question Analysis & Explanations</span>
                  </h5>

                  {quiz?.questions
                    .filter(q => {
                      const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;
                      if (showReviewFilter === 'correct') return isCorrect;
                      if (showReviewFilter === 'incorrect') return !isCorrect;
                      return true;
                    })
                    .map((q, idx) => {
                      const userChoice = userAnswers[q.id];
                      const isCorrect = userChoice === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                            isCorrect
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-rose-950/20 border-rose-500/30'
                          }`}
                        >
                          {/* Question Status Header */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center space-x-1.5 text-xs font-bold">
                              {isCorrect ? (
                                <span className="flex items-center space-x-1 text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Correct</span>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-1 text-rose-400">
                                  <XCircle className="w-4 h-4" />
                                  <span>Incorrect</span>
                                </span>
                              )}
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{q.category || 'Concept'}</span>
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono">
                              Difficulty: {q.difficulty}
                            </span>
                          </div>

                          {/* Question Prompt */}
                          <p className="text-sm font-bold text-white leading-relaxed">
                            {q.question}
                          </p>

                          {/* Options Breakdown */}
                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isThisCorrect = optIdx === q.correctAnswerIndex;
                              const isThisUserSelected = optIdx === userChoice;

                              let cardStyle = 'bg-slate-900/60 border-slate-800 text-slate-400';
                              if (isThisCorrect) {
                                cardStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold';
                              } else if (isThisUserSelected && !isCorrect) {
                                cardStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-200 line-through';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${cardStyle}`}
                                >
                                  <span className="flex items-center space-x-2">
                                    <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {['A', 'B', 'C', 'D'][optIdx]}
                                    </span>
                                    <span>{opt}</span>
                                  </span>

                                  {isThisCorrect && (
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isThisUserSelected && !isThisCorrect && (
                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider shrink-0">
                                      Your Choice
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Box */}
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                            <span className="font-bold text-cyan-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                              <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Academic Explanation:</span>
                            </span>
                            <p className="leading-relaxed text-slate-300">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dot X Automated Assessment Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {quizSubmitted ? 'Return to PDF Reading' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

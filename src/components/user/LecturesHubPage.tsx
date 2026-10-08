import React, { useState, useEffect } from 'react';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Lock,
  Globe,
  Heart,
  ThumbsUp,
  Lightbulb,
  Award,
  Brain,
  MessageSquare,
  Share2,
  Search,
  Filter,
  Clock,
  Tag,
  Shield,
  User,
  Trash2,
  ZoomIn,
  X,
  Send,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { LectureMedia, LectureReactionType, LectureComment } from '../../types/index.js';
import { UploadLectureModal } from '../admin/UploadLectureModal.js';
import { UserProfileModal } from '../common/UserProfileModal.js';

export const LecturesHubPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [lectures, setLectures] = useState<LectureMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'video' | 'picture'>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'global' | 'private'>('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Modals & States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [zoomPictureUrl, setZoomPictureUrl] = useState<{ url: string; title: string } | null>(null);
  const [activeCommentsLectureId, setActiveCommentsLectureId] = useState<string | null>(null);
  const [activeReactorsModal, setActiveReactorsModal] = useState<LectureMedia | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileInitialData, setSelectedProfileInitialData] = useState<any | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const handleOpenUserProfile = (userId: string, initialData?: any) => {
    if (!userId) return;
    setSelectedProfileUserId(userId);
    setSelectedProfileInitialData(initialData || null);
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'subadmin');

  const subjects = [
    'all',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Engineering',
    'Biology & Medicine',
    'Chemistry',
    'English & Literature',
    'General Academic'
  ];

  const reactionEmojis: Record<LectureReactionType, { emoji: string; label: string; icon: any; color: string }> = {
    like: { emoji: '👍', label: 'Like', icon: ThumbsUp, color: 'text-blue-400' },
    love: { emoji: '❤️', label: 'Love', icon: Heart, color: 'text-rose-400' },
    insightful: { emoji: '💡', label: 'Insightful', icon: Lightbulb, color: 'text-amber-400' },
    applause: { emoji: '👏', label: 'Well Explained', icon: Award, color: 'text-emerald-400' },
    mindblown: { emoji: '🧠', label: 'Mind Blown', icon: Brain, color: 'text-purple-400' },
  };

  const loadLectures = async () => {
    try {
      setLoading(true);
      const res = await api.getLectures({
        search: searchQuery || undefined,
        mediaType: selectedMediaType !== 'all' ? selectedMediaType : undefined,
        visibility: selectedVisibility !== 'all' ? selectedVisibility : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
      });

      if (res.success && res.lectures) {
        setLectures(res.lectures);
      }
    } catch (err) {
      console.warn("API lectures fetch fallback to Firestore/Local:", err);
      // Fallback: Firestore
      try {
        const fLectures = await firestoreService.getLecturesFromFirestore();
        if (fLectures && fLectures.length > 0) {
          setLectures(fLectures);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, [selectedMediaType, selectedVisibility, selectedSubject, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLectures();
  };

  // Like Toggle
  const handleLike = async (lectureId: string) => {
    if (!user) {
      addToast({ type: 'info', message: 'Please log in to like this lecture.' });
      return;
    }

    try {
      const res = await api.likeLecture(lectureId);
      if (res.success) {
        setLectures(prev => prev.map(l => {
          if (l.id === lectureId) {
            return {
              ...l,
              likesCount: res.likesCount,
              likedUserIds: res.likedUserIds,
              reactions: (res as any).reactions || l.reactions
            };
          }
          return l;
        }));
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to like lecture.' });
    }
  };

  // React Handler (with name of reactor recorded)
  const handleReact = async (lectureId: string, reactionType: LectureReactionType) => {
    if (!user) {
      addToast({ type: 'info', message: 'Please log in to react to this lecture.' });
      return;
    }

    try {
      const res = await api.reactToLecture(lectureId, reactionType);
      if (res.success) {
        setLectures(prev => prev.map(l => {
          if (l.id === lectureId) {
            return {
              ...l,
              reactions: res.reactions
            };
          }
          return l;
        }));

        addToast({
          type: 'success',
          message: `Reacted with ${reactionEmojis[reactionType].emoji} (${reactionEmojis[reactionType].label})`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to record reaction.' });
    }
  };

  // Comment Submission
  const handleAddComment = async (lectureId: string) => {
    if (!user) {
      addToast({ type: 'info', message: 'Please log in to comment.' });
      return;
    }

    const commentText = newCommentTexts[lectureId]?.trim();
    if (!commentText) return;

    setSubmittingComment(lectureId);
    try {
      const res = await api.commentOnLecture(lectureId, commentText);
      if (res.success && res.comment) {
        setLectures(prev => prev.map(l => {
          if (l.id === lectureId) {
            return {
              ...l,
              comments: res.comments
            };
          }
          return l;
        }));

        setNewCommentTexts(prev => ({ ...prev, [lectureId]: '' }));
        addToast({ type: 'success', message: 'Comment posted!' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to post comment.' });
    } finally {
      setSubmittingComment(null);
    }
  };

  // Share Handler
  const handleShare = async (lecture: LectureMedia) => {
    try {
      await api.shareLecture(lecture.id);
      // Increment local count
      setLectures(prev => prev.map(l => l.id === lecture.id ? { ...l, sharesCount: (l.sharesCount || 0) + 1 } : l));

      const shareUrl = `${window.location.origin}/lectures/${lecture.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        addToast({
          type: 'success',
          title: 'Link Copied!',
          message: `Share link for "${lecture.title}" copied to clipboard.`
        });
      } else {
        addToast({
          type: 'info',
          title: 'Lecture Share',
          message: `Share URL: ${shareUrl}`
        });
      }
    } catch {
      addToast({ type: 'info', message: `Share link: ${window.location.href}` });
    }
  };

  // Delete Handler
  const handleDeleteLecture = async (lectureId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete lecture "${title}"?`)) return;

    try {
      const res = await api.deleteLecture(lectureId);
      if (res.success) {
        setLectures(prev => prev.filter(l => l.id !== lectureId));
        addToast({ type: 'success', message: res.message });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to delete lecture.' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner with Admin Upload Trigger */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Study Hub • Videos & Pictures</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Study Lectures & Visual Media
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Curated lecture videos and high-resolution study infographics uploaded by verified administrators.
              Access global materials or private curriculum content tailored to your institute.
            </p>
          </div>

          {/* Admin Upload Action Button */}
          {isAdmin ? (
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer transform active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload Lecture or Picture</span>
              </button>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Logged in as <strong>{user?.name} ({user?.role})</strong></span>
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 max-w-xs">
              <span className="font-semibold text-slate-200 block mb-0.5">Faculty & Admin Contributions</span>
              <span>All study lectures are verified by academic administrators and department heads.</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Search & Multifaceted Filters Bar */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lectures by title, admin name, subject, topic, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </form>

          {/* Subject Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {subjects.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Subjects' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Media Type & Visibility Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Media Type Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-semibold mr-1">Type:</span>
            {[
              { id: 'all', label: 'All Media' },
              { id: 'video', label: 'Videos 🎥' },
              { id: 'picture', label: 'Pictures 🖼️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMediaType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedMediaType === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Visibility Filter (CRITICAL REQUIREMENT) */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-semibold mr-1">Access:</span>
            {[
              { id: 'all', label: 'All Lectures' },
              { id: 'global', label: '🌐 Global (All Users)' },
              { id: 'private', label: '🔒 Private (My Institute)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedVisibility(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedVisibility === tab.id
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Lectures & Media Feed Grid */}
      {loading ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading study lectures & media feed...</p>
        </div>
      ) : lectures.length === 0 ? (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Lectures Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || selectedMediaType !== 'all' || selectedVisibility !== 'all'
                ? 'Try broadening your search or switching visibility filters.'
                : 'No lecture videos or study pictures have been uploaded yet.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              + Upload the First Lecture
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lectures.map((lecture) => {
            const isUserLiked = user && lecture.likedUserIds?.includes(user.id);
            const userReaction = user && lecture.reactions?.find(r => r.userId === user.id)?.reactionType;
            const canManage = user && (user.role === 'superadmin' || user.id === lecture.uploaderId);

            return (
              <div
                key={lecture.id}
                className="rounded-3xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 shadow-xl overflow-hidden flex flex-col transition-all duration-200"
              >
                {/* 1. Header: Admin Uploader & Visibility Tag (REQUIRED) */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
                  {/* Uploader Admin Details */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={lecture.uploaderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop"}
                      alt={lecture.uploaderName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-white truncate">
                          {lecture.uploaderName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 flex items-center space-x-0.5 shrink-0">
                          <Shield className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Admin</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                        <span>🏛️ {lecture.instituteName}</span>
                        <span>&bull;</span>
                        <span>{new Date(lecture.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility Badge (PRIVATE vs GLOBAL) */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {lecture.visibility === 'private' ? (
                      <span
                        className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center space-x-1 shadow-inner"
                        title="Private: Only students and staff of this institute can view this lecture"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Private</span>
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center space-x-1 shadow-inner"
                        title="Global: Shown to everyone, all over Dot X Library"
                      >
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>Global</span>
                      </span>
                    )}

                    {canManage && (
                      <button
                        onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Lecture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Media Player or Picture Lightbox */}
                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
                  {lecture.mediaType === 'video' ? (
                    <video
                      src={lecture.mediaUrl}
                      poster={lecture.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      onClick={() => setZoomPictureUrl({ url: lecture.mediaUrl, title: lecture.title })}
                      className="w-full h-full relative cursor-pointer flex items-center justify-center bg-slate-950"
                      title="Click to zoom picture"
                    >
                      <img
                        src={lecture.mediaUrl}
                        alt={lecture.title}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-xs font-semibold backdrop-blur-xs">
                        <ZoomIn className="w-4 h-4 text-cyan-300" />
                        <span>Click to view full-resolution picture</span>
                      </div>
                    </div>
                  )}

                  {/* Media Type Overlay Tag */}
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center space-x-1 shadow">
                      {lecture.mediaType === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-cyan-400" />
                          <span>Video Lecture {lecture.durationMinutes ? `• ${lecture.durationMinutes}m` : ''}</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-purple-400" />
                          <span>Study Picture / Infographic</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* 3. Title, Description & Minor Information (REQUIRED) */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                        {lecture.subject}
                      </span>
                      {lecture.courseLevel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {lecture.courseLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
                      {lecture.title}
                    </h3>
                    {lecture.topic && (
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">
                        Topic: {lecture.topic}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {lecture.description}
                  </p>

                  {/* Tags */}
                  {lecture.tags && lecture.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {lecture.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[10px] font-mono border border-slate-700/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reactor Names Summary Box (CRITICAL REQUIREMENT: Names of reactors shown & clickable to view profile) */}
                  {lecture.reactions && lecture.reactions.length > 0 && (
                    <div
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden flex-wrap gap-y-1">
                        <div
                          className="flex -space-x-1.5 overflow-hidden shrink-0 cursor-pointer"
                          onClick={() => setActiveReactorsModal(lecture)}
                          title="Click to view all who reacted"
                        >
                          {lecture.reactions.slice(0, 4).map((r, i) => (
                            <span
                              key={i}
                              className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]"
                            >
                              {reactionEmojis[r.reactionType]?.emoji || '👍'}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-300">
                          Reacted by{' '}
                          {lecture.reactions.slice(0, 3).map((r, idx) => (
                            <React.Fragment key={r.userId || idx}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenUserProfile(r.userId, {
                                    name: r.userName,
                                    avatar: r.userAvatar,
                                    role: r.userRole
                                  });
                                }}
                                className="font-bold text-white hover:text-blue-400 hover:underline cursor-pointer transition-colors inline-block"
                                title={`Click to view ${r.userName}'s public profile`}
                              >
                                {r.userName}
                              </button>
                              {idx < Math.min(2, lecture.reactions.length - 1) && ', '}
                            </React.Fragment>
                          ))}
                          {lecture.reactions.length > 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactorsModal(lecture);
                              }}
                              className="text-slate-400 hover:text-white cursor-pointer hover:underline ml-1"
                              title="View full list of reactors"
                            >
                              and {lecture.reactions.length - 3} others
                            </button>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveReactorsModal(lecture)}
                        className="text-[10px] text-blue-400 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
                        title="View all reactions and profiles"
                      >
                        View Names &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Action Bar: Like, React, Comment, Share (REQUIRED) */}
                <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => handleLike(lecture.id)}
                      className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all font-semibold ${
                        isUserLiked
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                      }`}
                      title={isUserLiked ? 'Unlike' : 'Like this lecture'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isUserLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{lecture.likesCount || 0}</span>
                    </button>

                    {/* Reaction Bar Options (Hover / Click Picker) */}
                    <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                      {(Object.keys(reactionEmojis) as LectureReactionType[]).map((rKey) => {
                        const item = reactionEmojis[rKey];
                        const isSelected = userReaction === rKey;
                        const countForType = lecture.reactions?.filter(r => r.reactionType === rKey).length || 0;

                        return (
                          <button
                            key={rKey}
                            type="button"
                            onClick={() => handleReact(lecture.id, rKey)}
                            className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold scale-110 shadow'
                                : 'hover:bg-slate-700 text-slate-300'
                            }`}
                            title={`React with ${item.label} (Click to record your name)`}
                          >
                            <span>{item.emoji}</span>
                            {countForType > 0 && (
                              <span className="text-[10px] font-mono opacity-80">{countForType}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Comment Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentsLectureId(
                          activeCommentsLectureId === lecture.id ? null : lecture.id
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all font-semibold ${
                        activeCommentsLectureId === lecture.id
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{lecture.comments?.length || 0}</span>
                    </button>

                    {/* Share Button (REQUIRED) */}
                    <button
                      type="button"
                      onClick={() => handleShare(lecture)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 font-semibold transition-colors"
                      title="Share this lecture"
                    >
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Share</span>
                      {(lecture.sharesCount || 0) > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">({lecture.sharesCount})</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5. Expandable Comment Thread Section */}
                {activeCommentsLectureId === lecture.id && (
                  <div className="p-4 sm:p-5 bg-slate-950/95 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Comments & Discussion ({lecture.comments?.length || 0})</span>
                      <button
                        onClick={() => setActiveCommentsLectureId(null)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Existing Comments List */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {lecture.comments && lecture.comments.length > 0 ? (
                        lecture.comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => {
                                  if (comm.userId) {
                                    handleOpenUserProfile(comm.userId, {
                                      name: comm.userName,
                                      avatar: comm.userAvatar,
                                      role: comm.userRole
                                    });
                                  }
                                }}
                                className="flex items-center space-x-2 cursor-pointer group"
                                title={`Click to view ${comm.userName}'s public profile`}
                              >
                                <img
                                  src={comm.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop"}
                                  alt={comm.userName}
                                  className="w-5 h-5 rounded-full object-cover group-hover:ring-1 group-hover:ring-blue-400"
                                />
                                <span className="font-bold text-white group-hover:text-blue-400 group-hover:underline transition-colors">{comm.userName}</span>
                                {comm.userRole && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono capitalize">
                                    {comm.userRole}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed pl-7">
                              {comm.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">
                          No comments yet. Start the academic discussion!
                        </p>
                      )}
                    </div>

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        placeholder="Write an academic query or reflection..."
                        value={newCommentTexts[lecture.id] || ''}
                        onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [lecture.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(lecture.id);
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(lecture.id)}
                        disabled={submittingComment === lecture.id || !(newCommentTexts[lecture.id]?.trim())}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Post</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reactors Modal (Names of Everyone Who Reacted - REQUIRED) */}
      {activeReactorsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveReactorsModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Reactions ({activeReactorsModal.reactions?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setActiveReactorsModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Students, teachers, and admins who reacted to <strong>"{activeReactorsModal.title}"</strong>:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeReactorsModal.reactions && activeReactorsModal.reactions.length > 0 ? (
                activeReactorsModal.reactions.map((r, i) => {
                  const item = reactionEmojis[r.reactionType];
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenUserProfile(r.userId, {
                            name: r.userName,
                            avatar: r.userAvatar,
                            role: r.userRole
                          });
                        }}
                        className="flex items-center space-x-2.5 cursor-pointer group text-left flex-1 mr-2"
                        title={`Click to view ${r.userName}'s public profile`}
                      >
                        <img
                          src={r.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop"}
                          alt={r.userName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-blue-400 group-hover:scale-105 transition-all"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 group-hover:underline flex items-center space-x-1.5 transition-colors">
                            <span>{r.userName}</span>
                            {r.userRole && (
                              <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 capitalize">
                                {r.userRole}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block group-hover:text-blue-300 transition-colors">
                            Reacted on {new Date(r.createdAt).toLocaleDateString()} • Click to view profile
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                        <span className="text-sm">{item?.emoji || '👍'}</span>
                        <span className="text-[11px] font-semibold text-slate-300">{item?.label || 'Reaction'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic">No reactions recorded yet.</p>
              )}
            </div>

            <button
              onClick={() => setActiveReactorsModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Zoom Picture Modal */}
      {zoomPictureUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomPictureUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between text-white text-xs px-2">
              <span className="font-bold truncate max-w-md">{zoomPictureUrl.title}</span>
              <button
                onClick={() => setZoomPictureUrl(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomPictureUrl.url}
              alt={zoomPictureUrl.title}
              className="max-h-[85vh] w-auto object-contain rounded-2xl border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Upload Lecture Modal */}
      <UploadLectureModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(newLecture) => {
          setLectures(prev => [newLecture, ...prev]);
        }}
      />

      {/* Reusable Public User Profile Popup / Modal (Instagram/Facebook style preview card) */}
      <UserProfileModal
        isOpen={!!selectedProfileUserId}
        userId={selectedProfileUserId}
        initialData={selectedProfileInitialData}
        onClose={() => {
          setSelectedProfileUserId(null);
          setSelectedProfileInitialData(null);
        }}
      />
    </div>
  );
};

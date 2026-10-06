import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  BookOpen,
  Bookmark,
  Video,
  Shield,
  Clock,
  Edit2,
  CheckCircle2,
  Layers,
  Award,
  Target,
  Trophy,
  Flame,
  Sparkles,
  Camera,
  X,
  Volume2,
  Play,
  Check,
  Music,
  Landmark,
  Hash,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService, FirestoreBookmark, FirestoreTranscription, FirestoreLiveSession } from '../../services/firestoreService.js';
import { Book, UserBadgeStats } from '../../types/index.js';
import { ReadingGoalsTracker } from './ReadingGoalsTracker.js';
import { BadgesModule } from './BadgesModule.js';
import { OfflineVaultView } from './OfflineVaultView.js';
import { ProfileAvatarEditor } from './ProfileAvatarEditor.js';
import {
  NOTIFICATION_TUNES,
  playNotificationTune,
  getActiveNotificationTune,
  setActiveNotificationTune
} from '../../services/soundService.js';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const { navigateTo, addToast, institutes, refreshInstitutes } = useApp();

  const [activeTab, setActiveTab] = useState<'goals' | 'badges' | 'history' | 'bookmarks' | 'offline' | 'transcriptions' | 'permissions'>('goals');
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [firestoreBookmarks, setFirestoreBookmarks] = useState<FirestoreBookmark[]>([]);
  const [firestoreTranscriptions, setFirestoreTranscriptions] = useState<FirestoreTranscription[]>([]);
  const [badgeStats, setBadgeStats] = useState<UserBadgeStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [instituteId, setInstituteId] = useState(user?.instituteId || 'inst_dotx');
  const [notificationTune, setNotificationTune] = useState(user?.notificationTune || getActiveNotificationTune() || 'chime');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [showTuneSelector, setShowTuneSelector] = useState(false);
  const [playingTuneId, setPlayingTuneId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setDepartment(user.department || '');
      setRollNumber(user.rollNumber || '');
      setInstituteId(user.instituteId || 'inst_dotx');
      const currentTune = user.notificationTune || getActiveNotificationTune() || 'chime';
      setNotificationTune(currentTune);
      setActiveNotificationTune(currentTune);
      setAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    async function loadUserData() {
      try {
        if (!institutes || institutes.length === 0) {
          refreshInstitutes().catch(() => {});
        }

        const res = await api.getBooks({ limit: 4 });
        if (res.success) {
          setReadingBooks(res.books);
        }

        // Load badge summary
        api.getBadges().then(bRes => {
          if (bRes.success && bRes.stats) {
            setBadgeStats(bRes.stats);
          }
        }).catch(() => {});

        if (user?.id) {
          const [fBookmarks, fTranscripts] = await Promise.all([
            firestoreService.getUserBookmarks(user.id).catch(() => []),
            firestoreService.getUserTranscriptions(user.id).catch(() => [])
          ]);
          setFirestoreBookmarks(fBookmarks);
          setFirestoreTranscriptions(fTranscripts);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUserData();
  }, [user]);

  const handlePlayTune = (tuneId: string) => {
    setPlayingTuneId(tuneId);
    playNotificationTune(tuneId);
    setTimeout(() => {
      setPlayingTuneId(prev => (prev === tuneId ? null : prev));
    }, 1200);
  };

  const handleConfirmTune = (tuneId: string) => {
    setNotificationTune(tuneId);
    setActiveNotificationTune(tuneId);
    playNotificationTune(tuneId);
    const selectedTune = NOTIFICATION_TUNES.find(t => t.id === tuneId);
    addToast({
      type: 'success',
      title: 'Tune Confirmed & Applied!',
      message: `"${selectedTune?.name || tuneId}" is now set as your active notification alert sound.`
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        bio,
        department,
        avatar,
        rollNumber,
        instituteId,
        notificationTune
      });
      if (res.success) {
        setActiveNotificationTune(notificationTune);
        if (user?.id) {
          firestoreService.updateUserProfile(user.id, {
            name,
            bio,
            department,
            avatar,
            rollNumber,
            instituteId,
            instituteName: res.user?.instituteName,
            notificationTune
          }).catch(() => {});
        }
        updateUser(res.user);
        await refreshUser();
        setEditing(false);
        setShowTuneSelector(false);
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Profile details, Roll Number, Institute affiliation, and Notification Tune saved successfully.'
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditing = () => {
    setEditing(false);
    setShowTuneSelector(false);
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setDepartment(user.department || '');
      setRollNumber(user.rollNumber || '');
      setInstituteId(user.instituteId || 'inst_dotx');
      const currentTune = user.notificationTune || getActiveNotificationTune() || 'chime';
      setNotificationTune(currentTune);
      setAvatar(user.avatar || '');
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-400">Please sign in to view your profile.</p>
        <button
          onClick={() => navigateTo('login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* 1. Profile Header Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="relative group cursor-pointer"
            onClick={() => setEditing(true)}
            title="Click to edit profile & change picture"
          >
            <img
              src={editing && avatar ? avatar : user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/50 shadow-2xl transition-all group-hover:scale-[1.03] group-hover:border-blue-400"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold">
              <Camera className="w-5 h-5 mb-1 text-blue-400" />
              <span>Change Photo</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
                <p className="text-xs text-slate-400">@{user.username} • {user.email}</p>
              </div>

              <button
                onClick={() => (editing ? handleCancelEditing() : setEditing(true))}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors self-center sm:self-start"
              >
                {editing ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
                {user.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center space-x-1">
                <Hash className="w-3 h-3 text-cyan-400" />
                <span>Roll No: <strong>{user.rollNumber || 'Not assigned'}</strong></span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center space-x-1">
                <Landmark className="w-3 h-3 text-indigo-400" />
                <span>{user.instituteName || 'Dot X Central University'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                Dept: {user.department || 'Computer Science'}
              </span>
              {/* Notification tune badge with play trigger */}
              <button
                type="button"
                onClick={() => playNotificationTune(user.notificationTune || getActiveNotificationTune())}
                className="px-2.5 py-0.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[10px] flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Click to play your current notification chime"
              >
                <Volume2 className="w-3 h-3 text-purple-400" />
                <span>Tune: <strong>{NOTIFICATION_TUNES.find(t => t.id === (user.notificationTune || getActiveNotificationTune()))?.name || 'Crystal Chime'}</strong></span>
                <Play className="w-2.5 h-2.5 fill-purple-300" />
              </button>
            </div>

            <p className="text-xs text-slate-300 pt-2 leading-relaxed max-w-xl">
              {user.bio || 'Computer Science undergrad passionate about machine learning, algorithms, and open source development.'}
            </p>
          </div>
        </div>

        {/* Edit Form Modal/Drawer if triggered */}
        {editing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 space-y-5 text-xs">
            {/* Profile Avatar Selection Section */}
            <ProfileAvatarEditor
              currentAvatar={avatar}
              onChange={setAvatar}
              userName={name || user.name}
            />

            {/* 1. Basic Identity: Full Name & Roll Number Portal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Roll Number / Student ID</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS-2024-089 or REG-7721"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* 2. Institute Portal & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Institute & University Portal</span>
                  </span>
                  <span className="text-[10px] text-blue-400">Campus Workspace</span>
                </label>
                <select
                  value={instituteId}
                  onChange={(e) => setInstituteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {institutes && institutes.length > 0 ? (
                    institutes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="inst_dotx">Dot X Central University (DXU)</option>
                      <option value="inst_mit">MIT School of Engineering (MIT)</option>
                      <option value="inst_stanford">Stanford Academic Institute (STAN)</option>
                      <option value="inst_harvard">Harvard Law & Sciences (HLS)</option>
                      <option value="inst_oxford">Oxford University (OXF)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Academic Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & AI"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 3. Academic Bio */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Academic Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description of your academic focus or research..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              ></textarea>
            </div>

            {/* 4. Notification Alert Tune Option & Portal (CRITICAL REQUIREMENT) */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                    <Volume2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2">
                      <span>Notification Tune Selection</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Active: {NOTIFICATION_TUNES.find(t => t.id === notificationTune)?.name || notificationTune}</span>
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Choose your custom alert sound. Notifications in the app will ring with your selected tune.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handlePlayTune(notificationTune)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                    title="Play current active tune"
                  >
                    <Play className="w-3 h-3 fill-slate-200 text-slate-200" />
                    <span>Test Current</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTuneSelector(!showTuneSelector)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>{showTuneSelector ? 'Hide Tunes' : 'Select Tune (12 Available)'}</span>
                  </button>
                </div>
              </div>

              {/* 12 Tunes Grid with Play and Confirm Buttons (CRITICAL REQUIREMENT: Minimum 10 Tunes with Play & Confirm) */}
              {showTuneSelector && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Click <strong>Play</strong> to test sound &bull; Click <strong>Confirm</strong> to apply</span>
                    </span>
                    <span className="text-cyan-400 font-mono text-[10px]">12 Studio Synthesized Tunes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {NOTIFICATION_TUNES.map((tune) => {
                      const isSelected = notificationTune === tune.id;
                      const isPlaying = playingTuneId === tune.id;

                      return (
                        <div
                          key={tune.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-base">{tune.icon}</span>
                                <span className="font-bold text-white text-xs">{tune.name}</span>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected ? 'bg-blue-500/20 text-blue-300 font-bold' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {tune.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-snug">
                              {tune.description}
                            </p>
                            <div className="text-[9px] text-cyan-400/90 font-mono mt-1 flex items-center justify-between">
                              <span>{tune.pitch}</span>
                              <span className="text-slate-500">{tune.tempo}</span>
                            </div>
                          </div>

                          {/* Two Buttons: PLAY and CONFIRM (CRITICAL REQUIREMENT) */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                            {/* 1. Play Button to check tune */}
                            <button
                              type="button"
                              onClick={() => handlePlayTune(tune.id)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                                isPlaying
                                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 scale-95'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                              title="Play and check this tune"
                            >
                              <Play className={`w-3 h-3 ${isPlaying ? 'fill-slate-950 text-slate-950 animate-bounce' : 'fill-slate-200 text-slate-200'}`} />
                              <span>{isPlaying ? 'Playing...' : 'Play'}</span>
                            </button>

                            {/* 2. Confirm Button to apply tune */}
                            <button
                              type="button"
                              onClick={() => handleConfirmTune(tune.id)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                                  : 'bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-300 border border-blue-500/30'
                              }`}
                              title="Confirm and apply this tune"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isSelected ? 'Applied ✓' : 'Confirm'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'goals', label: '🎯 Reading Goals & Targets' },
          { id: 'offline', label: '💾 Offline Books & Notes' },
          { id: 'history', label: 'Recent Reading Activity' },
          { id: 'bookmarks', label: `Saved Bookmarks (${firestoreBookmarks.length || 2})` },
          { id: 'transcriptions', label: `Speech Transcripts (${firestoreTranscriptions.length})` },
          { id: 'permissions', label: 'Role & Permissions (RBAC)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      <div className="space-y-4">
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <ReadingGoalsTracker />
          </div>
        )}

        {activeTab === 'offline' && (
          <OfflineVaultView />
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {readingBooks.map((b) => (
              <div
                key={b.id}
                onClick={() => navigateTo('reading', { bookId: b.id })}
                className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-3">
                  <img src={b.coverImage} alt={b.title} className="w-12 h-16 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{b.title}</h4>
                    <p className="text-[11px] text-slate-400">{b.author}</p>
                    <div className="mt-1 text-[10px] text-blue-400">Page 18 of {b.pages} • 14% completed</div>
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg">
                  Resume
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {firestoreBookmarks.length > 0 ? (
              firestoreBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => navigateTo('reading', { bookId: bm.bookId })}
                  className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Bookmark className="w-5 h-5 text-amber-400 fill-current" />
                    <div>
                      <h4 className="font-bold text-xs text-white">{bm.bookTitle}</h4>
                      <p className="text-[11px] text-slate-400">Page {bm.pageNumber} • {bm.note || 'Synced to Firestore'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Firestore
                  </span>
                </div>
              ))
            ) : (
              readingBooks.slice(0, 2).map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigateTo('book-details', { bookId: b.id })}
                  className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3"
                >
                  <Bookmark className="w-5 h-5 text-amber-400 fill-current" />
                  <div>
                    <h4 className="font-bold text-xs text-white">{b.title}</h4>
                    <p className="text-[11px] text-slate-400">Bookmark saved at Chapter 2</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'transcriptions' && (
          <div className="space-y-3">
            {firestoreTranscriptions.length > 0 ? (
              firestoreTranscriptions.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <span>🎙️ {t.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 px-2 py-0.5 bg-slate-800 rounded">
                      {t.modelUsed || 'gemini-3.5-transcribe'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono">
                    "{t.text}"
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => navigateTo('ai-assistant')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Ask AI about this transcript →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                <p>No audio transcriptions yet. Use the microphone on the AI Assistant page to transcribe speech with gemini-3.5-transcribe.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Assigned Security Capabilities ({user.role.toUpperCase()})</span>
            </h3>
            <p className="text-slate-400">
              Your account has the following privileges provisioned in the Dot X RBAC matrix:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-800/60 flex items-center space-x-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Read Online Encrypted PDFs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 flex items-center space-x-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Join Live Classroom Meetings</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 flex items-center space-x-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Whiteboard Interactive Annotation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 flex items-center space-x-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI Academic Assistant Queries</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

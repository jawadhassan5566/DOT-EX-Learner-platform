import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Hash,
  BookOpen,
  Building2,
  Shield,
  User as UserIcon,
  CheckCircle2,
  Calendar,
  Sparkles,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { firestoreService } from '../../services/firestoreService.js';
import { api } from '../../services/api.js';

export interface UserProfileData {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  role?: string;
  instituteName?: string;
  instituteId?: string;
  rollNumber?: string;
  department?: string;
  bio?: string;
  createdAt?: string;
  status?: string;
}

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<UserProfileData> | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  initialData
}) => {
  const { openPrivateChat, addToast } = useApp();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Initial partial data for instant responsive render
    if (initialData) {
      setProfile({
        id: userId,
        name: initialData.name || 'User',
        username: initialData.username || '',
        avatar: initialData.avatar || '',
        role: initialData.role || 'student',
        instituteName: initialData.instituteName || '',
        rollNumber: initialData.rollNumber || '',
        department: initialData.department || '',
        bio: initialData.bio || ''
      });
    }

    async function fetchUserData() {
      try {
        let fetchedData: Partial<UserProfileData> | null = null;

        // 1. Try fetching from Firestore 'users' collection first as requested
        try {
          const fData = await firestoreService.getUserProfile(userId!);
          if (fData && fData.name) {
            fetchedData = {
              id: userId!,
              name: fData.name,
              username: fData.username || '',
              avatar: fData.avatar,
              role: fData.role,
              instituteName: fData.instituteName,
              instituteId: fData.instituteId,
              rollNumber: fData.rollNumber,
              department: fData.department,
              bio: fData.bio,
              createdAt: fData.createdAt?.toDate ? fData.createdAt.toDate().toISOString() : fData.createdAt,
              status: fData.status
            };
          }
        } catch (fErr) {
          console.warn('Firestore fetch user profile notice:', fErr);
        }

        // 2. Fetch from backend API /auth/profile/:id for full canonical data
        try {
          const apiRes = await api.getUserPublicProfile(userId!);
          if (apiRes.success && apiRes.user) {
            fetchedData = {
              ...(fetchedData || {}),
              id: apiRes.user.id || userId!,
              name: apiRes.user.name || fetchedData?.name || 'User',
              username: apiRes.user.username || fetchedData?.username,
              avatar: apiRes.user.avatar || fetchedData?.avatar,
              role: apiRes.user.role || fetchedData?.role,
              instituteName: apiRes.user.instituteName || fetchedData?.instituteName,
              instituteId: apiRes.user.instituteId || fetchedData?.instituteId,
              rollNumber: apiRes.user.rollNumber || fetchedData?.rollNumber,
              department: apiRes.user.department || fetchedData?.department,
              bio: apiRes.user.bio || fetchedData?.bio,
              createdAt: apiRes.user.createdAt || fetchedData?.createdAt,
              status: apiRes.user.status || fetchedData?.status
            };
          }
        } catch (apiErr) {
          console.warn('API fetch user profile notice:', apiErr);
        }

        if (!isMounted) return;

        if (fetchedData && fetchedData.name) {
          setProfile({
            id: userId!,
            name: fetchedData.name,
            username: fetchedData.username || '',
            avatar: fetchedData.avatar || '',
            role: fetchedData.role || 'student',
            instituteName: fetchedData.instituteName || 'Dot X Learner Platform',
            rollNumber: fetchedData.rollNumber || '',
            department: fetchedData.department || '',
            bio: fetchedData.bio || '',
            createdAt: fetchedData.createdAt,
            status: fetchedData.status || 'active'
          });
        } else if (!initialData) {
          setError('User profile details not found.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load user profile.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Header Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative p-4 flex justify-end">
          <div className="absolute inset-0 bg-black/10" />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors relative z-10 cursor-pointer shadow-sm"
            title="Close profile"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Picture Header Area */}
        <div className="px-6 -mt-14 flex items-end justify-between relative z-10">
          <div className="relative">
            <img
              src={profile?.avatar || defaultAvatar}
              alt={profile?.name || "Profile Picture"}
              className="w-24 h-24 rounded-full border-4 border-slate-900 object-cover shadow-2xl bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <span
              className={`w-4 h-4 rounded-full border-2 border-slate-900 absolute bottom-1.5 right-1.5 shadow-sm ${
                profile?.status === 'inactive' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              title="Active User"
            />
          </div>

          {/* Role Pill */}
          {profile?.role && (
            <div className="mb-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-blue-400 shadow-sm">
                {profile.role === 'admin' || profile.role === 'superadmin' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{profile.role}</span>
              </span>
            </div>
          )}
        </div>

        {/* Profile Body */}
        <div className="p-6 pt-3 space-y-4">
          {loading && !profile ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading public profile details...</p>
            </div>
          ) : error && !profile ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-rose-400 font-semibold">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          ) : profile ? (
            <>
              {/* Name & Tag */}
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {profile.name}
                  </h2>
                  <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-500/20 shrink-0" />
                </div>
                {profile.username && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    @{profile.username}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    "{profile.bio}"
                  </p>
                )}
              </div>

              {/* Information Cards: Institute, Roll Number, Department/Class */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Institute Name */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Institute Name
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate block">
                      {profile.instituteName || 'Dot X Central Learner Platform'}
                    </span>
                  </div>
                </div>

                {/* 2. Roll Number */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Roll Number
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                      {profile.rollNumber ? profile.rollNumber : 'DX-STUDENT-' + (profile.id ? profile.id.slice(0, 6).toUpperCase() : '001')}
                    </span>
                  </div>
                </div>

                {/* 3. Department / Class (if available) */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Department / Class
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {profile.department ? profile.department : 'General Academic Department'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status / Footer Meta */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public Learner Profile</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {profile.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : 'Verified Member'}
                </span>
              </div>

              {/* Action Buttons: Message & Close */}
              <div className="flex items-center space-x-2.5 mt-3">
                {currentUser?.id !== profile.id && (
                  <button
                    type="button"
                    onClick={() => {
                      openPrivateChat({
                        id: profile.id,
                        name: profile.name,
                        avatar: profile.avatar,
                        role: profile.role,
                        email: profile.username ? `${profile.username}@dotx.edu` : ''
                      });
                      onClose();
                      addToast({
                        type: 'info',
                        message: `Opened private chat with ${profile.name}.`
                      });
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`${currentUser?.id !== profile.id ? 'w-1/3' : 'w-full'} py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center`}
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

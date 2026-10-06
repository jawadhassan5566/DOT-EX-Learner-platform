import React, { useState, useEffect } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Target,
  Medal,
  BookOpen,
  Layers,
  BookMarked,
  Bookmark,
  CheckCircle2,
  Lock,
  ChevronRight,
  RefreshCw,
  Star,
  ShieldCheck,
  TrendingUp,
  X,
  Share2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Badge, BadgeCategory, BadgeTier, UserBadgeStats } from '../../types/index.js';

interface BadgesModuleProps {
  onNavigateToGoals?: () => void;
  compact?: boolean;
}

export const BadgesModule: React.FC<BadgesModuleProps> = ({ onNavigateToGoals, compact = false }) => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<UserBadgeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Modal inspection
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<Badge | null>(null);

  const loadBadges = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.getBadges();
      if (res.success) {
        setBadges(res.badges);
        setStats(res.stats);

        // Sync unlocked badges to Firestore
        if (user?.id && res.badges) {
          res.badges.filter(b => b.isUnlocked).forEach(b => {
            firestoreService.saveUserBadge(user.id, b).catch(() => {});
          });
        }
      }
    } catch (err) {
      console.warn("API getBadges fallback:", err);
      // Fallback local calculation
      if (user?.id) {
        try {
          const fBadges = await firestoreService.getUserBadges(user.id);
          if (fBadges.length > 0) {
            setBadges(fBadges);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [user]);

  const handleClaimAchievements = async () => {
    setRefreshing(true);
    try {
      const res = await api.claimBadges();
      if (res.success) {
        setBadges(res.badges);
        setStats(res.stats);

        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          // Open celebration modal for the first newly unlocked badge
          const firstNew = res.badges.find(b => b.code === res.newlyUnlocked[0].code) || res.newlyUnlocked[0];
          setCelebrationBadge(firstNew);

          addToast({
            type: 'success',
            title: '🎉 Achievement Unlocked!',
            message: `You earned "${firstNew.title}" (+${firstNew.xp} XP)`
          });
        } else {
          addToast({
            type: 'info',
            title: 'Achievements Up to Date',
            message: 'Your reading goals and streaks telemetry are in perfect sync!'
          });
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to sync achievements.' });
    } finally {
      setRefreshing(false);
    }
  };

  // Helper to render icon
  const renderBadgeIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Flame': return <Flame className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Medal': return <Medal className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'BookMarked': return <BookMarked className={className} />;
      case 'Bookmark': return <Bookmark className={className} />;
      default: return <Award className={className} />;
    }
  };

  // Tier styling lookup
  const getTierDetails = (tier: BadgeTier) => {
    switch (tier) {
      case 'bronze':
        return {
          name: 'Bronze Tier',
          bgGradient: 'from-amber-900/40 via-amber-800/20 to-slate-900',
          border: 'border-amber-700/40 hover:border-amber-600/70',
          iconBg: 'bg-gradient-to-tr from-amber-700 to-amber-500 text-slate-950',
          badgePill: 'bg-amber-500/20 text-amber-300 border-amber-600/40',
          glow: 'group-hover:shadow-amber-500/10'
        };
      case 'silver':
        return {
          name: 'Silver Tier',
          bgGradient: 'from-slate-700/30 via-slate-800/20 to-slate-900',
          border: 'border-slate-500/40 hover:border-slate-400/70',
          iconBg: 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950',
          badgePill: 'bg-slate-300/20 text-slate-200 border-slate-400/40',
          glow: 'group-hover:shadow-slate-300/10'
        };
      case 'gold':
        return {
          name: 'Gold Tier',
          bgGradient: 'from-amber-500/20 via-yellow-600/10 to-slate-900',
          border: 'border-yellow-500/50 hover:border-yellow-400',
          iconBg: 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950',
          badgePill: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50',
          glow: 'group-hover:shadow-yellow-500/20'
        };
      case 'platinum':
        return {
          name: 'Platinum Tier',
          bgGradient: 'from-indigo-600/20 via-purple-600/10 to-slate-900',
          border: 'border-indigo-500/50 hover:border-indigo-400',
          iconBg: 'bg-gradient-to-tr from-indigo-400 via-sky-300 to-teal-300 text-slate-950',
          badgePill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50',
          glow: 'group-hover:shadow-indigo-500/20'
        };
      case 'diamond':
        return {
          name: 'Diamond Tier',
          bgGradient: 'from-cyan-500/20 via-emerald-600/10 to-slate-900',
          border: 'border-cyan-400/60 hover:border-cyan-300',
          iconBg: 'bg-gradient-to-tr from-cyan-300 via-teal-200 to-emerald-300 text-slate-950 animate-pulse',
          badgePill: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/50',
          glow: 'group-hover:shadow-cyan-400/30'
        };
      default:
        return {
          name: 'Scholastic',
          bgGradient: 'from-slate-800 to-slate-900',
          border: 'border-slate-700',
          iconBg: 'bg-slate-700 text-white',
          badgePill: 'bg-slate-700 text-slate-300 border-slate-600',
          glow: ''
        };
    }
  };

  const filteredBadges = badges.filter(b => {
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    if (statusFilter === 'unlocked' && !b.isUnlocked) return false;
    if (statusFilter === 'locked' && b.isUnlocked) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
        <h4 className="text-sm font-bold text-white">Loading Virtual Badges & Achievements...</h4>
        <p className="text-xs text-slate-500 mt-1">Calculating reading goal targets, streaks, and scholar XP</p>
      </div>
    );
  }

  const unlockedCount = stats?.unlockedCount || badges.filter(b => b.isUnlocked).length;
  const totalBadges = stats?.totalBadges || badges.length;
  const completionRate = Math.round((unlockedCount / Math.max(1, totalBadges)) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Scholar Status & Progress Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/25 shrink-0">
                <Trophy className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Scholastic Badges & Achievements
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                    Level {stats?.level || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Virtual honors awarded for meeting book completion targets & sustaining study streaks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 self-start sm:self-auto">
              <button
                onClick={handleClaimAchievements}
                disabled={refreshing}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Evaluating...' : 'Check & Claim Badges'}</span>
              </button>

              {onNavigateToGoals && (
                <button
                  onClick={onNavigateToGoals}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>Goals Tracker</span>
                </button>
              )}
            </div>
          </div>

          {/* Academic Rank & XP Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Rank / Level */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Academic Rank</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-extrabold text-white truncate">
                {stats?.levelTitle || 'Novice Scholar'}
              </div>
              <div className="text-[11px] text-amber-400/90 font-semibold">
                Tier {stats?.level || 1} Academic Milestone
              </div>
            </div>

            {/* Total Scholar XP */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Scholar XP Earned</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-white">
                {stats?.totalXp || 0} <span className="text-xs font-semibold text-slate-400">XP</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {stats ? `${stats.nextLevelXp - stats.currentLevelXp} XP to Level ${stats.level + 1}` : 'Keep studying'}
              </div>
            </div>

            {/* Study Streak */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Consistent Study Streak</span>
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              </div>
              <div className="text-xl font-black text-orange-400 flex items-baseline space-x-1.5">
                <span>{stats?.streakDays || 1}</span>
                <span className="text-xs font-semibold text-slate-300">Days Active</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Daily Habit Maintained</span>
              </div>
            </div>

            {/* Badges Unlocked Total */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Badges Unlocked</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">
                {unlockedCount} <span className="text-xs font-semibold text-slate-400">of {totalBadges}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {completionRate}% Collection Completed
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Level {stats?.level || 1} Progress ({stats?.levelTitle})</span>
              </span>
              <span className="text-amber-400 font-extrabold text-xs">
                {stats?.currentLevelXp || 0} / {stats?.nextLevelXp || 150} XP ({stats?.levelProgressPercent || 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-800/90 rounded-full h-3 p-0.5 border border-slate-700/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 transition-all duration-700 shadow-sm shadow-amber-500/30"
                style={{ width: `${Math.max(4, stats?.levelProgressPercent || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Navigation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl text-xs">
        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Achievements' },
            { id: 'streak', label: '🔥 Study Streaks' },
            { id: 'goal', label: '🎯 Reading Goals' },
            { id: 'academic', label: '📚 Scholastic Milestones' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 self-end md:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
            { id: 'locked', label: `In Progress (${totalBadges - unlockedCount})` }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                statusFilter === st.id
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300 bg-slate-950 border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map(badge => {
          const tier = getTierDetails(badge.tier);
          const isUnlocked = badge.isUnlocked;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group cursor-pointer rounded-2xl bg-gradient-to-br ${tier.bgGradient} border ${tier.border} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${tier.glow} relative overflow-hidden flex flex-col justify-between`}
            >
              {/* Status Ribbon / Top Row */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tier.badgePill}`}>
                  {tier.name}
                </span>

                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-bold text-amber-300 flex items-center space-x-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>+{badge.xp} XP</span>
                  </span>

                  {isUnlocked ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" title="Achievement Unlocked">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700" title="Locked">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Badge Emblem & Information */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl ${tier.iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6`}>
                    {renderBadgeIcon(badge.icon, 'w-7 h-7 text-slate-950')}
                  </div>
                  {isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-950 font-bold" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Status Footer */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    {isUnlocked ? 'Accomplished' : 'Requirement Progress'}
                  </span>
                  <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-300 font-semibold'}>
                    {badge.progress} / {badge.target} {badge.requirementType === 'streak_days' ? 'days' : badge.requirementType === 'goals_met' ? 'goals' : 'units'}
                  </span>
                </div>

                <div className="w-full bg-slate-950/80 rounded-full h-2 p-0.5 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.max(5, badge.progressPercentage)}%` }}
                  ></div>
                </div>

                {/* Footer Tag */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked • Added to Scholar Profile</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>{Math.max(0, badge.target - badge.progress)} more to unlock</span>
                    </span>
                  )}

                  <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
          <Award className="w-10 h-10 mx-auto text-slate-600" />
          <h4 className="font-bold text-white text-sm">No Badges Match Your Current Filter</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching categories or viewing all achievements to discover more reading and streak honors.
          </p>
          <button
            onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 4. DETAIL / INSPECTION MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
            {/* Modal Header Banner */}
            <div className={`p-6 pb-8 bg-gradient-to-br ${getTierDetails(selectedBadge.tier).bgGradient} border-b border-slate-800 flex flex-col items-center text-center relative`}>
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`w-20 h-20 rounded-3xl ${getTierDetails(selectedBadge.tier).iconBg} flex items-center justify-center shadow-2xl mb-3`}>
                {renderBadgeIcon(selectedBadge.icon, 'w-10 h-10 text-slate-950')}
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1.5 ${getTierDetails(selectedBadge.tier).badgePill}`}>
                {getTierDetails(selectedBadge.tier).name}
              </span>

              <h3 className="text-lg font-black text-white">{selectedBadge.title}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">{selectedBadge.description}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Achievement Status</span>
                  <span className={selectedBadge.isUnlocked ? 'text-emerald-400 font-extrabold flex items-center space-x-1' : 'text-amber-400 font-semibold'}>
                    {selectedBadge.isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Awarded & Verified</span>
                      </>
                    ) : (
                      <span>In Progress</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Scholar Points</span>
                  <span className="text-amber-300 font-bold flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>+{selectedBadge.xp} Scholar XP</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Progress to Target</span>
                  <span className="text-white font-bold">
                    {selectedBadge.progress} / {selectedBadge.target} ({selectedBadge.progressPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      selectedBadge.isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.max(5, selectedBadge.progressPercentage)}%` }}
                  ></div>
                </div>
              </div>

              {/* Lore / Guidance */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                {selectedBadge.category === 'streak' ? (
                  <p>
                    🔥 <strong>Study Streak Advice:</strong> Read or review any textbook, audio lecture transcript, or chapter for at least 15 minutes daily to keep your habit streak alive!
                  </p>
                ) : (
                  <p>
                    🎯 <strong>Reading Goal Tip:</strong> Complete books in your reading curriculum or log finishes through the Reading Goals Tracker to advance your mastery progress.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedBadge(null);
                    if (onNavigateToGoals) onNavigateToGoals();
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  <span>Go to Goals Tracker</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`I unlocked the "${selectedBadge.title}" badge on Dot X Library!`);
                      addToast({ type: 'success', message: 'Achievement copied to clipboard!' });
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Share Achievement"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CELEBRATION MODAL */}
      {celebrationBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Ambient burst */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/50 animate-bounce">
                {renderBadgeIcon(celebrationBadge.icon, 'w-10 h-10 text-slate-950')}
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest">
                  Achievement Unlocked!
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  {celebrationBadge.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  {celebrationBadge.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Reward</span>
                  <div className="text-amber-400 font-extrabold text-sm mt-0.5">+{celebrationBadge.xp} XP</div>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Tier</span>
                  <div className="text-white font-extrabold text-sm uppercase mt-0.5">{celebrationBadge.tier}</div>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                  <div className="text-emerald-400 font-extrabold text-sm mt-0.5">Claimed</div>
                </div>
              </div>

              <button
                onClick={() => setCelebrationBadge(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/30 transition-all active:scale-95"
              >
                Accept Honors & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

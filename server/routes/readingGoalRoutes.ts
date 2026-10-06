/**
 * Dot X Library - Student Reading Goals & Target Tracking Routes
 * Supports daily & weekly book completion goals, reading progress, and streak tracking.
 */
import { Router, Response } from 'express';
import { db, ReadingGoal, BadgeDefinition } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();

// Master Badges & Virtual Achievements Catalog
export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'badge_streak_1',
    code: 'streak_spark',
    title: 'Spark of Habit',
    description: 'Began your academic journey with a 1-day study streak.',
    category: 'streak',
    tier: 'bronze',
    icon: 'Flame',
    xp: 50,
    requirementType: 'streak_days',
    requirementValue: 1
  },
  {
    id: 'badge_streak_3',
    code: 'streak_blaze_3',
    title: 'Ignited Scholar',
    description: 'Maintained a consistent study & reading streak for 3 consecutive days.',
    category: 'streak',
    tier: 'silver',
    icon: 'Zap',
    xp: 120,
    requirementType: 'streak_days',
    requirementValue: 3
  },
  {
    id: 'badge_streak_7',
    code: 'streak_flame_7',
    title: 'Unstoppable Week',
    description: 'Achieved an unbroken 7-day reading habit streak across academic materials.',
    category: 'streak',
    tier: 'gold',
    icon: 'Trophy',
    xp: 250,
    requirementType: 'streak_days',
    requirementValue: 7
  },
  {
    id: 'badge_streak_14',
    code: 'streak_inferno_14',
    title: 'Fortnight Fortitude',
    description: 'Demonstrated discipline with a continuous 14-day study streak.',
    category: 'streak',
    tier: 'platinum',
    icon: 'Crown',
    xp: 450,
    requirementType: 'streak_days',
    requirementValue: 14
  },
  {
    id: 'badge_streak_30',
    code: 'streak_supernova_30',
    title: 'Iron Habit Legend',
    description: 'Attained a legendary 30-day streak of active scholastic reading.',
    category: 'streak',
    tier: 'diamond',
    icon: 'Sparkles',
    xp: 800,
    requirementType: 'streak_days',
    requirementValue: 30
  },
  {
    id: 'badge_first_goal',
    code: 'first_goal_met',
    title: 'Target Achiever',
    description: 'Successfully reached your first daily or weekly reading completion target.',
    category: 'goal',
    tier: 'bronze',
    icon: 'Target',
    xp: 75,
    requirementType: 'goals_met',
    requirementValue: 1
  },
  {
    id: 'badge_goals_3',
    code: 'goals_hat_trick',
    title: 'Goal Crusher',
    description: 'Met your book completion targets across 3 active tracking cycles.',
    category: 'goal',
    tier: 'silver',
    icon: 'Award',
    xp: 175,
    requirementType: 'goals_met',
    requirementValue: 3
  },
  {
    id: 'badge_goals_10',
    code: 'ten_goals_legend',
    title: 'Academic Mastermind',
    description: 'Achieved 10 reading goal targets without wavering in scholarly devotion.',
    category: 'goal',
    tier: 'gold',
    icon: 'Medal',
    xp: 400,
    requirementType: 'goals_met',
    requirementValue: 10
  },
  {
    id: 'badge_book_1',
    code: 'books_first_step',
    title: 'First Tome Conquered',
    description: 'Read and logged your very first textbook or academic publication to completion.',
    category: 'goal',
    tier: 'bronze',
    icon: 'BookOpen',
    xp: 50,
    requirementType: 'books_completed',
    requirementValue: 1
  },
  {
    id: 'badge_books_5',
    code: 'books_reader_5',
    title: 'Avid Bibliophile',
    description: 'Completed 5 books across science, literature, or engineering curricula.',
    category: 'goal',
    tier: 'silver',
    icon: 'Layers',
    xp: 200,
    requirementType: 'books_completed',
    requirementValue: 5
  },
  {
    id: 'badge_books_10',
    code: 'books_scholar_10',
    title: 'Distinguished Polymath',
    description: 'Read and mastered 10 full academic books from the Dot X Library catalog.',
    category: 'goal',
    tier: 'gold',
    icon: 'BookMarked',
    xp: 450,
    requirementType: 'books_completed',
    requirementValue: 10
  },
  {
    id: 'badge_bookmarks_3',
    code: 'active_annotator',
    title: 'Curator of Insights',
    description: 'Saved 3 key bookmarks and notes in encrypted PDF course readers.',
    category: 'academic',
    tier: 'bronze',
    icon: 'Bookmark',
    xp: 80,
    requirementType: 'bookmarks_count',
    requirementValue: 3
  }
];

// Helper to evaluate and award badges for a user
export function evaluateUserBadges(userId: string): {
  badges: any[];
  stats: any;
  newlyUnlocked: any[];
} {
  const goal = db.readingGoals.find(g => g.userId === userId);
  const finishedHistory = db.readingHistory.filter(r => r.userId === userId && r.progressPercentage >= 100);
  const bookmarks = db.bookmarks.filter(b => b.userId === userId);

  const streakDays = goal ? Math.max(1, goal.currentStreakDays) : 1;
  const isGoalAchieved = goal ? goal.status === 'achieved' || goal.completedCount >= goal.targetCount : false;
  const completedBooksCount = Math.max(
    goal ? (goal.completedBookIds?.length || 0) : 0,
    finishedHistory.length
  );
  // Total goals met count approximation: achieved current cycle + finished book milestones
  const goalsAchievedCount = (isGoalAchieved ? 1 : 0) + (completedBooksCount >= 3 ? 1 : 0) + (completedBooksCount >= 6 ? 1 : 0);

  const newlyUnlocked: any[] = [];

  const badgeResults = BADGE_CATALOG.map(def => {
    let progress = 0;
    let target = def.requirementValue;

    switch (def.requirementType) {
      case 'streak_days':
        progress = streakDays;
        break;
      case 'goals_met':
        progress = goalsAchievedCount;
        break;
      case 'books_completed':
        progress = completedBooksCount;
        break;
      case 'bookmarks_count':
        progress = bookmarks.length;
        break;
      default:
        progress = 0;
    }

    const shouldBeUnlocked = progress >= target;
    const existing = db.userBadges.find(ub => ub.userId === userId && ub.badgeCode === def.code);

    let isUnlocked = false;
    let unlockedAt = '';

    if (existing) {
      isUnlocked = existing.isUnlocked;
      unlockedAt = existing.unlockedAt;
    } else if (shouldBeUnlocked) {
      // Award it!
      const newBadge = {
        id: 'ub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        badgeCode: def.code,
        unlockedAt: new Date().toISOString(),
        isUnlocked: true
      };
      db.userBadges.push(newBadge);
      isUnlocked = true;
      unlockedAt = newBadge.unlockedAt;
      newlyUnlocked.push({ ...def, unlockedAt });
    }

    const progressPercentage = Math.min(100, Math.round((progress / Math.max(1, target)) * 100));

    return {
      id: def.id,
      code: def.code,
      title: def.title,
      description: def.description,
      category: def.category,
      tier: def.tier,
      icon: def.icon,
      xp: def.xp,
      requirementType: def.requirementType,
      requirementValue: def.requirementValue,
      isUnlocked,
      unlockedAt: unlockedAt || undefined,
      progress,
      target,
      progressPercentage
    };
  });

  // Calculate XP & Level
  const unlockedBadges = badgeResults.filter(b => b.isUnlocked);
  const totalXp = unlockedBadges.reduce((sum, b) => sum + b.xp, 0);

  // Levels:
  // Level 1: 0 - 150
  // Level 2: 151 - 350
  // Level 3: 351 - 650
  // Level 4: 651 - 1050
  // Level 5: 1051 - 1600
  // Level 6+: 1601+
  let level = 1;
  let levelTitle = 'Novice Scholar';
  let currentLevelXp = totalXp;
  let nextLevelXp = 150;
  let levelProgressPercent = Math.min(100, Math.round((totalXp / 150) * 100));

  if (totalXp >= 1600) {
    level = 6;
    levelTitle = 'Grand Master Polymath';
    currentLevelXp = totalXp;
    nextLevelXp = 2500;
    levelProgressPercent = Math.min(100, Math.round((totalXp / 2500) * 100));
  } else if (totalXp >= 1050) {
    level = 5;
    levelTitle = 'Distinguished Scholar';
    currentLevelXp = totalXp - 1050;
    nextLevelXp = 550;
    levelProgressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  } else if (totalXp >= 650) {
    level = 4;
    levelTitle = 'Senior Researcher';
    currentLevelXp = totalXp - 650;
    nextLevelXp = 400;
    levelProgressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  } else if (totalXp >= 350) {
    level = 3;
    levelTitle = 'Academic Specialist';
    currentLevelXp = totalXp - 350;
    nextLevelXp = 300;
    levelProgressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  } else if (totalXp >= 150) {
    level = 2;
    levelTitle = 'Dedicated Reader';
    currentLevelXp = totalXp - 150;
    nextLevelXp = 200;
    levelProgressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  }

  const stats = {
    totalBadges: badgeResults.length,
    unlockedCount: unlockedBadges.length,
    totalXp,
    level,
    levelTitle,
    nextLevelXp,
    currentLevelXp,
    levelProgressPercent,
    streakDays,
    goalsAchievedCount,
    booksFinishedCount: completedBooksCount
  };

  return { badges: badgeResults, stats, newlyUnlocked };
}

// Calculate current effective time (including optional simulated offset for testing)
export function getEffectiveGoalTime(goal: ReadingGoal): Date {
  const offsetMs = (goal.simulatedTimeOffsetHours || 0) * 3600000;
  return new Date(Date.now() + offsetMs);
}

// Evaluate unlimited streak status & 24h restore window
export function evaluateStreakStatus(goal: ReadingGoal): {
  statusChanged: boolean;
  canRestore: boolean;
  hoursSinceLast: number;
  restoreHoursLeft: number;
} {
  const now = getEffectiveGoalTime(goal);

  // If no lastStreakIncrementAt exists, initialize it if streak > 0
  if (!goal.lastStreakIncrementAt) {
    if (goal.currentStreakDays > 0) {
      goal.lastStreakIncrementAt = new Date(now.getTime() - 2 * 3600000).toISOString();
    } else {
      return { statusChanged: false, canRestore: false, hoursSinceLast: 0, restoreHoursLeft: 0 };
    }
  }

  const lastTime = new Date(goal.lastStreakIncrementAt).getTime();
  const elapsedMs = Math.max(0, now.getTime() - lastTime);
  const hoursSinceLast = elapsedMs / (1000 * 60 * 60);

  let statusChanged = false;

  // Window 1: 0 to 24 hours
  // Streak is completely active. Student has already earned streak for this 24h cycle.
  if (hoursSinceLast < 24) {
    goal.canRestoreStreak = false;
    goal.streakMissed = false;
  }
  // Window 2: 24 to 48 hours
  // Active consecutive cycle: student can now complete goal to increase streak by 1.
  else if (hoursSinceLast >= 24 && hoursSinceLast < 48) {
    goal.canRestoreStreak = false;
    goal.streakMissed = false;
  }
  // Window 3: 48 to 72 hours (Student missed the 24h cycle; 24h restore option appears once!)
  else if (hoursSinceLast >= 48 && hoursSinceLast < 72) {
    if (!goal.streakRestored && goal.currentStreakDays > 0 && !goal.canRestoreStreak) {
      goal.savedStreakBeforeMiss = goal.currentStreakDays;
      goal.canRestoreStreak = true;
      goal.restoreAvailableUntil = new Date(lastTime + 72 * 3600000).toISOString();
      goal.streakMissed = true;
      statusChanged = true;
    }
  }
  // Window 4: >= 72 hours (Did not restore within the next 24 hours; streak restarts from zero)
  else if (hoursSinceLast >= 72) {
    if (goal.currentStreakDays > 0 || goal.canRestoreStreak) {
      goal.currentStreakDays = 0;
      goal.canRestoreStreak = false;
      goal.savedStreakBeforeMiss = 0;
      goal.streakMissed = true;
      goal.restoreAvailableUntil = undefined;
      statusChanged = true;
    }
  }

  const restoreAvailableUntilMs = goal.restoreAvailableUntil ? new Date(goal.restoreAvailableUntil).getTime() : 0;
  const restoreHoursLeft = Math.max(0, Math.round((restoreAvailableUntilMs - now.getTime()) / 3600000));

  return {
    statusChanged,
    canRestore: Boolean(goal.canRestoreStreak),
    hoursSinceLast: Math.round(hoursSinceLast * 10) / 10,
    restoreHoursLeft
  };
}

// Handle streak increment upon completing goal
export function handleGoalCompletionStreak(goal: ReadingGoal): {
  streakIncremented: boolean;
  message: string;
} {
  const now = getEffectiveGoalTime(goal);

  if (!goal.lastStreakIncrementAt) {
    // First time completing goal: streak increases by one
    goal.currentStreakDays = Math.max(1, (goal.currentStreakDays || 0) + 1);
    goal.lastStreakIncrementAt = now.toISOString();
    goal.canRestoreStreak = false;
    goal.savedStreakBeforeMiss = 0;
    goal.streakRestored = false;
    goal.lastActiveDate = now.toISOString().split('T')[0];
    return {
      streakIncremented: true,
      message: `🔥 Goal Completed! Your streak is now ${goal.currentStreakDays} day(s)!`
    };
  }

  const lastTime = new Date(goal.lastStreakIncrementAt).getTime();
  const hoursSinceLast = (now.getTime() - lastTime) / (1000 * 60 * 60);

  // If completed within the same 24 hours
  if (hoursSinceLast < 24) {
    goal.lastActiveDate = now.toISOString().split('T')[0];
    const hoursRemaining = Math.max(1, Math.round(24 - hoursSinceLast));
    return {
      streakIncremented: false,
      message: `Goal completed! Today's streak (${goal.currentStreakDays} days) is active. Come back in ~${hoursRemaining}h to increase your streak again!`
    };
  }

  // If student comes after 24 hours (24h to 48h): streak increases again!
  if (hoursSinceLast >= 24 && hoursSinceLast < 48) {
    goal.currentStreakDays += 1; // Unlimited increment
    goal.lastStreakIncrementAt = now.toISOString();
    goal.canRestoreStreak = false;
    goal.savedStreakBeforeMiss = 0;
    goal.streakRestored = false;
    goal.lastActiveDate = now.toISOString().split('T')[0];
    return {
      streakIncremented: true,
      message: `🔥 24 hours elapsed! Goal completed and streak increased to ${goal.currentStreakDays} days!`
    };
  }

  // If student completes during restore window (48h to 72h):
  if (hoursSinceLast >= 48 && hoursSinceLast < 72) {
    const baseStreak = goal.savedStreakBeforeMiss || goal.currentStreakDays || 0;
    goal.currentStreakDays = baseStreak + 1;
    goal.lastStreakIncrementAt = now.toISOString();
    goal.canRestoreStreak = false;
    goal.savedStreakBeforeMiss = 0;
    goal.streakRestored = true;
    goal.lastActiveDate = now.toISOString().split('T')[0];
    return {
      streakIncremented: true,
      message: `🔥 Saved & Increased! Streak restored and increased to ${goal.currentStreakDays} days!`
    };
  }

  // If exceeded 72 hours without restore: restarts from zero, plus 1 for completing now
  goal.currentStreakDays = 1;
  goal.lastStreakIncrementAt = now.toISOString();
  goal.canRestoreStreak = false;
  goal.savedStreakBeforeMiss = 0;
  goal.streakRestored = false;
  goal.lastActiveDate = now.toISOString().split('T')[0];
  return {
    streakIncremented: true,
    message: `Started fresh! Your new streak is 1 day. Keep coming after 24 hours to build an unlimited streak!`
  };
}

// Helper to determine if a period has expired
function checkAndRolloverGoal(goal: ReadingGoal): boolean {
  const now = getEffectiveGoalTime(goal);
  const todayStr = now.toISOString().split('T')[0];
  const periodStart = new Date(goal.periodStartDate);

  evaluateStreakStatus(goal);

  let hasRolledOver = false;

  if (goal.frequency === 'daily') {
    if (goal.periodStartDate !== todayStr) {
      goal.completedCount = 0;
      goal.completedPages = 0;
      goal.completedBookIds = [];
      goal.status = 'in_progress';
      goal.periodStartDate = todayStr;
      hasRolledOver = true;
    }
  } else if (goal.frequency === 'weekly') {
    const diffDays = Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 7) {
      goal.completedCount = 0;
      goal.completedPages = 0;
      goal.completedBookIds = [];
      goal.status = 'in_progress';
      goal.periodStartDate = todayStr;
      hasRolledOver = true;
    }
  }

  return hasRolledOver;
}

// 1. Get Current Active Reading Goal
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  let goal = db.readingGoals.find(g => g.userId === userId);

  if (!goal) {
    // Create sensible default weekly target
    const todayStr = new Date().toISOString().split('T')[0];
    goal = {
      id: "goal_" + Date.now(),
      userId,
      frequency: 'weekly',
      targetCount: 2,
      completedCount: 0,
      targetPages: 100,
      completedPages: 0,
      currentStreakDays: 1,
      lastActiveDate: todayStr,
      periodStartDate: todayStr,
      completedBookIds: [],
      status: 'in_progress',
      reminderEnabled: true,
      updatedAt: new Date().toISOString()
    };
    db.readingGoals.push(goal);
  } else {
    checkAndRolloverGoal(goal);
  }

  const streakInfo = evaluateStreakStatus(goal);

  // Calculate detailed progress metrics
  const progressPercent = Math.min(100, Math.round((goal.completedCount / Math.max(1, goal.targetCount)) * 100));

  // Get titles of completed books
  const completedBooks = db.books.filter(b => goal!.completedBookIds.includes(b.id));

  // Get active reading books from reading history
  const activeReading = db.readingHistory
    .filter(r => r.userId === userId && r.progressPercentage < 100)
    .map(r => {
      const b = db.books.find(book => book.id === r.bookId);
      return {
        ...r,
        bookTitle: b?.title || 'Academic Book',
        coverImage: b?.coverImage || ''
      };
    });

  res.json({
    success: true,
    goal,
    streakInfo,
    progressPercent,
    completedBooks,
    activeReading
  });
});

// 2. Set or Update Reading Target (Daily or Weekly)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { frequency, targetCount, targetPages, reminderEnabled } = req.body;

  if (frequency && !['daily', 'weekly'].includes(frequency)) {
    return res.status(400).json({ success: false, error: "Frequency must be 'daily' or 'weekly'." });
  }

  const parsedTargetCount = Number(targetCount);
  if (targetCount !== undefined && (isNaN(parsedTargetCount) || parsedTargetCount < 1 || parsedTargetCount > 50)) {
    return res.status(400).json({ success: false, error: "Target completed books must be between 1 and 50." });
  }

  let goal = db.readingGoals.find(g => g.userId === userId);
  const todayStr = new Date().toISOString().split('T')[0];

  if (!goal) {
    goal = {
      id: "goal_" + Date.now(),
      userId,
      frequency: frequency || 'weekly',
      targetCount: parsedTargetCount || 2,
      completedCount: 0,
      targetPages: Number(targetPages) || 100,
      completedPages: 0,
      currentStreakDays: 1,
      lastActiveDate: todayStr,
      periodStartDate: todayStr,
      completedBookIds: [],
      status: 'in_progress',
      reminderEnabled: reminderEnabled !== false,
      updatedAt: new Date().toISOString()
    };
    db.readingGoals.push(goal);
  } else {
    if (frequency) goal.frequency = frequency;
    if (parsedTargetCount) goal.targetCount = parsedTargetCount;
    if (targetPages !== undefined) goal.targetPages = Number(targetPages);
    if (reminderEnabled !== undefined) goal.reminderEnabled = Boolean(reminderEnabled);

    // Recompute status
    goal.status = goal.completedCount >= goal.targetCount ? 'achieved' : 'in_progress';
    goal.updatedAt = new Date().toISOString();
  }

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Reading Goal Configured",
    `Set ${goal.frequency} target to ${goal.targetCount} books`,
    req.ip
  );

  res.json({
    success: true,
    goal,
    message: `Your ${goal.frequency} reading goal of ${goal.targetCount} book(s) is active!`
  });
});

// 3. Complete a Book towards Goal
router.post('/complete-book', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bookId } = req.body;

  if (!bookId) {
    return res.status(400).json({ success: false, error: "Book ID is required." });
  }

  const book = db.books.find(b => b.id === bookId);
  let goal = db.readingGoals.find(g => g.userId === userId);
  const todayStr = new Date().toISOString().split('T')[0];

  if (!goal) {
    goal = {
      id: "goal_" + Date.now(),
      userId,
      frequency: 'weekly',
      targetCount: 2,
      completedCount: 0,
      targetPages: 100,
      completedPages: 0,
      currentStreakDays: 1,
      lastActiveDate: todayStr,
      periodStartDate: todayStr,
      completedBookIds: [],
      status: 'in_progress',
      reminderEnabled: true,
      updatedAt: new Date().toISOString()
    };
    db.readingGoals.push(goal);
  } else {
    checkAndRolloverGoal(goal);
  }

  // Update reading history to 100%
  let history = db.readingHistory.find(r => r.userId === userId && r.bookId === bookId);
  const totalPages = book ? book.pages : 100;
  if (history) {
    history.lastPage = totalPages;
    history.progressPercentage = 100;
    history.updatedAt = new Date().toISOString();
  } else {
    db.readingHistory.push({
      id: "rh_" + Date.now(),
      userId,
      bookId,
      lastPage: totalPages,
      totalPages,
      progressPercentage: 100,
      updatedAt: new Date().toISOString()
    });
  }

  // Record into goal
  if (!goal.completedBookIds.includes(bookId)) {
    goal.completedBookIds.push(bookId);
    goal.completedCount += 1;
    if (book) {
      goal.completedPages = (goal.completedPages || 0) + (book.pages || 50);
    }
  }

  goal.lastActiveDate = todayStr;

  const achieved = goal.completedCount >= goal.targetCount;
  let streakMessage = '';

  if (achieved) {
    goal.status = 'achieved';
    const streakResult = handleGoalCompletionStreak(goal);
    streakMessage = streakResult.message;
  } else {
    // If not yet met full target but active today
    if (goal.currentStreakDays === 0) goal.currentStreakDays = 1;
  }

  goal.updatedAt = new Date().toISOString();

  // Create milestone notification for student
  db.notifications.unshift({
    id: "notif_goal_" + Date.now(),
    title: achieved ? `🎯 Reading Goal Achieved!` : `📖 Book Completed: ${book?.title || 'Academic Book'}`,
    message: achieved
      ? `Phenomenal work! ${streakMessage || `You completed your ${goal.frequency} goal of ${goal.targetCount} books.`}`
      : `You've completed ${goal.completedCount} of ${goal.targetCount} books toward your ${goal.frequency} goal!`,
    type: 'system',
    targetGroup: 'students',
    readBy: [],
    createdAt: new Date().toISOString()
  });

  // Evaluate badges & virtual achievements
  const { newlyUnlocked, stats, badges } = evaluateUserBadges(userId);
  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach(b => {
      db.notifications.unshift({
        id: "notif_badge_" + Date.now() + "_" + b.code,
        title: `🏆 New Badge Unlocked: ${b.title}!`,
        message: `Congratulations! You unlocked the "${b.title}" virtual achievement (+${b.xp} XP).`,
        type: 'system',
        targetGroup: 'students',
        readBy: [],
        createdAt: new Date().toISOString()
      });
    });
  }

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Book Finished",
    `Completed book "${book?.title || bookId}" toward ${goal.frequency} goal`,
    req.ip
  );

  res.json({
    success: true,
    goal,
    achieved,
    newlyUnlocked,
    stats,
    badges,
    streakMessage,
    message: achieved
      ? (streakMessage || `🎉 Congratulations! You achieved your ${goal.frequency} reading target!`)
      : `Great job! "${book?.title || 'Book'}" counted toward your ${goal.frequency} target.`
  });
});

// 4. Restore Streak (Offered once within 24 hours of missing a cycle)
router.post('/restore-streak', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  let goal = db.readingGoals.find(g => g.userId === userId);
  if (!goal) {
    return res.status(404).json({ success: false, error: "No active reading goal found." });
  }

  evaluateStreakStatus(goal);

  if (!goal.canRestoreStreak) {
    return res.status(400).json({
      success: false,
      error: "No streak restore option is currently active. The restore option appears once if you miss a 24-hour cycle."
    });
  }

  const restoredStreak = goal.savedStreakBeforeMiss || goal.currentStreakDays || 1;
  const now = getEffectiveGoalTime(goal);

  // Restore streak
  goal.currentStreakDays = restoredStreak;
  // Position timestamp so they are in the active window ready to complete goal and keep going
  goal.lastStreakIncrementAt = new Date(now.getTime() - 24 * 3600000).toISOString();
  goal.canRestoreStreak = false;
  goal.savedStreakBeforeMiss = 0;
  goal.streakRestored = true;
  goal.streakMissed = false;
  goal.restoreAvailableUntil = undefined;
  goal.updatedAt = new Date().toISOString();

  // Create notification
  db.notifications.unshift({
    id: "notif_streak_restore_" + Date.now(),
    title: `🔥 Streak Restored!`,
    message: `Your ${restoredStreak}-day reading streak has been restored! Complete your goal today to increase your streak.`,
    type: 'system',
    targetGroup: 'students',
    readBy: [],
    createdAt: new Date().toISOString()
  });

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Streak Restored",
    `Restored ${restoredStreak}-day streak`,
    req.ip
  );

  res.json({
    success: true,
    goal,
    message: `🔥 Streak successfully restored to ${restoredStreak} days! Complete your reading goal to increase your streak!`
  });
});

// 5. Fast-Forward Time / Simulation (for Testing 24h cycle, Restore window, and Reset)
router.post('/simulate-time', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { hoursToAdd, resetTime } = req.body;

  let goal = db.readingGoals.find(g => g.userId === userId);
  if (!goal) {
    return res.status(404).json({ success: false, error: "Goal not found." });
  }

  if (resetTime) {
    goal.simulatedTimeOffsetHours = 0;
  } else {
    goal.simulatedTimeOffsetHours = (goal.simulatedTimeOffsetHours || 0) + Number(hoursToAdd || 0);
  }

  const evalResult = evaluateStreakStatus(goal);
  goal.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    goal,
    simulatedOffsetHours: goal.simulatedTimeOffsetHours,
    evalResult,
    message: resetTime
      ? `Time reset to real-time clock.`
      : `Fast-forwarded time by ${hoursToAdd}h (Total simulation offset: ${goal.simulatedTimeOffsetHours} hours).`
  });
});

// 4. Get User Badges & Virtual Achievements
router.get('/badges', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { badges, stats, newlyUnlocked } = evaluateUserBadges(userId);

  res.json({
    success: true,
    badges,
    stats,
    newlyUnlocked
  });
});

// 5. Check & Claim Any New Badges
router.post('/badges/claim', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { badges, stats, newlyUnlocked } = evaluateUserBadges(userId);

  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach(b => {
      db.notifications.unshift({
        id: "notif_badge_" + Date.now() + "_" + b.code,
        title: `🏆 Badge Earned: ${b.title}!`,
        message: `Virtual achievement unlocked: ${b.title} (+${b.xp} XP)`,
        type: 'system',
        targetGroup: 'students',
        readBy: [],
        createdAt: new Date().toISOString()
      });
    });
  }

  res.json({
    success: true,
    claimedCount: newlyUnlocked.length,
    newlyUnlocked,
    badges,
    stats,
    message: newlyUnlocked.length > 0
      ? `🎉 You claimed ${newlyUnlocked.length} new virtual achievement${newlyUnlocked.length > 1 ? 's' : ''}!`
      : `All earned achievements are already up to date!`
  });
});

export default router;

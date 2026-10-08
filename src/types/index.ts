/**
 * Dot X Library - Type Definitions
 */

export interface Institute {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  logo?: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  status: 'active' | 'suspended';
  address?: string;
  website?: string;
  studentCount?: number;
  bookCount?: number;
  meetingCount?: number;
  announcementCount?: number;
  allowRegistration: boolean;
  createdAt: string;
}

export type UserRole = 'student' | 'teacher' | 'subadmin' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  roleId?: string;
  roleName?: string;
  adminType?: 'super' | 'main' | 'sub';
  parentAdminId?: string;
  parentAdminName?: string;
  permissions?: string[];
  instituteId?: string;
  instituteName?: string;
  rollNumber?: string;
  notificationTune?: string;
  avatar: string;
  bio?: string;
  department?: string;
  status: 'active' | 'suspended' | 'inactive';
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  mastered?: boolean;
}

export interface FlashcardDeck {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  chapterTitle: string;
  chapterIndex?: number;
  cards: Flashcard[];
  createdAt: string;
  lastStudiedAt?: string;
  masteryPercentage?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 4 multiple-choice options
  correctAnswerIndex: number; // 0-indexed: 0, 1, 2, or 3
  explanation: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  chapterTitle: string;
  chapterIndex?: number;
  userId?: string;
  questions: QuizQuestion[]; // 5 questions
  totalQuestions: number;
  modelUsed?: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  chapterIndex?: number;
  userId: string;
  userName?: string;
  userRole?: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number; // Number of correct answers (0 - 5)
  totalQuestions: number; // 5
  percentage: number; // (score / totalQuestions) * 100
  grade: string; // 'A+', 'A', 'B', 'C', 'F'
  masteryLevel: 'Distinction' | 'Proficient' | 'Needs Review';
  timeSpentSeconds: number;
  strengths: string[];
  reviewAreas: string[];
  completedAt: string;
  xpEarned: number;
}

export interface Permission {
  code: string;
  name: string;
  category: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  bookCount?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  categoryId: string;
  categoryName: string;
  instituteId?: string;
  instituteName?: string;
  description: string;
  coverImage: string;
  fileUrl: string;
  fileSize: string;
  pages: number;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  downloadAllowed: boolean;
  readCount: number;
  downloadCount: number;
  rating: number;
  publishYear: number;
  isbn: string;
  language: string;
  publisher: string;
  contentPages?: { page: number; title: string; content: string }[];
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  note?: string;
  createdAt: string;
}

export interface ReadingHistory {
  id: string;
  userId: string;
  bookId: string;
  lastPage: number;
  totalPages: number;
  progressPercentage: number;
  updatedAt: string;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  frequency: 'daily' | 'weekly';
  targetCount: number; // Target number of books to complete (e.g. 1 book daily, or 2 books weekly)
  completedCount: number; // Books completed in the current active window
  targetPages?: number; // Optional pages reading target (e.g. 30 pages/day)
  completedPages?: number; // Pages read in current active window
  currentStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  periodStartDate: string; // YYYY-MM-DD
  completedBookIds: string[];
  status: 'in_progress' | 'achieved';
  reminderEnabled: boolean;
  updatedAt: string;
  lastStreakIncrementAt?: string;
  canRestoreStreak?: boolean;
  savedStreakBeforeMiss?: number;
  restoreAvailableUntil?: string;
  streakMissed?: boolean;
  streakRestored?: boolean;
  simulatedTimeOffsetHours?: number;
}

export type BadgeCategory = 'goal' | 'streak' | 'academic' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  xp: number;
  requirementType: 'goals_met' | 'streak_days' | 'books_completed' | 'pages_read' | 'bookmarks_count' | 'meetings_joined';
  requirementValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  progressPercentage: number;
}

export interface UserBadgeStats {
  totalBadges: number;
  unlockedCount: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelXp: number;
  levelProgressPercent: number;
  streakDays: number;
  goalsAchievedCount: number;
  booksFinishedCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'book' | 'meeting' | 'announcement' | 'system' | 'contact';
  targetGroup?: 'all' | 'students' | 'teachers' | 'admins';
  targetAudience?: string;
  instituteId?: string;
  instituteName?: string;
  visibility?: 'institute' | 'global';
  isGlobal?: boolean;
  isRead?: boolean;
  scheduledAt?: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  instituteId?: string;
  instituteName?: string;
  category: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  meetCode: string;
  shareLink?: string;
  allowChat: boolean;
  allowWhiteboard: boolean;
  allowScreenShare: boolean;
  participantsCount: number;
  maxParticipants: number;
  isWhiteboardOpen?: boolean;
  isScreenSharing?: boolean;
  screenSharePresenter?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  } | null;
}

export interface ActiveScreenShare {
  meetingId: string;
  presenter: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  startedAt: string;
  streamMetadata?: any;
}

export interface MeetingAttendance {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetCode: string;
  category: string;
  hostName: string;
  instituteId?: string;
  instituteName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  department?: string;
  joinedAt: string;
  leftAt?: string;
  durationMinutes: number;
  status: 'present' | 'late' | 'excused' | 'active';
  device?: string;
  ipAddress?: string;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantDetails: { id: string; name: string; avatar: string; role: string }[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  imageMimeType?: string;
  subject?: string;
  createdAt: string;
}

export interface EmailDispatchRecord {
  messageId: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  sentAt: string;
  deliveredAt: string;
  smtpStatus: string;
  bodySummary?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  type: 'contact' | 'book_request' | 'academic_problem' | 'support' | 'complaint' | 'grievance';
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  instituteId?: string;
  instituteName?: string;
  forwardedToAdminEmail?: string;
  forwardedToAdminName?: string;
  forwardedAt?: string;
  deliveryStatus?: 'delivered' | 'pending';
  emailDispatch?: EmailDispatchRecord;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactTicket = ContactMessage;

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowedFileTypes: string[];
  maxFileSizeMB: number;
  defaultTheme: 'dark' | 'light' | 'system';
  aiModel: string;
  aiSystemInstruction: string;
  aiDailyLimit: number;
  enableRegistration: boolean;
}

export type LectureReactionType = 'like' | 'love' | 'insightful' | 'applause' | 'mindblown';

export interface LectureReaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  reactionType: LectureReactionType;
  createdAt: string;
}

export interface LectureComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  text: string;
  createdAt: string;
}

export interface LectureMedia {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'picture';
  mediaUrl: string;
  thumbnailUrl?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: string;
  uploaderAvatar?: string;
  instituteId: string;
  instituteName: string;
  visibility: 'private' | 'global';
  subject: string;
  topic?: string;
  courseLevel?: string;
  durationMinutes?: number;
  tags?: string[];
  likesCount: number;
  likedUserIds: string[];
  reactions: LectureReaction[];
  comments: LectureComment[];
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
}

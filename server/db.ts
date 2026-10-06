/**
 * Dot X Library - Relational In-Memory Database Store
 * Implements full normalization, relationships, and realistic academic seed data.
 */

export interface Institute {
  id: string;
  name: string;
  code: string; // e.g. "DOTX", "APEX", "HORIZON"
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

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string; // SHA256 hashed
  role: 'student' | 'teacher' | 'subadmin' | 'admin' | 'superadmin';
  roleId?: string;
  adminType?: 'super' | 'main' | 'sub';
  parentAdminId?: string;
  parentAdminName?: string;
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
  userId?: string;
  cards: Flashcard[];
  createdAt: string;
  lastStudiedAt?: string;
  masteryPercentage?: number;
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
  permissions: string[]; // Permission codes
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
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
  contentPages: { page: number; title: string; content: string }[];
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
  targetCount: number;
  completedCount: number;
  targetPages?: number;
  completedPages?: number;
  currentStreakDays: number;
  lastActiveDate: string;
  periodStartDate: string;
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

export interface BadgeDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'goal' | 'streak' | 'academic' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xp: number;
  requirementType: 'goals_met' | 'streak_days' | 'books_completed' | 'pages_read' | 'bookmarks_count' | 'meetings_joined';
  requirementValue: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeCode: string;
  unlockedAt: string;
  isUnlocked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'book' | 'meeting' | 'announcement' | 'system' | 'contact';
  targetGroup: 'all' | 'students' | 'teachers' | 'admins';
  targetAudience?: string;
  instituteId?: string;
  instituteName?: string;
  visibility?: 'institute' | 'global';
  isGlobal?: boolean;
  readBy: string[]; // user IDs who have read
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
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
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

export interface LectureReaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  reactionType: 'like' | 'love' | 'insightful' | 'applause' | 'mindblown';
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
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

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

// Global In-Memory Store
class Database {
  institutes: Institute[] = [];
  users: User[] = [];
  permissions: Permission[] = [];
  roles: Role[] = [];
  categories: Category[] = [];
  books: Book[] = [];
  bookmarks: Bookmark[] = [];
  readingHistory: ReadingHistory[] = [];
  readingGoals: ReadingGoal[] = [];
  userBadges: UserBadge[] = [];
  notifications: Notification[] = [];
  meetings: Meeting[] = [];
  meetingAttendance: MeetingAttendance[] = [];
  meetingMessages: MeetingMessage[] = [];
  chatConversations: ChatConversation[] = [];
  chatMessages: ChatMessage[] = [];
  aiConversations: AIConversation[] = [];
  aiMessages: AIMessage[] = [];
  contactMessages: ContactMessage[] = [];
  flashcardDecks: FlashcardDeck[] = [];
  lectureMedia: LectureMedia[] = [];
  activityLogs: ActivityLog[] = [];
  passwordResetTokens: { id: string; email: string; token: string; expiresAt: string; used: boolean }[] = [];
  whiteboardStates: Record<string, string> = {}; // meetingId -> serialized canvas or element data
  systemSettings: SystemSettings = {
    platformName: "Dot X Learner Platform",
    tagline: "Learn • Connect • Grow",
    supportEmail: "support@dotxlibrary.com",
    maintenanceMode: false,
    allowedFileTypes: ["pdf", "epub", "png", "jpg", "jpeg", "docx"],
    maxFileSizeMB: 50,
    defaultTheme: "dark",
    aiModel: "gemini-3.8-flash",
    aiSystemInstruction: "You are the Dot X Academic Assistant, an advanced pedagogical AI tutor. Explain complex concepts with clarity, academic rigor, step-by-step mathematical reasoning, and practical code examples. Strictly answer educational inquiries.",
    aiDailyLimit: 100,
    enableRegistration: true
  };

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Permissions
    this.permissions = [
      { code: "manage_institutes", name: "Manage Institutes & Organizations", category: "Institutes", description: "Create and manage partner institutes, campuses, and isolated datasets" },
      { code: "manage_books", name: "Manage Books", category: "Library", description: "Create, edit, delete and upload books" },
      { code: "manage_categories", name: "Manage Categories", category: "Library", description: "Add, modify, and sort book categories" },
      { code: "manage_users", name: "Manage Users", category: "Users", description: "Activate, suspend, and view user profiles" },
      { code: "manage_admins", name: "Manage Admins", category: "Administration", description: "Create admins and assign roles" },
      { code: "manage_roles", name: "Manage Roles & Permissions", category: "Administration", description: "Configure system roles and RBAC rules" },
      { code: "manage_meetings", name: "Manage Meetings", category: "Classroom", description: "Schedule, host, and moderate meetings" },
      { code: "manage_notifications", name: "Manage Notifications", category: "System", description: "Broadcast alerts and academic reminders" },
      { code: "manage_ai", name: "Manage AI Assistant", category: "AI", description: "Configure models, tokens, and academic guardrails" },
      { code: "manage_content", name: "Manage Content", category: "Content", description: "Edit homepage banners, announcements, about copy" },
      { code: "view_reports", name: "View Reports & Analytics", category: "Analytics", description: "Access platform metrics, reading graphs, and logs" },
      { code: "manage_settings", name: "Manage System Settings", category: "System", description: "Update global platform configuration" },
    ];

    // 2. Roles
    this.roles = [
      {
        id: "superadmin_role",
        name: "Super Admin",
        description: "Full, unrestricted platform access across all organizations and modules",
        isSystem: true,
        permissions: this.permissions.map(p => p.code),
      },
      {
        id: "institute_admin_role",
        name: "Institute Admin",
        description: "Autonomous administration over an isolated institute's catalog, students, and classrooms",
        isSystem: true,
        permissions: ["manage_books", "manage_categories", "manage_users", "manage_meetings", "manage_notifications", "view_reports"],
      },
      {
        id: "admin_role",
        name: "Admin",
        description: "General administration for library, users, and meetings",
        isSystem: true,
        permissions: ["manage_books", "manage_categories", "manage_users", "manage_meetings", "manage_notifications", "view_reports"],
      },
      {
        id: "content_manager_role",
        name: "Content Manager",
        description: "Curates books, categories, announcements, and banners",
        isSystem: false,
        permissions: ["manage_books", "manage_categories", "manage_content", "view_reports"],
      },
      {
        id: "meeting_manager_role",
        name: "Meeting Manager",
        description: "Organizes schedules, classrooms, and teacher sessions",
        isSystem: false,
        permissions: ["manage_meetings", "manage_notifications"],
      },
      {
        id: "support_manager_role",
        name: "Support Manager",
        description: "Handles user contact requests, book inquiries, and queries",
        isSystem: false,
        permissions: ["manage_users", "view_reports"],
      },
      {
        id: "subadmin_role",
        name: "Sub-Admin",
        description: "Restricted delegate admin: limited strictly to managing books, announcements, and meetings.",
        isSystem: true,
        permissions: ["manage_books", "manage_notifications", "manage_meetings"],
      },
    ];

    // 3. Seed Institutes & Organizations
    this.institutes = [
      {
        id: "inst_dotx",
        name: "Dot X Central University",
        code: "DOTX",
        slug: "dotx-central",
        description: "Primary academic campus and headquarters for computer science, engineering, and digital humanities.",
        adminId: "user_admin_zain",
        adminName: "Zain Ali",
        adminEmail: "zain@dotxlibrary.com",
        status: "active",
        address: "742 Evergreen Academic Blvd, Cambridge, MA",
        website: "https://central.dotxlibrary.com",
        allowRegistration: true,
        createdAt: "2026-01-01T08:00:00Z"
      },
      {
        id: "inst_apex",
        name: "Apex Institute of Technology & AI",
        code: "APEX",
        slug: "apex-tech",
        description: "Autonomous polytechnic institute focused on robotics, machine learning, and quantum information sciences.",
        adminId: "user_admin_apex",
        adminName: "Dean Marcus Vance",
        adminEmail: "admin@apex.edu",
        status: "active",
        address: "10 Innovation Way, Silicon Valley, CA",
        website: "https://apex.edu",
        allowRegistration: true,
        createdAt: "2026-02-15T09:30:00Z"
      },
      {
        id: "inst_horizon",
        name: "Horizon Medical & Health Sciences University",
        code: "HORIZON",
        slug: "horizon-med",
        description: "Premier academic medical center dedicated to clinical genetics, pharmacology, neurobiology, and clinical practice.",
        adminId: "user_admin_horizon",
        adminName: "Dr. Elena Rostova",
        adminEmail: "admin@horizon.edu",
        status: "active",
        address: "500 Pasteur Way, Medical Center, Chicago, IL",
        website: "https://horizon.edu",
        allowRegistration: true,
        createdAt: "2026-03-01T10:00:00Z"
      },
      {
        id: "inst_punjab",
        name: "Punjab College",
        code: "PUNJAB",
        slug: "punjab-college",
        description: "Premier academic institution delivering higher education excellence in science, commerce, computer science, and engineering.",
        adminId: "user_admin_punjab",
        adminName: "Prof. Muhammad Tariq",
        adminEmail: "admin@punjabcollege.edu",
        status: "active",
        address: "Main Campus, Canal Road, Lahore, Punjab",
        website: "https://pgc.edu",
        allowRegistration: true,
        createdAt: "2026-01-15T09:00:00Z"
      }
    ];

    // Password hash for 'password123'
    // Simple sha256 of 'password123' = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
    const defaultHash = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";

    // 4. Seed Users
    this.users = [
      {
        id: "user_superadmin",
        name: "Main Admin",
        username: "superadmin",
        email: "admin@dotxlibrary.com",
        passwordHash: defaultHash,
        role: "superadmin",
        roleId: "superadmin_role",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        bio: "Dot X Library Chief Platform Administrator",
        department: "Platform Engineering",
        status: "active",
        twoFactorEnabled: true,
        createdAt: "2026-01-01T08:00:00Z",
        lastLoginAt: "2026-09-23T20:30:00Z",
      },
      {
        id: "user_admin_zain",
        name: "Zain Ali",
        username: "zainali",
        email: "zain@dotxlibrary.com",
        passwordHash: defaultHash,
        role: "admin",
        roleId: "admin_role",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        bio: "Academic Dean & Operations Manager",
        department: "Computer Science",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-01-15T09:00:00Z",
        lastLoginAt: "2026-09-22T14:15:00Z",
      },
      {
        id: "user_admin_hassan",
        name: "Hassan Raza",
        username: "hassanraza",
        email: "hassan@dotxlibrary.com",
        passwordHash: defaultHash,
        role: "admin",
        roleId: "content_manager_role",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        bio: "Library Content Director",
        department: "Academic Publishing",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-01T10:00:00Z",
        lastLoginAt: "2026-09-21T18:40:00Z",
      },
      {
        id: "user_student_jawad",
        name: "Jawad Hassan",
        username: "jawadhassan",
        email: "jawadhassan5464@gmail.com",
        passwordHash: defaultHash,
        role: "student",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        rollNumber: "DX-CS-2024-042",
        notificationTune: "chime",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        bio: "Computer Science & Artificial Intelligence Enthusiast",
        department: "Software Engineering",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-10T11:00:00Z",
        lastLoginAt: "2026-09-23T22:15:00Z",
      },
      {
        id: "user_teacher_sarah",
        name: "Dr. Sarah Khan",
        username: "sarahkhan",
        email: "sarah@dotxlibrary.com",
        passwordHash: defaultHash,
        role: "teacher",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        bio: "Senior Professor of Computer Science & Algorithms",
        department: "Computer Science",
        status: "active",
        twoFactorEnabled: true,
        createdAt: "2026-02-12T12:00:00Z",
        lastLoginAt: "2026-09-23T19:00:00Z",
      },
      {
        id: "user_student_usman",
        name: "Usman Khan",
        username: "usmankhan",
        email: "usman@student.dotx.edu",
        passwordHash: defaultHash,
        role: "student",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        bio: "Undergraduate IT Student",
        department: "Information Technology",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-03-01T14:00:00Z",
        lastLoginAt: "2026-09-23T17:20:00Z",
      },
      {
        id: "user_student_ayesha",
        name: "Ayesha Ali",
        username: "ayeshaali",
        email: "ayesha@student.dotx.edu",
        passwordHash: defaultHash,
        role: "student",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        bio: "Data Science & Applied Mathematics Major",
        department: "Mathematics",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-03-05T09:30:00Z",
        lastLoginAt: "2026-09-23T16:10:00Z",
      },
      // Apex Institute Dedicated Users
      {
        id: "user_admin_apex",
        name: "Dean Marcus Vance",
        username: "dean_apex",
        email: "admin@apex.edu",
        passwordHash: defaultHash,
        role: "admin",
        roleId: "institute_admin_role",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        bio: "Dean of Autonomous Robotics and Dean of Faculty at Apex",
        department: "Robotics & AI",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-15T10:00:00Z",
        lastLoginAt: "2026-09-23T18:00:00Z",
      },
      {
        id: "user_student_apex",
        name: "Liam Miller",
        username: "liam_apex",
        email: "student@apex.edu",
        passwordHash: defaultHash,
        role: "student",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        bio: "Undergraduate Fellow in Autonomous Drone Systems",
        department: "Robotics Engineering",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-18T11:00:00Z",
        lastLoginAt: "2026-09-23T14:30:00Z",
      },
      // Horizon Medical Dedicated Users
      {
        id: "user_admin_horizon",
        name: "Dr. Elena Rostova",
        username: "elena_horizon",
        email: "admin@horizon.edu",
        passwordHash: defaultHash,
        role: "admin",
        roleId: "institute_admin_role",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        avatar: "https://images.unsplash.com/photo-1594824813591-92f75a7ffbc2?w=150&auto=format&fit=crop&q=80",
        bio: "Chair of Clinical Genetics and Medical Director at Horizon",
        department: "School of Medicine",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-03-01T10:30:00Z",
        lastLoginAt: "2026-09-23T17:45:00Z",
      },
      {
        id: "user_student_horizon",
        name: "Maya Patel",
        username: "maya_horizon",
        email: "student@horizon.edu",
        passwordHash: defaultHash,
        role: "student",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        bio: "Fourth Year Medical Resident in Clinical Neuroscience",
        department: "Neurobiology",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-03-05T12:00:00Z",
        lastLoginAt: "2026-09-23T19:15:00Z",
      },
      // Punjab College Dedicated Users
      {
        id: "user_admin_punjab",
        name: "Prof. Muhammad Tariq",
        username: "punjab_admin",
        email: "admin@punjabcollege.edu",
        passwordHash: defaultHash,
        role: "admin",
        roleId: "institute_admin_role",
        adminType: "main",
        instituteId: "inst_punjab",
        instituteName: "Punjab College",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        bio: "Main Administrator & Dean of Student Affairs, Punjab College",
        department: "Student Affairs & Administration",
        status: "active",
        twoFactorEnabled: true,
        createdAt: "2026-01-15T09:00:00Z",
        lastLoginAt: "2026-09-24T10:00:00Z"
      },
      {
        id: "user_subadmin_punjab_1",
        name: "Hamza Malik",
        username: "subadmin_hamza",
        email: "subadmin.hamza@punjabcollege.edu",
        passwordHash: defaultHash,
        role: "subadmin",
        roleId: "subadmin_role",
        adminType: "sub",
        parentAdminId: "user_admin_punjab",
        parentAdminName: "Prof. Muhammad Tariq",
        instituteId: "inst_punjab",
        instituteName: "Punjab College",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        bio: "Sub-Admin: Library Catalog & Meetings Coordinator",
        department: "Library Operations",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-01T09:00:00Z",
        lastLoginAt: "2026-09-24T09:15:00Z"
      },
      {
        id: "user_subadmin_punjab_2",
        name: "Sana Akram",
        username: "subadmin_sana",
        email: "subadmin.sana@punjabcollege.edu",
        passwordHash: defaultHash,
        role: "subadmin",
        roleId: "subadmin_role",
        adminType: "sub",
        parentAdminId: "user_admin_punjab",
        parentAdminName: "Prof. Muhammad Tariq",
        instituteId: "inst_punjab",
        instituteName: "Punjab College",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        bio: "Sub-Admin: Academic Notices & Live Class Scheduling",
        department: "Academic Affairs",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-02-10T10:00:00Z",
        lastLoginAt: "2026-09-23T16:30:00Z"
      },
      {
        id: "user_student_fatima",
        name: "Fatima Noor",
        username: "fatimanoor",
        email: "fatima@student.dotx.edu",
        passwordHash: defaultHash,
        role: "student",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        bio: "Bioinformatics & Biochemistry Explorer",
        department: "Science",
        status: "active",
        twoFactorEnabled: false,
        createdAt: "2026-03-10T10:00:00Z",
        lastLoginAt: "2026-09-22T11:05:00Z",
      },
    ];

    // 4. Categories
    this.categories = [
      { id: "cat_cs", name: "Computer Science", slug: "computer-science", description: "Foundations of computation, systems, and algorithms", icon: "Laptop", orderIndex: 1, isActive: true },
      { id: "cat_prog", name: "Programming", slug: "programming", description: "Languages, software patterns, frameworks and best practices", icon: "Code", orderIndex: 2, isActive: true },
      { id: "cat_it", name: "Information Technology", slug: "information-technology", description: "Networking, cloud infrastructure, and cybersecurity", icon: "Server", orderIndex: 3, isActive: true },
      { id: "cat_math", name: "Mathematics", slug: "mathematics", description: "Calculus, linear algebra, discrete math and statistics", icon: "Binary", orderIndex: 4, isActive: true },
      { id: "cat_science", name: "Science", slug: "science", description: "Natural sciences, scientific inquiry, and laboratory guides", icon: "Atom", orderIndex: 5, isActive: true },
      { id: "cat_physics", name: "Physics", slug: "physics", description: "Mechanics, thermodynamics, electromagnetism and quantum", icon: "Zap", orderIndex: 6, isActive: true },
      { id: "cat_eng", name: "Engineering", slug: "engineering", description: "Electrical, mechanical, robotics, and civil engineering", icon: "Cpu", orderIndex: 7, isActive: true },
      { id: "cat_english", name: "English", slug: "english", description: "Academic writing, linguistics, research communication", icon: "BookOpen", orderIndex: 8, isActive: true },
      { id: "cat_business", name: "Business", slug: "business", description: "Economics, management, entrepreneurship and analytics", icon: "TrendingUp", orderIndex: 9, isActive: true },
      { id: "cat_gk", name: "General Knowledge", slug: "general-knowledge", description: "Global history, geography, discoveries, and encyclopedias", icon: "Globe", orderIndex: 10, isActive: true },
    ];

    // 5. Seed Books with rich chapters for PDF Reader
    this.books = [
      {
        id: "book_python_prog",
        title: "Python Programming: A Modern Academic Guide",
        author: "John Doe & Dr. Sarah Khan",
        categoryId: "cat_prog",
        categoryName: "Programming",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        description: "A comprehensive academic introduction to Python 3, algorithmic thinking, data structures, and object-oriented architecture designed for university engineering students.",
        coverImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/python-programming.pdf",
        fileSize: "14.2 MB",
        pages: 340,
        isFeatured: true,
        isPopular: true,
        isNew: false,
        downloadAllowed: true,
        readCount: 1842,
        downloadCount: 624,
        rating: 4.9,
        publishYear: 2025,
        isbn: "978-0-13-468599-1",
        language: "English",
        publisher: "Dot X Academic Press",
        createdAt: "2026-01-10T12:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Foundations of Python",
            content: `# Chapter 1: Introduction to Python Architecture\n\nPython is an interpreted, high-level, general-purpose programming language. Created by Guido van Rossum and first released in 1991, Python's design philosophy emphasizes code readability with notable use of significant indentation.\n\n## 1.1 Key Paradigms\n- **Multi-paradigm**: Object-oriented, structured, and functional programming.\n- **Dynamic Typing**: Variable types are determined at runtime with strong type enforcement.\n- **Batteries Included**: Comprehensive standard library covering mathematical computation, networking, file I/O, and string parsing.\n\n\`\`\`python\ndef greet_scholar(name: str) -> str:\n    return f"Welcome to Dot X Library, {name}!"\n\`\`\`\n\nIn modern academic engineering, Python serves as the primary gateway for data analysis, artificial intelligence, and scientific simulations.`
          },
          {
            page: 2,
            title: "Chapter 2: Data Structures & Algorithms",
            content: `# Chapter 2: Built-in Data Structures\n\nEfficient computation relies on selecting optimal memory structures for data storage.\n\n### 2.1 Lists and Tuples\nLists are mutable sequences, typically used to store collections of homogeneous items.\nTuples are immutable sequences, guaranteeing integrity across asynchronous execution threads.\n\n| Structure | Mutability | Lookup Time | Memory Overhead |\n|---|---|---|---|\n| List | Mutable | O(1) by index | Moderate |\n| Tuple | Immutable | O(1) by index | Low |\n| Dictionary | Mutable | O(1) average | High (Hash Table) |\n| Set | Mutable | O(1) average | High |\n\n\`\`\`python\nacademic_metrics = {\n    "courses": ["Algorithms", "Machine Learning"],\n    "gpa_threshold": 3.8,\n    "credits_required": 120\n}\n\`\`\`\n\nUnderstanding asymptotic complexity $O(n \\log n)$ empowers learners to write scalable software solutions.`
          },
          {
            page: 3,
            title: "Chapter 3: Object-Oriented Principles",
            content: `# Chapter 3: Object-Oriented Design in Academic Systems\n\nObject-Oriented Programming (OOP) structures code into modular reusable units called objects. The four pillars of OOP are:\n\n1. **Encapsulation**: Bundling state and operations within classes while hiding implementation details.\n2. **Abstraction**: Presenting simple interfaces while concealing underlying complexity.\n3. **Inheritance**: Creating hierarchical taxonomies where derived classes adopt baseline behaviors.\n4. **Polymorphism**: Allowing uniform interface treatment across distinct data types.\n\n\`\`\`python\nclass AcademicResource:\n    def __init__(self, resource_id: str, title: str):\n        self.resource_id = resource_id\n        self.title = title\n        \n    def get_citation(self) -> str:\n        raise NotImplementedError\n\`\`\`\n\nThese design patterns form the bedrock of robust enterprise software.`
          },
          {
            page: 4,
            title: "Chapter 4: Concurrency & Async I/O",
            content: `# Chapter 4: Asynchronous Processing and Threading\n\nHigh-performance academic applications frequently interact with remote datasets, distributed databases, and real-time streaming sockets. Python provides the \`asyncio\` library for single-threaded cooperative multitasking.\n\n\`\`\`python\nimport asyncio\n\nasync def fetch_academic_record(student_id: str):\n    await asyncio.sleep(0.5)\n    return {"id": student_id, "status": "Enrolled"}\n\`\`\`\n\nUsing asynchronous coroutines maximizes CPU utilization and responsiveness.`
          }
        ]
      },
      {
        id: "book_data_structures",
        title: "Data Structures & Algorithmic Analysis",
        author: "Robert Sedgewick & Zain Ali",
        categoryId: "cat_cs",
        categoryName: "Computer Science",
        description: "An authoritative guide to computational complexity, binary search trees, graph algorithms, hash mappings, dynamic programming, and algorithm optimization.",
        coverImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/data-structures.pdf",
        fileSize: "18.6 MB",
        pages: 520,
        isFeatured: true,
        isPopular: true,
        isNew: true,
        downloadAllowed: true,
        readCount: 2310,
        downloadCount: 890,
        rating: 4.8,
        publishYear: 2025,
        isbn: "978-0-20-136120-9",
        language: "English",
        publisher: "Dot X Academic Press",
        createdAt: "2026-01-20T10:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Asymptotic Analysis",
            content: `# Chapter 1: Foundations of Asymptotic Analysis\n\nAlgorithm evaluation requires a mathematical framework independent of specific hardware configurations.\n\n## Big-O Notation\nBig-O represents an asymptotic upper bound on function growth. For given functions $f(n)$ and $g(n)$, we state that:\n\n$$f(n) \\in O(g(n))$$\n\nif and only if there exist positive constants $c$ and $n_0$ such that for all $n \\ge n_0$, $|f(n)| \\le c|g(n)|$.\n\nCommon complexities encountered in academic computer science:\n- $O(1)$: Constant execution\n- $O(\\log n)$: Logarithmic division (Binary Search)\n- $O(n)$: Linear traversal\n- $O(n \\log n)$: Optimal comparison sorting (Merge Sort, Heap Sort)\n- $O(n^2)$: Quadratic polynomial growth\n- $O(2^n)$: Exponential expansion`
          },
          {
            page: 2,
            title: "Chapter 2: Trees and Balanced Graphs",
            content: `# Chapter 2: AVL Trees and Red-Black Trees\n\nBinary Search Trees (BST) provide logarithmic lookup in the best case, but can degenerate into $O(n)$ linked lists if unbalanced.\n\n### Self-Balancing Invariants\n- **AVL Trees**: Strict balance factor $(-1, 0, +1)$ enforced via single and double rotations.\n- **Red-Black Trees**: Approximate balance requiring root blackness, red node children blackness, and equal black height across all paths.`
          }
        ]
      },
      {
        id: "book_web_dev",
        title: "Modern Full-Stack Web Architecture",
        author: "Sarah Chen & Alex Rivera",
        categoryId: "cat_prog",
        categoryName: "Programming",
        description: "Master modern web development, reactive user interfaces, TypeScript, RESTful and GraphQL APIs, relational database design, and cloud scalability.",
        coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/modern-web-development.pdf",
        fileSize: "11.8 MB",
        pages: 280,
        isFeatured: true,
        isPopular: false,
        isNew: true,
        downloadAllowed: true,
        readCount: 1420,
        downloadCount: 450,
        rating: 4.7,
        publishYear: 2026,
        isbn: "978-1-49-195446-1",
        language: "English",
        publisher: "O'Reilly & Dot X Press",
        createdAt: "2026-02-05T09:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Component Driven Architectures",
            content: `# Chapter 1: The Modern Component Lifecycle\n\nWeb engineering has transitioned from monolithic DOM manipulation to unidirectional reactive state paradigms.\n\n### Core Tenets:\n1. Declarative UI state synchrony.\n2. Modular separation of business concerns and presentation.\n3. Type safety via static compilation (TypeScript).\n4. Optimized reconciliation engines using Virtual DOM or fine-grained reactivity.`
          }
        ]
      },
      {
        id: "book_discrete_math",
        title: "Discrete Mathematics & Proof Techniques",
        author: "James Epperson",
        categoryId: "cat_math",
        categoryName: "Mathematics",
        description: "Mathematical logic, predicate calculus, set theory, combinatorics, graph theory, modular arithmetic, and rigorous proof writing for computer scientists.",
        coverImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/discrete-math.pdf",
        fileSize: "16.4 MB",
        pages: 410,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        downloadAllowed: false, // Protected
        readCount: 1980,
        downloadCount: 0,
        rating: 4.9,
        publishYear: 2024,
        isbn: "978-0-07-338309-5",
        language: "English",
        publisher: "McGraw-Hill Academic",
        createdAt: "2026-01-05T14:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Propositional Logic",
            content: `# Chapter 1: Logic and Truth Tables\n\nA proposition is a declarative statement that is either true or false, but not both.\n\n### Logical Connectives\n- Conjunction (AND): $P \\land Q$\n- Disjunction (OR): $P \\lor Q$\n- Conditional (Implies): $P \\implies Q$\n- Biconditional (Iff): $P \\iff Q$\n\nProof by Mathematical Induction states that if $P(1)$ is true and $P(k) \\implies P(k+1)$, then $P(n)$ is true for all $n \\in \\mathbb{N}$.`
          }
        ]
      },
      {
        id: "book_physics_modern",
        title: "University Physics: Mechanics & Quantum Theory",
        author: "Hugh D. Young & Roger A. Freedman",
        categoryId: "cat_physics",
        categoryName: "Physics",
        description: "Comprehensive university physics covering classical Newtonian mechanics, electromagnetic fields, optics, thermodynamics, special relativity, and quantum models.",
        coverImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/university-physics.pdf",
        fileSize: "28.5 MB",
        pages: 680,
        isFeatured: true,
        isPopular: true,
        isNew: false,
        downloadAllowed: true,
        readCount: 1620,
        downloadCount: 520,
        rating: 4.8,
        publishYear: 2025,
        isbn: "978-0-13-515955-2",
        language: "English",
        publisher: "Pearson Academic",
        createdAt: "2026-01-12T16:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Newton's Laws and Energy",
            content: `# Chapter 1: Conservation Laws in Mechanics\n\nNewton's Second Law describes the relationship between force, mass, and acceleration:\n\n$$\\vec{F}_{net} = \\frac{d\\vec{p}}{dt} = m\\vec{a}$$\n\nWhen external net forces equal zero, total linear momentum is conserved across all isolated reference frames.`
          }
        ]
      },
      {
        id: "book_ai_foundations",
        title: "Artificial Intelligence: Principles & Machine Learning",
        author: "Stuart Russell & Peter Norvig",
        categoryId: "cat_cs",
        categoryName: "Computer Science",
        description: "The global benchmark text on intelligent agents, heuristics, probabilistic reasoning, deep neural networks, transformer architectures, reinforcement learning, and AI ethics.",
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/ai-modern-approach.pdf",
        fileSize: "32.1 MB",
        pages: 750,
        isFeatured: true,
        isPopular: true,
        isNew: true,
        downloadAllowed: true,
        readCount: 3105,
        downloadCount: 1240,
        rating: 5.0,
        publishYear: 2026,
        isbn: "978-0-13-461099-3",
        language: "English",
        publisher: "Pearson & Dot X Media",
        createdAt: "2026-02-01T08:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Intelligent Agents & Environments",
            content: `# Chapter 1: Agents and Environment Dynamics\n\nAn agent is anything that can be viewed as perceiving its environment through sensors and acting upon that environment through actuators.\n\n### The PEAS Framework\n- **P**erformance measure: Success metric\n- **E**nvironment: Accessible, deterministic, episodic, static, discrete\n- **A**ctuators: Motors, displays, network transmissions\n- **S**ensors: Cameras, microphones, keystrokes, radar`
          }
        ]
      },
      {
        id: "book_academic_writing",
        title: "Academic Research & Scientific Writing Guide",
        author: "Dr. Emily Watson",
        categoryId: "cat_english",
        categoryName: "English",
        description: "Essential methodologies for publishing peer-reviewed journal papers, drafting literature reviews, citation standards (APA, IEEE, MLA), thesis defense, and academic communication.",
        coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/academic-writing.pdf",
        fileSize: "8.4 MB",
        pages: 210,
        isFeatured: false,
        isPopular: false,
        isNew: true,
        downloadAllowed: true,
        readCount: 940,
        downloadCount: 380,
        rating: 4.6,
        publishYear: 2026,
        isbn: "978-1-10-848215-8",
        language: "English",
        publisher: "Cambridge University Press",
        createdAt: "2026-02-15T15:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Structuring Scholarly Articles",
            content: `# Chapter 1: The IMRaD Model\n\nModern academic papers in sciences and engineering follow the IMRaD structure:\n- **I**ntroduction: Research gap and hypothesis\n- **M**ethodology: Replicable procedures and datasets\n- **R**esults: Empirical observations and data graphs\n- **a**nd\n- **D**iscussion: Interpretations, limitations, and future work`
          }
        ]
      },
      {
        id: "book_cloud_eng",
        title: "Cloud Computing & Distributed Systems",
        author: "Martin Kleppmann",
        categoryId: "cat_it",
        categoryName: "Information Technology",
        description: "Designing data-intensive applications, consistency models (CAP theorem, PACELC), Raft consensus, containerization, microservices, and high-availability systems.",
        coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/cloud-computing.pdf",
        fileSize: "22.0 MB",
        pages: 580,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        downloadAllowed: true,
        readCount: 1530,
        downloadCount: 610,
        rating: 4.9,
        publishYear: 2025,
        isbn: "978-1-44-937332-0",
        language: "English",
        publisher: "O'Reilly Media",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        createdAt: "2026-01-18T11:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Reliability, Scalability, and Maintainability",
            content: `# Chapter 1: Foundations of Distributed Data\n\nWhen architecting planetary-scale software, three fundamental concerns dominate:\n\n1. **Reliability**: Tolerating hardware, software, and human errors without downtime.\n2. **Scalability**: Gracefully absorbing exponential request and data growth.\n3. **Maintainability**: Permitting engineering teams to evolve the codebase with confidence.`
          }
        ]
      },
      // Apex Institute Dedicated Isolated Books
      {
        id: "book_apex_robotics",
        title: "Autonomous Drone Systems & Precision Robotics",
        author: "Dean Marcus Vance & Liam Miller",
        categoryId: "cat_eng",
        categoryName: "Engineering",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        description: "Kinematics, sensor fusion (IMU, LiDAR, optical flow), PID controller feedback loops, and autonomous SLAM navigation for aerial robotics.",
        coverImage: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/autonomous-robotics.pdf",
        fileSize: "24.8 MB",
        pages: 410,
        isFeatured: true,
        isPopular: true,
        isNew: true,
        downloadAllowed: true,
        readCount: 620,
        downloadCount: 195,
        rating: 4.9,
        publishYear: 2026,
        isbn: "978-0-26-203784-5",
        language: "English",
        publisher: "Apex Polytechnic Press",
        createdAt: "2026-02-20T10:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Quadrotor Dynamics & Coordinate Frames",
            content: `# Quadrotor Aerodynamics and Quaternion Orientation\n\nUnlike fixed-wing aircraft, multirotor aerial platforms rely exclusively on differential thrust across opposing propeller pairs.\n\n$$\\begin{bmatrix} \\tau_x \\\\ \\tau_y \\\\ \\tau_z \\\\ F_z \\end{bmatrix} = \\begin{bmatrix} 0 & -d & 0 & d \\\\ -d & 0 & d & 0 \\\\ -c & c & -c & c \\\\ k & k & k & k \\end{bmatrix} \\begin{bmatrix} \\omega_1^2 \\\\ \\omega_2^2 \\\\ \\omega_3^2 \\\\ \\omega_4^2 \\end{bmatrix}$$\n\nState estimation employs Extended Kalman Filters (EKF) combining 6-DoF accelerometer/gyroscope measurements with RTK GPS positions.`
          }
        ]
      },
      {
        id: "book_apex_quantum",
        title: "Quantum Computation & Qubit Circuit Design",
        author: "Dr. Kenji Sato",
        categoryId: "cat_cs",
        categoryName: "Computer Science",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        description: "State vectors, Hilbert spaces, unitary operators, Shor's factoring algorithm, and Grover's quantum search implementation on superconducting quantum processors.",
        coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/quantum-computing.pdf",
        fileSize: "19.5 MB",
        pages: 360,
        isFeatured: true,
        isPopular: false,
        isNew: true,
        downloadAllowed: true,
        readCount: 480,
        downloadCount: 130,
        rating: 5.0,
        publishYear: 2026,
        isbn: "978-1-10-842426-4",
        language: "English",
        publisher: "Apex AI Publications",
        createdAt: "2026-02-25T14:30:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Superposition & Quantum Gates",
            content: `# Qubit Formalism\n\nA two-level quantum system resides in a normalized state $|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$ where $|\\alpha|^2 + |\\beta|^2 = 1$.\n\nThe Hadamard transformation creates equal superpositions:\n\n$$H = \\frac{1}{\\sqrt{2}} \\begin{bmatrix} 1 & 1 \\\\ 1 & -1 \\end{bmatrix}$$\n\nEntanglement between two qubits is achieved via the Controlled-NOT (CNOT) gate operation.`
          }
        ]
      },
      // Horizon Medical Dedicated Isolated Books
      {
        id: "book_horizon_neuro",
        title: "Clinical Neuroscience: Synaptic Plasticity & Neurodegenerative Pathology",
        author: "Dr. Elena Rostova & Maya Patel",
        categoryId: "cat_science",
        categoryName: "Science",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        description: "Cellular neurobiology, neurotransmitter receptor dynamics, synaptic long-term potentiation (LTP), functional MRI diagnostic analysis, and neurological therapeutics.",
        coverImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/clinical-neuroscience.pdf",
        fileSize: "31.4 MB",
        pages: 580,
        isFeatured: true,
        isPopular: true,
        isNew: true,
        downloadAllowed: true,
        readCount: 890,
        downloadCount: 310,
        rating: 4.9,
        publishYear: 2026,
        isbn: "978-0-19-875342-1",
        language: "English",
        publisher: "Horizon Medical Academic Press",
        createdAt: "2026-03-02T11:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Action Potential & Ion Channels",
            content: `# Action Potential Propagation\n\nThe resting membrane potential of mammalian neurons is approximately $-70\\text{ mV}$, maintained by the $Na^+/K^+$ ATPase pump ($3 Na^+$ expelled per $2 K^+$ imported).\n\n$$\\text{Goldman-Hodgkin-Katz Equation: } V_m = \\frac{RT}{F} \\ln \\left( \\frac{P_K[K^+]_o + P_{Na}[Na^+]_o + P_{Cl}[Cl^-]_i}{P_K[K^+]_i + P_{Na}[Na^+]_i + P_{Cl}[Cl^-]_o} \\right)$$\n\nDepolarization beyond the $-55\\text{ mV}$ threshold triggers voltage-gated sodium channel activation.`
          }
        ]
      },
      {
        id: "book_horizon_pharma",
        title: "Principles of Clinical Pharmacology & Pharmacokinetics",
        author: "Dr. Kenneth Wright",
        categoryId: "cat_science",
        categoryName: "Science",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        description: "Drug absorption, volume of distribution, cytochrome P450 hepatic metabolic pathways, renal clearance kinetics, and individualized precision dosing protocols.",
        coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
        fileUrl: "/api/files/clinical-pharmacology.pdf",
        fileSize: "22.6 MB",
        pages: 440,
        isFeatured: false,
        isPopular: true,
        isNew: true,
        downloadAllowed: true,
        readCount: 540,
        downloadCount: 180,
        rating: 4.8,
        publishYear: 2026,
        isbn: "978-1-26-045534-2",
        language: "English",
        publisher: "Horizon Medical Academic Press",
        createdAt: "2026-03-04T09:00:00Z",
        contentPages: [
          {
            page: 1,
            title: "Chapter 1: Pharmacokinetics: ADME Principles",
            content: `# Absorption, Distribution, Metabolism, and Excretion\n\nBioavailability ($F$) describes the fraction of administered drug reaching systemic circulation in unaltered form.\n\n$$C_p(t) = \\frac{D \\cdot F}{V_d} e^{-k_e t}$$\n\nRenal clearance evaluates glomerular filtration rate and active tubular secretion.`
          }
        ]
      }
    ];

    // 6. Seed Bookmarks & Reading History
    this.bookmarks = [
      { id: "bm_1", userId: "user_student_jawad", bookId: "book_python_prog", pageNumber: 2, note: "Review list vs tuple performance table", createdAt: "2026-09-20T14:00:00Z" },
      { id: "bm_2", userId: "user_student_jawad", bookId: "book_ai_foundations", pageNumber: 1, note: "PEAS framework for upcoming quiz", createdAt: "2026-09-22T19:30:00Z" },
    ];

    this.readingHistory = [
      { id: "rh_1", userId: "user_student_jawad", bookId: "book_python_prog", lastPage: 2, totalPages: 340, progressPercentage: 25, updatedAt: "2026-09-23T20:10:00Z" },
      { id: "rh_2", userId: "user_student_jawad", bookId: "book_data_structures", lastPage: 1, totalPages: 520, progressPercentage: 10, updatedAt: "2026-09-22T15:00:00Z" },
    ];

    this.readingGoals = [
      {
        id: "goal_jawad_active",
        userId: "user_student_jawad",
        frequency: "weekly",
        targetCount: 2,
        completedCount: 1,
        targetPages: 120,
        completedPages: 85,
        currentStreakDays: 5,
        lastActiveDate: new Date().toISOString().split('T')[0],
        periodStartDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        completedBookIds: ["book_python_prog"],
        status: "in_progress",
        reminderEnabled: true,
        updatedAt: new Date().toISOString()
      }
    ];

    // 7. Seed Notifications
    this.notifications = [
      {
        id: "notif_1",
        title: "New Book Available: Artificial Intelligence 2026",
        message: "The newest edition of Russell & Norvig's Artificial Intelligence textbook is now available in the Dot X Digital Library.",
        type: "book",
        targetGroup: "all",
        visibility: "global",
        isGlobal: true,
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        readBy: ["user_superadmin"],
        createdAt: "2026-09-23T18:00:00Z"
      },
      {
        id: "notif_2",
        title: "Meeting Reminder: Computer Science Live Class",
        message: "Dr. Sarah Khan will begin the live session 'Advanced Python & Data Structures' today at 10:00 AM.",
        type: "meeting",
        targetGroup: "students",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        readBy: [],
        createdAt: "2026-09-23T08:30:00Z"
      },
      {
        id: "notif_3",
        title: "Important Announcement: Mid-Semester Terminals",
        message: "Please ensure all reading logs and assignment submissions are completed before October 15th.",
        type: "announcement",
        targetGroup: "all",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        readBy: ["user_student_jawad"],
        createdAt: "2026-09-21T10:00:00Z"
      },
      {
        id: "notif_4",
        title: "System Update: Whiteboard Real-Time Canvas v2.4",
        message: "The collaborative classroom whiteboard now supports high-precision geometry tools, latex equations, and board export.",
        type: "system",
        targetGroup: "all",
        visibility: "global",
        isGlobal: true,
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        readBy: [],
        createdAt: "2026-09-20T12:00:00Z"
      },
      // Apex Institute Announcements (Option 1: Institute-Only vs Option 2: Global)
      {
        id: "notif_apex_1",
        title: "Apex Autonomous AI & Robotics Hackathon 2026",
        message: "Registration for the annual Autonomous Aerial & Terrestrial Robotics Challenge is now open for all enrolled Apex students. Team submissions close this Friday.",
        type: "announcement",
        targetGroup: "all",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        readBy: [],
        createdAt: "2026-09-24T09:00:00Z"
      },
      {
        id: "notif_apex_2",
        title: "Quantum Computing Lab Allocation Schedule",
        message: "Enrolled Apex engineering fellows can now reserve time slots on the Superconducting Qubit Cluster for simulation runs.",
        type: "system",
        targetGroup: "students",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        readBy: [],
        createdAt: "2026-09-22T14:00:00Z"
      },
      {
        id: "notif_apex_global",
        title: "Global Tech Innovation Fellowship 2026",
        message: "Apex Institute invites students across all universities to apply for the Inter-Campus Quantum Computing & AI Research Fellowship.",
        type: "announcement",
        targetGroup: "all",
        visibility: "global",
        isGlobal: true,
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        readBy: [],
        createdAt: "2026-09-25T15:00:00Z"
      },
      // Horizon Medical Dedicated Isolated Announcements
      {
        id: "notif_horizon_1",
        title: "Clinical Neuroscience Ward Rotations Published",
        message: "Fall clinical clerkship schedules have been posted. Fourth-year residents are required to verify their hospital ward shifts.",
        type: "announcement",
        targetGroup: "all",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        readBy: [],
        createdAt: "2026-09-24T08:00:00Z"
      },
      {
        id: "notif_horizon_2",
        title: "Bioethics & Genetics Symposium Keynote",
        message: "Dr. Elena Rostova will host a symposium on gene therapy regulation and clinical genomics this Thursday in Auditorium B.",
        type: "meeting",
        targetGroup: "all",
        visibility: "institute",
        isGlobal: false,
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        readBy: [],
        createdAt: "2026-09-21T11:00:00Z"
      }
    ];

    // 8. Seed Meetings
    this.meetings = [
      {
        id: "meet_cs_live",
        title: "Computer Science Live Class",
        description: "Interactive lecture on Graph Traversal (BFS & DFS) and Asymptotic Complexity with live whiteboard breakdown.",
        hostId: "user_teacher_sarah",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        category: "Computer Science",
        scheduledDate: "2026-09-24",
        startTime: "10:00 AM",
        durationMinutes: 60,
        status: "live",
        meetCode: "CS-101-LIVE",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 8,
        maxParticipants: 100,
      },
      {
        id: "meet_math_class",
        title: "Discrete Mathematics & Calculus",
        description: "Problem-solving seminar: Proof by induction and combinatorial recurrence relations.",
        hostId: "user_admin_zain",
        hostName: "Zain Ali",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        category: "Mathematics",
        scheduledDate: "2026-09-25",
        startTime: "11:30 AM",
        durationMinutes: 90,
        status: "upcoming",
        meetCode: "MATH-302",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: false,
        participantsCount: 14,
        maxParticipants: 50,
      },
      {
        id: "meet_web_dev",
        title: "Modern Web Development Workshop",
        description: "Hands-on coding session building full-stack applications with React, Node.js, and TypeScript.",
        hostId: "user_superadmin",
        hostName: "Main Admin",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        category: "Programming",
        scheduledDate: "2026-09-26",
        startTime: "02:00 PM",
        durationMinutes: 120,
        status: "upcoming",
        meetCode: "DEV-2026",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 32,
        maxParticipants: 150,
      },
      {
        id: "meet_physics_review",
        title: "Physics Mechanics Terminal Review",
        description: "Comprehensive review session covering angular momentum, planetary orbits, and harmonic oscillators.",
        hostId: "user_teacher_sarah",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        category: "Physics",
        scheduledDate: "2026-09-22",
        startTime: "04:00 PM",
        durationMinutes: 60,
        status: "completed",
        meetCode: "PHYS-REV",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 45,
        maxParticipants: 100,
      },
      // Apex Institute Dedicated Meetings
      {
        id: "meet_apex_robotics",
        title: "Autonomous Drone Flight Systems Lab",
        description: "Live telemetry testing, sensor fusion Kalman filtering, and flight path control demonstration.",
        hostId: "user_admin_apex",
        hostName: "Dean Marcus Vance",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        category: "Engineering",
        scheduledDate: "2026-09-24",
        startTime: "01:00 PM",
        durationMinutes: 75,
        status: "live",
        meetCode: "APEX-DRONE",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 19,
        maxParticipants: 120,
      },
      {
        id: "meet_apex_quantum",
        title: "Quantum Algorithm Simulation Seminar",
        description: "Walkthrough of Grover's search implementation using simulated quantum circuits.",
        hostId: "user_student_apex",
        hostName: "Liam Miller",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        category: "Computer Science",
        scheduledDate: "2026-09-26",
        startTime: "03:30 PM",
        durationMinutes: 60,
        status: "upcoming",
        meetCode: "APEX-QUANTUM",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 24,
        maxParticipants: 100,
      },
      // Horizon Medical Dedicated Meetings
      {
        id: "meet_horizon_rounds",
        title: "Clinical Case Rounds: Neurodegenerative Pathology",
        description: "Review of patient MRIs, synaptic transmission biomarker assays, and clinical outcomes.",
        hostId: "user_admin_horizon",
        hostName: "Dr. Elena Rostova",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        category: "Science",
        scheduledDate: "2026-09-24",
        startTime: "09:30 AM",
        durationMinutes: 90,
        status: "live",
        meetCode: "HORIZON-NEURO",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: true,
        participantsCount: 28,
        maxParticipants: 80,
      },
      {
        id: "meet_horizon_ethics",
        title: "Medical Ethics & Gene Editing Roundtable",
        description: "Bioethical considerations in CRISPR therapeutics, clinical genetics, and patient privacy standards.",
        hostId: "user_student_horizon",
        hostName: "Maya Patel",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        category: "Science",
        scheduledDate: "2026-09-25",
        startTime: "02:00 PM",
        durationMinutes: 60,
        status: "upcoming",
        meetCode: "HORIZON-BIOETHICS",
        allowChat: true,
        allowWhiteboard: true,
        allowScreenShare: false,
        participantsCount: 17,
        maxParticipants: 60,
      }
    ];

    // Seed Meeting Messages
    this.meetingMessages = [
      { id: "mm_1", meetingId: "meet_cs_live", senderId: "user_teacher_sarah", senderName: "Dr. Sarah Khan", senderRole: "teacher", text: "Welcome everyone! Please open the Data Structures book, Chapter 1.", timestamp: "10:02 AM" },
      { id: "mm_2", meetingId: "meet_cs_live", senderId: "user_student_jawad", senderName: "Jawad Hassan", senderRole: "student", text: "Good morning Professor! Audio and video are crystal clear.", timestamp: "10:03 AM" },
      { id: "mm_3", meetingId: "meet_cs_live", senderId: "user_student_usman", senderName: "Usman Khan", senderRole: "student", text: "Will we be demonstrating the whiteboard proof for BFS complexity today?", timestamp: "10:04 AM" },
      { id: "mm_4", meetingId: "meet_cs_live", senderId: "user_teacher_sarah", senderName: "Dr. Sarah Khan", senderRole: "teacher", text: "Yes Usman, we will switch to the collaborative whiteboard in 5 minutes.", timestamp: "10:05 AM" },
    ];

    // Seed Meeting Attendance Records
    this.meetingAttendance = [
      // Computer Science Live Class
      {
        id: "att_cs_1",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_teacher_sarah",
        userName: "Dr. Sarah Khan",
        userEmail: "sarah@dotxlibrary.com",
        userRole: "teacher",
        department: "Computer Science",
        joinedAt: "2026-09-24T10:00:00Z",
        durationMinutes: 52,
        status: "active",
        device: "Desktop Web (Chrome 128 / macOS)",
        ipAddress: "192.168.1.10"
      },
      {
        id: "att_cs_2",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_jawad",
        userName: "Jawad Hassan",
        userEmail: "jawadhassan5464@gmail.com",
        userRole: "student",
        department: "Computer Science",
        joinedAt: "2026-09-24T10:00:45Z",
        durationMinutes: 51,
        status: "active",
        device: "Desktop Web (Chrome / Linux)",
        ipAddress: "10.0.4.15"
      },
      {
        id: "att_cs_3",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_ayesha",
        userName: "Ayesha Ali",
        userEmail: "ayesha.ali@dotxlibrary.com",
        userRole: "student",
        department: "Computer Science",
        joinedAt: "2026-09-24T10:01:20Z",
        durationMinutes: 50,
        status: "active",
        device: "Mobile App (PWA Android)",
        ipAddress: "172.16.8.21"
      },
      {
        id: "att_cs_4",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_usman",
        userName: "Usman Khan",
        userEmail: "usman.khan@dotxlibrary.com",
        userRole: "student",
        department: "Software Engineering",
        joinedAt: "2026-09-24T10:02:10Z",
        durationMinutes: 49,
        status: "active",
        device: "Desktop Web (Firefox / Windows)",
        ipAddress: "192.168.1.44"
      },
      {
        id: "att_cs_5",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_fatima",
        userName: "Fatima Noor",
        userEmail: "fatima.noor@dotxlibrary.com",
        userRole: "student",
        department: "Software Engineering",
        joinedAt: "2026-09-24T10:04:30Z",
        durationMinutes: 47,
        status: "active",
        device: "iPad Web (Safari / iOS)",
        ipAddress: "10.0.5.88"
      },
      {
        id: "att_cs_6",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_bilal",
        userName: "Bilal Ahmed",
        userEmail: "bilal.ahmed@dotxlibrary.com",
        userRole: "student",
        department: "Artificial Intelligence",
        joinedAt: "2026-09-24T10:06:12Z",
        durationMinutes: 45,
        status: "active",
        device: "Desktop Web (Edge / Windows)",
        ipAddress: "192.168.2.19"
      },
      {
        id: "att_cs_7",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_admin_zain",
        userName: "Zain Ali",
        userEmail: "zain@dotxlibrary.com",
        userRole: "admin",
        department: "Computer Science",
        joinedAt: "2026-09-24T10:00:15Z",
        durationMinutes: 51,
        status: "active",
        device: "Desktop Web (Chrome / macOS)",
        ipAddress: "10.0.1.2"
      },
      {
        id: "att_cs_8",
        meetingId: "meet_cs_live",
        meetingTitle: "Computer Science Live Class",
        meetCode: "CS-101-LIVE",
        category: "Computer Science",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_zeeshan",
        userName: "Zeeshan Tariq",
        userEmail: "zeeshan.tariq@dotxlibrary.com",
        userRole: "student",
        department: "Data Science",
        joinedAt: "2026-09-24T10:16:45Z",
        durationMinutes: 35,
        status: "late",
        device: "Mobile Web (Chrome / Android)",
        ipAddress: "172.16.9.102"
      },

      // Apex Drone Lab
      {
        id: "att_apex_1",
        meetingId: "meet_apex_robotics",
        meetingTitle: "Autonomous Drone Flight Systems Lab",
        meetCode: "APEX-DRONE",
        category: "Engineering",
        hostName: "Dean Marcus Vance",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        userId: "user_admin_apex",
        userName: "Dean Marcus Vance",
        userEmail: "marcus@apex.edu",
        userRole: "admin",
        department: "Aerospace Engineering",
        joinedAt: "2026-09-24T13:00:00Z",
        durationMinutes: 65,
        status: "active",
        device: "Workstation (Linux)",
        ipAddress: "10.20.1.1"
      },
      {
        id: "att_apex_2",
        meetingId: "meet_apex_robotics",
        meetingTitle: "Autonomous Drone Flight Systems Lab",
        meetCode: "APEX-DRONE",
        category: "Engineering",
        hostName: "Dean Marcus Vance",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        userId: "user_student_apex",
        userName: "Liam Miller",
        userEmail: "liam@apex.edu",
        userRole: "student",
        department: "Robotics & AI",
        joinedAt: "2026-09-24T13:01:10Z",
        durationMinutes: 64,
        status: "active",
        device: "Laptop (Chrome / Windows)",
        ipAddress: "10.20.4.55"
      },
      {
        id: "att_apex_3",
        meetingId: "meet_apex_robotics",
        meetingTitle: "Autonomous Drone Flight Systems Lab",
        meetCode: "APEX-DRONE",
        category: "Engineering",
        hostName: "Dean Marcus Vance",
        instituteId: "inst_apex",
        instituteName: "Apex Institute of Technology & AI",
        userId: "user_student_chloe",
        userName: "Chloe Bennett",
        userEmail: "chloe.b@apex.edu",
        userRole: "student",
        department: "Autonomous Navigation",
        joinedAt: "2026-09-24T13:02:40Z",
        durationMinutes: 63,
        status: "active",
        device: "MacBook Pro (Safari / macOS)",
        ipAddress: "10.20.4.72"
      },

      // Horizon Clinical Rounds
      {
        id: "att_hor_1",
        meetingId: "meet_horizon_rounds",
        meetingTitle: "Clinical Case Rounds: Neurodegenerative Pathology",
        meetCode: "HORIZON-NEURO",
        category: "Science",
        hostName: "Dr. Elena Rostova",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        userId: "user_admin_horizon",
        userName: "Dr. Elena Rostova",
        userEmail: "elena@horizon.edu",
        userRole: "admin",
        department: "Neurology",
        joinedAt: "2026-09-24T09:30:00Z",
        durationMinutes: 80,
        status: "active",
        device: "Clinical Tablet (iOS)",
        ipAddress: "10.30.2.1"
      },
      {
        id: "att_hor_2",
        meetingId: "meet_horizon_rounds",
        meetingTitle: "Clinical Case Rounds: Neurodegenerative Pathology",
        meetCode: "HORIZON-NEURO",
        category: "Science",
        hostName: "Dr. Elena Rostova",
        instituteId: "inst_horizon",
        instituteName: "Horizon Medical & Health Sciences University",
        userId: "user_student_horizon",
        userName: "Maya Patel",
        userEmail: "maya.patel@horizon.edu",
        userRole: "student",
        department: "Medical Sciences",
        joinedAt: "2026-09-24T09:31:15Z",
        durationMinutes: 79,
        status: "active",
        device: "Desktop Web (Chrome / Windows)",
        ipAddress: "10.30.4.12"
      },

      // Past Meeting: Physics Review
      {
        id: "att_phys_1",
        meetingId: "meet_physics_review",
        meetingTitle: "Physics Mechanics Terminal Review",
        meetCode: "PHYS-REV",
        category: "Physics",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_jawad",
        userName: "Jawad Hassan",
        userEmail: "jawadhassan5464@gmail.com",
        userRole: "student",
        department: "Computer Science",
        joinedAt: "2026-09-22T16:00:00Z",
        leftAt: "2026-09-22T17:00:00Z",
        durationMinutes: 60,
        status: "present",
        device: "Desktop Web (Chrome / Linux)",
        ipAddress: "10.0.4.15"
      },
      {
        id: "att_phys_2",
        meetingId: "meet_physics_review",
        meetingTitle: "Physics Mechanics Terminal Review",
        meetCode: "PHYS-REV",
        category: "Physics",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_fatima",
        userName: "Fatima Noor",
        userEmail: "fatima.noor@dotxlibrary.com",
        userRole: "student",
        department: "Software Engineering",
        joinedAt: "2026-09-22T16:01:30Z",
        leftAt: "2026-09-22T17:00:00Z",
        durationMinutes: 58,
        status: "present",
        device: "iPad Web (Safari / iOS)",
        ipAddress: "10.0.5.88"
      },
      {
        id: "att_phys_3",
        meetingId: "meet_physics_review",
        meetingTitle: "Physics Mechanics Terminal Review",
        meetCode: "PHYS-REV",
        category: "Physics",
        hostName: "Dr. Sarah Khan",
        instituteId: "inst_dotx",
        instituteName: "Dot X Central University",
        userId: "user_student_hamza",
        userName: "Hamza Tariq",
        userEmail: "hamza.tariq@dotxlibrary.com",
        userRole: "student",
        department: "Physics",
        joinedAt: "2026-09-22T16:15:10Z",
        leftAt: "2026-09-22T17:00:00Z",
        durationMinutes: 45,
        status: "late",
        device: "Mobile App (Android)",
        ipAddress: "172.16.12.90"
      }
    ];

    // 9. Seed Chat Conversations & Messages
    this.chatConversations = [
      {
        id: "conv_admin_jawad",
        participantIds: ["user_superadmin", "user_student_jawad"],
        participantDetails: [
          { id: "user_superadmin", name: "Main Admin", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", role: "Super Admin" },
          { id: "user_student_jawad", name: "Jawad Hassan", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", role: "Student" }
        ],
        lastMessage: "Sure! Please check the guidelines for thesis formatting.",
        lastMessageTime: "Yesterday",
        unreadCount: 0
      },
      {
        id: "conv_sarah_jawad",
        participantIds: ["user_teacher_sarah", "user_student_jawad"],
        participantDetails: [
          { id: "user_teacher_sarah", name: "Dr. Sarah Khan", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", role: "Teacher" },
          { id: "user_student_jawad", name: "Jawad Hassan", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", role: "Student" }
        ],
        lastMessage: "Your algorithm assignment scored 98%. Excellent implementation!",
        lastMessageTime: "2 hours ago",
        unreadCount: 1
      },
      {
        id: "conv_usman_jawad",
        participantIds: ["user_student_usman", "user_student_jawad"],
        participantDetails: [
          { id: "user_student_usman", name: "Usman Khan", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", role: "Student" },
          { id: "user_student_jawad", name: "Jawad Hassan", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", role: "Student" }
        ],
        lastMessage: "Are you joining the Live CS class right now?",
        lastMessageTime: "10:01 AM",
        unreadCount: 0
      }
    ];

    this.chatMessages = [
      { id: "cm_1", conversationId: "conv_admin_jawad", senderId: "user_student_jawad", senderName: "Jawad Hassan", text: "Hello, I have a question regarding book download permissions.", createdAt: "2026-09-22T14:20:00Z", isRead: true },
      { id: "cm_2", conversationId: "conv_admin_jawad", senderId: "user_superadmin", senderName: "Main Admin", text: "Hello Jawad! Most academic books can be downloaded directly as verified PDF. Protected books require faculty authorization.", createdAt: "2026-09-22T14:25:00Z", isRead: true },
      { id: "cm_3", conversationId: "conv_sarah_jawad", senderId: "user_teacher_sarah", senderName: "Dr. Sarah Khan", text: "Your algorithm assignment scored 98%. Excellent implementation!", createdAt: "2026-09-23T20:10:00Z", isRead: false },
      { id: "cm_4", conversationId: "conv_usman_jawad", senderId: "user_student_usman", senderName: "Usman Khan", text: "Are you joining the Live CS class right now?", createdAt: "2026-09-23T10:01:00Z", isRead: true }
    ];

    // 10. Seed AI Academic Assistant Conversations
    this.aiConversations = [
      {
        id: "ai_conv_1",
        userId: "user_student_jawad",
        title: "Database Indexing & B-Trees",
        subject: "Computer Science",
        createdAt: "2026-09-22T16:00:00Z",
        updatedAt: "2026-09-22T16:15:00Z"
      },
      {
        id: "ai_conv_2",
        userId: "user_student_jawad",
        title: "Calculus: Taylor Series Expansion",
        subject: "Mathematics",
        createdAt: "2026-09-21T11:00:00Z",
        updatedAt: "2026-09-21T11:20:00Z"
      }
    ];

    this.aiMessages = [
      {
        id: "aim_1",
        conversationId: "ai_conv_1",
        sender: "user",
        text: "Explain the concept of database indexing and how B-Trees optimize lookup speeds.",
        subject: "Computer Science",
        createdAt: "2026-09-22T16:01:00Z"
      },
      {
        id: "aim_2",
        conversationId: "ai_conv_1",
        sender: "assistant",
        text: `### Academic Explanation: Database Indexing & B-Trees

A **database index** is an auxiliary data structure that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space.

#### 1. The Fundamental Problem: Sequential Scan ($O(n)$)
Without an index, the database engine must evaluate every single row from disk (a *full table scan*). On a table with 10 million rows, this requires millions of disk block I/O operations.

#### 2. Why B-Trees / B+Trees?
Unlike Binary Search Trees (which have a branching factor of 2 and can become excessively deep), a **B-Tree** has a very high branching factor (typically 100 to 1,000 children per node).

- **Shallow Tree Depth**: Even with 1 billion records, a B+Tree typically has a depth of only 3 or 4 levels.
- **Disk Page Alignment**: Each node fits exactly into one hardware disk block (e.g., 4KB or 8KB), minimizing disk read operations.
- **Logarithmic Complexity**: Search, insertion, and deletion operate in $O(\\log_B n)$ I/O operations, reducing lookup times from seconds to sub-milliseconds.`,
        subject: "Computer Science",
        createdAt: "2026-09-22T16:01:10Z"
      }
    ];

    // 11. Seed Contact / Support Messages
    this.contactMessages = [
      {
        id: "contact_1",
        name: "Usman Khan",
        email: "usman@student.dotx.edu",
        type: "book_request",
        subject: "Requesting: Advanced Quantum Computing textbook",
        message: "Could we please add Nielsen and Chuang's Quantum Computation and Quantum Information to the physics catalog?",
        status: "in_progress",
        adminResponse: "We have submitted the acquisition request to the university academic board.",
        createdAt: "2026-09-22T11:00:00Z",
        updatedAt: "2026-09-22T15:30:00Z"
      },
      {
        id: "contact_2",
        name: "Ayesha Ali",
        email: "ayesha@student.dotx.edu",
        type: "academic_problem",
        subject: "Clarification on Discrete Math Chapter 3 proof",
        message: "During Theorem 3.4 on graph colorability, equation (7) has a typographic sign difference compared to lecture notes.",
        status: "resolved",
        adminResponse: "Prof. Sedgewick verified: the errata has been patched in the latest PDF release.",
        createdAt: "2026-09-21T09:15:00Z",
        updatedAt: "2026-09-21T16:40:00Z"
      },
      {
        id: "contact_3",
        name: "Bilal Tariq",
        email: "bilal@gmail.com",
        type: "support",
        subject: "Issue downloading offline reading packages",
        message: "Whenever I click download on mobile iOS Safari, the connection drops at 90%.",
        status: "new",
        createdAt: "2026-09-23T19:00:00Z",
        updatedAt: "2026-09-23T19:00:00Z"
      }
    ];

    // 12. Seed AI-Generated Study Flashcards Decks
    this.flashcardDecks = [
      {
        id: "deck_py_ch1",
        bookId: "book_python_prog",
        bookTitle: "Python Programming: A Modern Academic Guide",
        bookCover: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop&q=80",
        chapterTitle: "Chapter 1: Foundations of Python",
        chapterIndex: 0,
        userId: "user_student_jawad",
        createdAt: "2026-09-24T10:00:00Z",
        lastStudiedAt: "2026-09-24T11:30:00Z",
        masteryPercentage: 80,
        cards: [
          {
            id: "fc_1",
            front: "What primary design philosophy distinguishes Python's syntax from languages like C++ or Java?",
            back: "Python emphasizes code readability and uses significant indentation rather than curly brackets to delimit execution blocks.",
            hint: "Think about how code blocks are structured visual-wise.",
            difficulty: "easy",
            category: "Core Principle",
            mastered: true
          },
          {
            id: "fc_2",
            front: "What is dynamic typing in Python and when are variable types evaluated?",
            back: "Variable types are bound dynamically at runtime without explicit static declaration, while strong typing prevents implicit type coercion between incompatible types (e.g. str + int).",
            hint: "Compile time vs. Execution time.",
            difficulty: "medium",
            category: "Type System",
            mastered: true
          },
          {
            id: "fc_3",
            front: "What does the 'Batteries Included' philosophy of Python signify?",
            back: "It means Python ships with a comprehensive standard library out-of-the-box, supporting built-in modules for OS interfacing, networking, math, file I/O, and string parsing.",
            hint: "Standard library scope.",
            difficulty: "easy",
            category: "Ecosystem",
            mastered: false
          },
          {
            id: "fc_4",
            front: "Which programming paradigms does Python natively support?",
            back: "Python is multi-paradigm: supporting Object-Oriented Programming (OOP), Structured/Procedural programming, and Functional programming paradigms.",
            hint: "Three main programming paradigms.",
            difficulty: "medium",
            category: "Language Architecture",
            mastered: true
          }
        ]
      },
      {
        id: "deck_ds_ch2",
        bookId: "book_data_structures",
        bookTitle: "Data Structures & Algorithmic Analysis",
        bookCover: "https://images.unsplash.com/photo-1516116211227-bbc07ef69055?w=500&auto=format&fit=crop&q=80",
        chapterTitle: "Chapter 2: Linear Data Structures & Memory Alignment",
        chapterIndex: 1,
        userId: "user_student_jawad",
        createdAt: "2026-09-23T14:00:00Z",
        lastStudiedAt: "2026-09-23T15:20:00Z",
        masteryPercentage: 66,
        cards: [
          {
            id: "fc_ds_1",
            front: "What is the time complexity difference between array indexing and linked list element access?",
            back: "Array indexing is O(1) constant time due to contiguous memory calculation; Linked List node traversal is O(n) linear time.",
            hint: "Direct offset calculation vs sequential node traversal.",
            difficulty: "easy",
            category: "Asymptotic Complexity",
            mastered: true
          },
          {
            id: "fc_ds_2",
            front: "Why are balanced B-Trees preferred over Binary Search Trees in database storage engines?",
            back: "B-Trees have high fan-out (100–1000 keys per node) which matches disk page block sizes, drastically reducing disk I/O operations from deep tree lookups.",
            hint: "Disk blocks and tree depth.",
            difficulty: "hard",
            category: "Storage Optimization",
            mastered: false
          },
          {
            id: "fc_ds_3",
            front: "What is the worst-case time complexity of QuickSort and how can it be mitigated?",
            back: "Worst-case is O(n^2) when poor pivots are chosen (e.g. sorted input). Mitigated by Randomized Pivot selection or Median-of-Three partitioning.",
            hint: "Pivot selection strategy.",
            difficulty: "medium",
            category: "Sorting Theory",
            mastered: true
          }
        ]
      }
    ];

    // 13. Seed Lecture Videos and Study Pictures (Admin Uploads with Reactions, Comments, Private/Global Visibility)
    this.lectureMedia = [
      {
        id: "lec_1",
        title: "Algorithm Design: Graph Theory & Shortest Path",
        description: "In this comprehensive lecture session, we explore single-source shortest path algorithms, priority queues, and time complexity bounds in dense vs sparse networks.",
        mediaType: "video",
        mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop",
        uploaderId: "user_admin_hassan",
        uploaderName: "Hassan Raza",
        uploaderRole: "Admin",
        uploaderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        instituteId: "inst_mit",
        instituteName: "MIT School of Engineering",
        visibility: "global",
        subject: "Computer Science",
        topic: "Graph Algorithms & Dijkstra",
        courseLevel: "Intermediate",
        durationMinutes: 42,
        tags: ["Algorithms", "Graphs", "Dijkstra", "Data Structures"],
        likesCount: 14,
        likedUserIds: ["user_student_jawad", "user_teacher_sarah", "user_student_ayesha"],
        reactions: [
          { userId: "user_student_jawad", userName: "Jawad Hassan", userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop", reactionType: "insightful", createdAt: "2026-09-24T10:15:00Z" },
          { userId: "user_teacher_sarah", userName: "Dr. Sarah Khan", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop", reactionType: "applause", createdAt: "2026-09-24T11:20:00Z" },
          { userId: "user_student_ayesha", userName: "Ayesha Noor", userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop", reactionType: "love", createdAt: "2026-09-24T12:05:00Z" },
          { userId: "user_student_bilal", userName: "Bilal Ahmed", userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop", reactionType: "like", createdAt: "2026-09-24T14:30:00Z" }
        ],
        comments: [
          {
            id: "comm_1_1",
            userId: "user_student_jawad",
            userName: "Jawad Hassan",
            userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
            userRole: "Student",
            text: "The proof on min-heap relaxation time complexity O((V+E)logV) was exceptionally clear! Thank you Admin Hassan for posting this.",
            createdAt: "2026-09-24T10:30:00Z"
          },
          {
            id: "comm_1_2",
            userId: "user_teacher_sarah",
            userName: "Dr. Sarah Khan",
            userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
            userRole: "Teacher",
            text: "Excellent study material for our semester midterm students. Highly recommended watching before problem set 4.",
            createdAt: "2026-09-24T11:45:00Z"
          }
        ],
        sharesCount: 8,
        createdAt: "2026-09-24T09:00:00Z",
        updatedAt: "2026-09-24T09:00:00Z"
      },
      {
        id: "lec_2",
        title: "Quantum Mechanics: Wavefunctions & Hilbert Space (Study Infographic)",
        description: "High-resolution conceptual infographic breaking down Hilbert spaces, wave function collapse, and Dirac bra-ket notation for upcoming physics exams.",
        mediaType: "picture",
        mediaUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop",
        uploaderId: "user_admin_stanford",
        uploaderName: "Dr. Robert Chen",
        uploaderRole: "Admin",
        uploaderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop",
        instituteId: "inst_stanford",
        instituteName: "Stanford Academic Institute",
        visibility: "private",
        subject: "Physics",
        topic: "Quantum Eigenstates & Uncertainty",
        courseLevel: "Advanced",
        tags: ["Quantum Physics", "Schrödinger", "Infographic", "Mechanics"],
        likesCount: 19,
        likedUserIds: ["user_student_jawad", "user_admin_hassan"],
        reactions: [
          { userId: "user_student_jawad", userName: "Jawad Hassan", userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop", reactionType: "mindblown", createdAt: "2026-09-25T08:10:00Z" },
          { userId: "user_admin_hassan", userName: "Hassan Raza", userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop", reactionType: "insightful", createdAt: "2026-09-25T09:20:00Z" }
        ],
        comments: [
          {
            id: "comm_2_1",
            userId: "user_student_jawad",
            userName: "Jawad Hassan",
            userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
            userRole: "Student",
            text: "This visual diagram connects matrix mechanics and wave mechanics so smoothly.",
            createdAt: "2026-09-25T08:45:00Z"
          }
        ],
        sharesCount: 12,
        createdAt: "2026-09-25T07:30:00Z",
        updatedAt: "2026-09-25T07:30:00Z"
      },
      {
        id: "lec_3",
        title: "Multivariable Calculus: Vector Fields & Green's Theorem Explained",
        description: "Step-by-step lecture walkthrough on conservative vector fields, curl, line integrals, and 2D flux theorem with geometric visual proof.",
        mediaType: "video",
        mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop",
        uploaderId: "user_superadmin",
        uploaderName: "Main Admin",
        uploaderRole: "Super Admin",
        uploaderAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop",
        instituteId: "inst_mit",
        instituteName: "MIT School of Engineering",
        visibility: "global",
        subject: "Mathematics",
        topic: "Vector Calculus & Circulation",
        courseLevel: "Undergraduate",
        durationMinutes: 38,
        tags: ["Calculus", "Green's Theorem", "Line Integrals", "Math"],
        likesCount: 22,
        likedUserIds: ["user_student_jawad", "user_teacher_sarah"],
        reactions: [
          { userId: "user_student_jawad", userName: "Jawad Hassan", userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop", reactionType: "applause", createdAt: "2026-09-26T14:10:00Z" },
          { userId: "user_teacher_sarah", userName: "Dr. Sarah Khan", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop", reactionType: "insightful", createdAt: "2026-09-26T15:00:00Z" }
        ],
        comments: [
          {
            id: "comm_3_1",
            userId: "user_student_jawad",
            userName: "Jawad Hassan",
            userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
            userRole: "Student",
            text: "The 3D boundary circulation visualization solved my confusion about counter-clockwise orientation.",
            createdAt: "2026-09-26T14:30:00Z"
          }
        ],
        sharesCount: 15,
        createdAt: "2026-09-26T13:00:00Z",
        updatedAt: "2026-09-26T13:00:00Z"
      },
      {
        id: "lec_4",
        title: "Distributed Systems: Raft Consensus & State Machine Replication",
        description: "Detailed study diagram and architectural roadmap illustrating leader election phases, log replication invariants, and split-brain safety proofs.",
        mediaType: "picture",
        mediaUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop",
        uploaderId: "user_admin_hassan",
        uploaderName: "Hassan Raza",
        uploaderRole: "Admin",
        uploaderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        instituteId: "inst_mit",
        instituteName: "MIT School of Engineering",
        visibility: "global",
        subject: "Computer Science",
        topic: "Consensus Algorithms",
        courseLevel: "Advanced",
        tags: ["Distributed Systems", "Raft", "Consensus", "Architecture"],
        likesCount: 31,
        likedUserIds: ["user_student_jawad"],
        reactions: [
          { userId: "user_student_jawad", userName: "Jawad Hassan", userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop", reactionType: "mindblown", createdAt: "2026-09-27T10:00:00Z" }
        ],
        comments: [],
        sharesCount: 11,
        createdAt: "2026-09-27T09:30:00Z",
        updatedAt: "2026-09-27T09:30:00Z"
      }
    ];

    // 14. Seed Activity & Security Audit Logs
    this.activityLogs = [
      { id: "log_1", userId: "user_superadmin", userName: "Main Admin", userRole: "Super Admin", action: "System Configuration", details: "Updated AI Assistant system instructions and allowed models", ipAddress: "192.168.1.10", timestamp: "2026-09-23T20:30:00Z" },
      { id: "log_2", userId: "user_admin_hassan", userName: "Hassan Raza", userRole: "Admin", action: "Book Upload", details: "Uploaded new textbook: University Physics 2025 Edition", ipAddress: "192.168.1.15", timestamp: "2026-09-23T18:40:00Z" },
      { id: "log_3", userId: "user_teacher_sarah", userName: "Dr. Sarah Khan", userRole: "Teacher", action: "Meeting Creation", details: "Scheduled Live Class: Computer Science Graph Algorithms", ipAddress: "192.168.1.22", timestamp: "2026-09-23T15:00:00Z" },
      { id: "log_4", userId: "user_student_jawad", userName: "Jawad Hassan", userRole: "Student", action: "User Login", details: "Successful authentication via Web Portal", ipAddress: "192.168.1.45", timestamp: "2026-09-23T22:15:00Z" },
      { id: "log_5", userId: "system", userName: "Auth Guard", userRole: "System", action: "Failed Login Attempt", details: "Invalid credentials recorded for account test_guest@mail.com", ipAddress: "10.0.0.99", timestamp: "2026-09-23T12:04:00Z" }
    ];
  }

  // Database helper methods
  logAction(userId: string, userName: string, userRole: string, action: string, details: string, ip: string = "127.0.0.1") {
    const entry: ActivityLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId,
      userName,
      userRole,
      action,
      details,
      ipAddress: ip,
      timestamp: new Date().toISOString()
    };
    this.activityLogs.unshift(entry);
    if (this.activityLogs.length > 500) this.activityLogs.pop();
  }
}

export const db = new Database();

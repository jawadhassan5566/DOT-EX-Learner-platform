/**
 * Dot X Library - API Client Service
 */
import { Flashcard, FlashcardDeck, Quiz, QuizQuestion, QuizAttempt, LectureMedia, LectureReaction, LectureComment } from '../types/index.js';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('dotx_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('dotx_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('dotx_token');
}

export function getSelectedInstituteId(): string | null {
  return localStorage.getItem('dotx_selected_institute_id') || 'inst_dotx';
}

export function setSelectedInstituteId(id: string | null): void {
  if (id) {
    localStorage.setItem('dotx_selected_institute_id', id);
  } else {
    localStorage.removeItem('dotx_selected_institute_id');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const selectedInstitute = getSelectedInstituteId();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (selectedInstitute && !headers.has('X-Institute-Id')) {
    headers.set('X-Institute-Id', selectedInstitute);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || response.statusText || 'An unexpected error occurred.';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { emailOrUsername: string; password: string }) =>
    request<{ success: boolean; token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  adminLogin: (credentials: { emailOrUsername: string; password: string }) =>
    request<{ success: boolean; token: string; user: any; message: string }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  signup: (userData: any) =>
    request<{ success: boolean; token: string; user: any; message: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () =>
    request<{ success: boolean; user: any }>('/auth/me'),

  getUserPublicProfile: (userId: string) =>
    request<{ success: boolean; user: any }>(`/auth/profile/${userId}`),

  updateProfile: (profileData: any) =>
    request<{ success: boolean; user: any; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; simulatedOtp?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    }),

  resetPassword: (data: { email: string; newPassword: string; otp?: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),

  // Books
  getBooks: (params: { search?: string; category?: string; sort?: string; featured?: boolean; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.sort) query.set('sort', params.sort);
    if (params.featured) query.set('featured', 'true');
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return request<{ success: boolean; total: number; page: number; pageSize: number; books: any[] }>(`/books?${query.toString()}`);
  },

  getBookDetails: (id: string) =>
    request<{ success: boolean; book: any; related: any[]; userBookmark: any; userReading: any }>(`/books/${id}`),

  readBookOnline: (id: string) =>
    request<{ success: boolean; bookId: string; title: string; author: string; totalPages: number; downloadAllowed: boolean; contentPages: any[] }>(`/books/${id}/read`),

  downloadBook: (id: string) =>
    request<{ success: boolean; message: string; downloadUrl: string; filename: string; fileSize: string }>(`/books/${id}/download`),

  toggleBookmark: (bookId: string, pageNumber: number = 1, note: string = '') =>
    request<{ success: boolean; isBookmarked: boolean; bookmark?: any; message: string }>(`/books/${bookId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({ pageNumber, note })
    }),

  saveReadingProgress: (bookId: string, pageNumber: number, totalPages?: number) =>
    request<{ success: boolean; progress: any }>(`/books/${bookId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ pageNumber, totalPages })
    }),

  createBook: (bookData: any) =>
    request<{ success: boolean; book: any; message: string }>('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    }),

  updateBook: (id: string, bookData: any) =>
    request<{ success: boolean; book: any; message: string }>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData)
    }),

  deleteBook: (id: string) =>
    request<{ success: boolean; message: string }>(`/books/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () =>
    request<{ success: boolean; categories: any[] }>('/categories'),

  createCategory: (data: any) =>
    request<{ success: boolean; category: any; message: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCategory: (id: string, data: any) =>
    request<{ success: boolean; category: any; message: string }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCategory: (id: string) =>
    request<{ success: boolean; message: string }>(`/categories/${id}`, { method: 'DELETE' }),

  // Meetings
  getMeetings: (params: { status?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    return request<{ success: boolean; meetings: any[] }>(`/meetings?${query.toString()}`);
  },

  getMeetingDetails: (id: string) =>
    request<{ success: boolean; meeting: any; messages: any[]; whiteboardData: string | null; activeScreenShare?: any }>(`/meetings/${id}`),

  getMeetingByCode: (code: string) =>
    request<{ success: boolean; meeting: any; messages: any[]; whiteboardData: string | null; activeScreenShare?: any }>(`/meetings/code/${encodeURIComponent(code)}`),

  joinMeeting: (id: string) =>
    request<{ success: boolean; meeting: any; message: string }>(`/meetings/${id}/join`, { method: 'POST' }),

  sendMeetingMessage: (meetingId: string, text: string) =>
    request<{ success: boolean; message: any }>(`/meetings/${meetingId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  syncWhiteboard: (meetingId: string, canvasData: string, isOpen?: boolean) =>
    request<{ success: boolean; message: string; isWhiteboardOpen?: boolean }>(`/meetings/${meetingId}/whiteboard`, {
      method: 'POST',
      body: JSON.stringify({ canvasData, isOpen })
    }),

  meetingHostControl: (meetingId: string, action: string, value?: any) =>
    request<{ success: boolean; meeting: any; message: string }>(`/meetings/${meetingId}/host-control`, {
      method: 'POST',
      body: JSON.stringify({ action, value })
    }),

  createMeeting: (data: any) =>
    request<{ success: boolean; meeting: any; shareLink?: string; message: string }>('/meetings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteMeeting: (id: string) =>
    request<{ success: boolean; message: string }>(`/meetings/${id}`, { method: 'DELETE' }),

  getMeetingAttendance: (params: { meetingId?: string; status?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.meetingId) query.set('meetingId', params.meetingId);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return request<{ success: boolean; attendance: any[]; total: number }>(`/meetings/attendance?${query.toString()}`);
  },

  // Chat
  getConversations: () =>
    request<{ success: boolean; conversations: any[] }>('/chat/conversations'),

  getChatMessages: (conversationId: string) =>
    request<{ success: boolean; conversation: any; messages: any[] }>(`/chat/conversations/${conversationId}/messages`),

  sendChatMessage: (conversationId: string, text: string, attachmentUrl?: string) =>
    request<{ success: boolean; message: any }>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, attachmentUrl })
    }),

  startConversation: (targetUserId: string) =>
    request<{ success: boolean; conversation: any }>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    }),

  // AI Assistant
  getAiConversations: () =>
    request<{ success: boolean; conversations: any[] }>('/ai/conversations'),

  getAiMessages: (conversationId: string) =>
    request<{ success: boolean; conversation: any; messages: any[] }>(`/ai/conversations/${conversationId}/messages`),

  createAiConversation: (title?: string, subject?: string) =>
    request<{ success: boolean; conversation: any }>('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, subject })
    }),

  deleteAiConversation: (id: string) =>
    request<{ success: boolean; message: string }>(`/ai/conversations/${id}`, { method: 'DELETE' }),

  askAiQuestion: (data: { 
    conversationId?: string; 
    question: string; 
    subject?: string; 
    model?: string; 
    rolePrompt?: string; 
    useSearchGrounding?: boolean;
    image?: {
      data: string;
      mimeType: string;
    };
  }) =>
    request<{ 
      success: boolean; 
      conversationId: string; 
      userMessage: any; 
      assistantMessage: any; 
      modelUsed: string; 
      searchSources?: { title: string; uri: string }[] 
    }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  transcribeAudio: (data: { audioBase64: string; mimeType?: string }) =>
    request<{ success: boolean; transcript: string; modelUsed: string }>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  createLiveVoiceSession: (data: { topic?: string; voice?: string } = {}) =>
    request<{ success: boolean; sessionId: string; model: string; voice: string; systemInstruction: string; status: string }>('/ai/live-session', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  sendLiveVoiceTurn: (data: {
    sessionId?: string;
    userText?: string;
    audioBase64?: string;
    mimeType?: string;
    voice?: string;
  }) =>
    request<{
      success: boolean;
      sessionId: string;
      modelUsed: string;
      userText: string;
      replyText: string;
      voice: string;
    }>('/ai/live-turn', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  generateMusic: (data: {
    prompt: string;
    mode?: 'clip' | 'pro';
    durationSeconds?: number;
    imageBase64?: string;
  }) =>
    request<{
      success: boolean;
      modelUsed: string;
      mode: string;
      prompt: string;
      audioBase64: string;
      mimeType: string;
      lyrics: string;
      fallbackGenerated?: boolean;
    }>('/ai/generate-music', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // AI Flashcards Generator
  generateFlashcards: (data: {
    bookId: string;
    chapterTitle?: string;
    chapterIndex?: number;
    chapterContent?: string;
    focusArea?: string;
    count?: number;
  }) =>
    request<{
      success: boolean;
      deck: FlashcardDeck;
      flashcards: Flashcard[];
      count: number;
      modelUsed: string;
      message: string;
    }>('/ai/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getFlashcardDecks: (bookId?: string) => {
    const query = bookId ? `?bookId=${encodeURIComponent(bookId)}` : '';
    return request<{ success: boolean; decks: FlashcardDeck[] }>(`/ai/flashcards/decks${query}`);
  },

  updateFlashcardProgress: (deckId: string, data: { cardId?: string; mastered?: boolean; reset?: boolean }) =>
    request<{ success: boolean; deck: FlashcardDeck; masteryPercentage: number; message: string }>(`/ai/flashcards/decks/${deckId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteFlashcardDeck: (deckId: string) =>
    request<{ success: boolean; message: string }>(`/ai/flashcards/decks/${deckId}`, {
      method: 'DELETE'
    }),

  // AI Quiz Generator & Scoring System
  generateQuiz: (data: {
    bookId: string;
    chapterTitle?: string;
    chapterIndex?: number;
    chapterContent?: string;
    focusArea?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) =>
    request<{
      success: boolean;
      quiz: Quiz;
      questions: QuizQuestion[];
      totalQuestions: number;
      modelUsed: string;
      message: string;
    }>('/ai/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  submitQuiz: (data: {
    quizId: string;
    bookId: string;
    chapterTitle: string;
    chapterIndex?: number;
    answers: Record<string, number>;
    timeSpentSeconds: number;
    questions?: QuizQuestion[];
    bookTitle?: string;
  }) =>
    request<{
      success: boolean;
      attempt: QuizAttempt;
      message: string;
    }>('/ai/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getQuizHistory: (bookId?: string) => {
    const query = bookId ? `?bookId=${encodeURIComponent(bookId)}` : '';
    return request<{ success: boolean; attempts: QuizAttempt[] }>(`/ai/quiz/history${query}`);
  },

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; notifications: any[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/notifications/read-all', { method: 'POST' }),

  createNotification: (data: any) =>
    request<{ success: boolean; notification: any; message: string }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteNotification: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}`, { method: 'DELETE' }),

  // Contact / Support
  submitContact: (data: any) =>
    request<{
      success: boolean;
      message: string;
      ticketId: string;
      delivery?: {
        recipientEmail: string;
        recipientName: string;
        instituteId: string;
        instituteName: string;
        forwardedAt: string;
      };
    }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getContactMessages: (params: { status?: string; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.type) query.set('type', params.type);
    return request<{ success: boolean; messages: any[] }>(`/contact?${query.toString()}`);
  },

  updateContactMessage: (id: string, data: { status?: string; adminResponse?: string }) =>
    request<{ success: boolean; ticket: any; message: string }>(`/contact/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Admin
  getDashboardStats: () =>
    request<{ success: boolean; stats: any; monthlyUsage: any[]; categoryStats: any[]; recentActivity: any[] }>('/admin/dashboard-stats'),

  getAdminUsers: (params: { search?: string; role?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    return request<{ success: boolean; users: any[] }>(`/admin/users?${query.toString()}`);
  },

  updateUserStatus: (id: string, status: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdmins: () =>
    request<{ success: boolean; admins: any[] }>('/admin/admins'),

  createAdmin: (adminData: any) =>
    request<{ success: boolean; admin: any; message: string }>('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData)
    }),

  createMainAdmin: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    department?: string;
    instituteId: string;
  }) =>
    request<{ success: boolean; mainAdmin: any; institute: any; message: string }>('/admin/main-admins', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSubAdmins: (instituteId?: string) => {
    const query = instituteId ? `?instituteId=${encodeURIComponent(instituteId)}` : '';
    return request<{
      success: boolean;
      subAdmins: any[];
      count: number;
      maxLimit: number;
      remaining: number;
      canCreate: boolean;
    }>(`/admin/sub-admins${query}`);
  },

  createSubAdmin: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    department?: string;
    instituteId?: string;
  }) =>
    request<{
      success: boolean;
      subAdmin: any;
      count: number;
      maxLimit: number;
      remaining: number;
      message: string;
    }>('/admin/sub-admins', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteSubAdmin: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/sub-admins/${id}`, {
      method: 'DELETE'
    }),

  updateAdminRole: (id: string, roleId: string) =>
    request<{ success: boolean; message: string }>(`/admin/admins/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId })
    }),

  getRolesAndPermissions: () =>
    request<{ success: boolean; roles: any[]; permissions: any[] }>('/admin/roles-permissions'),

  updateRolePermissions: (roleId: string, permissions: string[]) =>
    request<{ success: boolean; role: any; message: string }>(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    }),

  getActivityLogs: (params: { search?: string; action?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.action) query.set('action', params.action);
    return request<{ success: boolean; logs: any[] }>(`/admin/logs?${query.toString()}`);
  },

  getSystemSettings: () =>
    request<{ success: boolean; settings: any }>('/admin/settings'),

  updateSystemSettings: (settings: any) =>
    request<{ success: boolean; settings: any; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  // AI & Analytics & Helpdesk Admin
  getAiConfig: () =>
    request<{ success: boolean; config: any }>('/admin/ai/config'),

  updateAiConfig: (config: any) =>
    request<{ success: boolean; config: any; message: string }>('/admin/ai/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    }),

  getContactTickets: (type?: string, status?: string) => {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (status) query.set('status', status);
    return request<{ success: boolean; tickets: any[] }>(`/admin/contact?${query.toString()}`);
  },

  respondContactTicket: (id: string, response: string, status?: string) =>
    request<{ success: boolean; ticket: any; message: string }>(`/admin/contact/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, status })
    }),

  broadcastNotification: (data: { title: string; message: string; type: string; targetAudience?: string }) =>
    request<{ success: boolean; notification: any; message: string }>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSecurityLogs: (search?: string) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    return request<{ success: boolean; logs: any[] }>(`/admin/logs?${query.toString()}`);
  },

  // Institutes & Organizations (Multi-Tenant Isolation)
  getInstitutes: () =>
    request<{ success: boolean; institutes: any[] }>('/institutes'),

  getInstitute: (id: string) =>
    request<{ success: boolean; institute: any }>(`/institutes/${id}`),

  getAdminInstitutes: () =>
    request<{ success: boolean; institutes: any[] }>('/admin/institutes/admin/list'),

  createInstitute: (data: any) =>
    request<{ success: boolean; institute: any; message: string }>('/admin/institutes/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateInstitute: (id: string, data: any) =>
    request<{ success: boolean; institute: any; message: string }>(`/admin/institutes/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteInstitute: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/institutes/admin/${id}`, {
      method: 'DELETE'
    }),

  // Student Reading Goals & Target Tracking
  getReadingGoal: () =>
    request<{
      success: boolean;
      goal: any;
      progressPercent: number;
      completedBooks: any[];
      activeReading: any[];
    }>('/reading-goals'),

  setReadingGoal: (data: { frequency?: 'daily' | 'weekly'; targetCount?: number; targetPages?: number; reminderEnabled?: boolean }) =>
    request<{
      success: boolean;
      goal: any;
      message: string;
    }>('/reading-goals', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  completeGoalBook: (data: { bookId: string; bookTitle?: string }) =>
    request<{
      success: boolean;
      goal: any;
      achieved: boolean;
      newlyUnlocked?: any[];
      stats?: any;
      badges?: any[];
      message: string;
      streakMessage?: string;
    }>('/reading-goals/complete-book', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  restoreStreak: () =>
    request<{
      success: boolean;
      goal: any;
      message: string;
    }>('/reading-goals/restore-streak', {
      method: 'POST'
    }),

  simulateStreakTime: (hoursToAdd: number, resetTime?: boolean) =>
    request<{
      success: boolean;
      goal: any;
      simulatedOffsetHours?: number;
      evalResult?: any;
      message: string;
    }>('/reading-goals/simulate-time', {
      method: 'POST',
      body: JSON.stringify({ hoursToAdd, resetTime })
    }),

  // Badges & Virtual Achievements
  getBadges: () =>
    request<{
      success: boolean;
      badges: any[];
      stats: any;
      newlyUnlocked: any[];
    }>('/reading-goals/badges'),

  claimBadges: () =>
    request<{
      success: boolean;
      claimedCount: number;
      newlyUnlocked: any[];
      badges: any[];
      stats: any;
      message: string;
    }>('/reading-goals/badges/claim', {
      method: 'POST'
    }),

  // Study Lectures & Media
  getLectures: (params: { search?: string; mediaType?: string; subject?: string; visibility?: string; instituteId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.mediaType) query.set('mediaType', params.mediaType);
    if (params.subject) query.set('subject', params.subject);
    if (params.visibility) query.set('visibility', params.visibility);
    if (params.instituteId) query.set('instituteId', params.instituteId);
    return request<{ success: boolean; count: number; lectures: LectureMedia[] }>(`/lectures?${query.toString()}`);
  },

  getLecture: (id: string) =>
    request<{ success: boolean; lecture: LectureMedia }>(`/lectures/${id}`),

  createLecture: (data: {
    title: string;
    description: string;
    mediaType: 'video' | 'picture';
    mediaUrl: string;
    thumbnailUrl?: string;
    visibility: 'private' | 'global';
    subject: string;
    topic?: string;
    courseLevel?: string;
    durationMinutes?: number;
    tags?: string[];
    instituteId?: string;
  }) =>
    request<{ success: boolean; lecture: LectureMedia; message: string }>('/lectures', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateLecture: (id: string, data: Partial<LectureMedia>) =>
    request<{ success: boolean; lecture: LectureMedia; message: string }>(`/lectures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteLecture: (id: string) =>
    request<{ success: boolean; message: string }>(`/lectures/${id}`, {
      method: 'DELETE'
    }),

  likeLecture: (id: string) =>
    request<{ success: boolean; isLiked: boolean; likesCount: number; likedUserIds: string[] }>(`/lectures/${id}/like`, {
      method: 'POST'
    }),

  reactToLecture: (id: string, reactionType: string) =>
    request<{ success: boolean; reactions: LectureReaction[]; userReaction: string | null; message: string }>(`/lectures/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType })
    }),

  commentOnLecture: (id: string, text: string) =>
    request<{ success: boolean; comment: LectureComment; commentsCount: number; comments: LectureComment[] }>(`/lectures/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  shareLecture: (id: string) =>
    request<{ success: boolean; sharesCount: number; shareUrl: string; message: string }>(`/lectures/${id}/share`, {
      method: 'POST'
    }),
};

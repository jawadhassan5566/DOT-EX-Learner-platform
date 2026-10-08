import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from './firebase.js';

export interface FirestoreBookmark {
  id?: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  note?: string;
  createdAt?: any;
}

export interface FirestoreReadingProgress {
  bookId: string;
  pageNumber: number;
  totalPages: number;
  updatedAt?: any;
}

export interface FirestoreLiveSession {
  id?: string;
  userId: string;
  userEmail?: string;
  title: string;
  transcriptCount: number;
  durationSeconds: number;
  createdAt?: any;
}

export interface FirestoreTranscription {
  id?: string;
  userId: string;
  title: string;
  text: string;
  audioDurationSeconds?: number;
  modelUsed: string;
  createdAt?: any;
}

export interface FirestoreGeneratedMusic {
  id?: string;
  userId: string;
  prompt: string;
  mode: 'clip' | 'pro';
  modelUsed: string;
  audioBase64?: string;
  mimeType: string;
  lyrics?: string;
  createdAt?: any;
}

export interface FirestoreMeeting {
  id?: string;
  title: string;
  description: string;
  category: string;
  hostId: string;
  hostName: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  meetCode: string;
  shareLink?: string;
  allowChat?: boolean;
  allowWhiteboard?: boolean;
  allowScreenShare?: boolean;
  participantsCount: number;
  maxParticipants: number;
  createdAt?: any;
}

export interface DirectParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export interface DirectConversation {
  id: string;
  participantIds: string[];
  participants: DirectParticipant[];
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimestamp?: number;
  lastSenderId: string;
  unreadCount?: number;
  jobContext?: {
    jobId?: string;
    jobTitle?: string;
    companyOrInstitute?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface DirectMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  text: string;
  createdAt?: any;
  timestamp?: number;
  read?: boolean;
}

export const getConversationId = (userIdA: string, userIdB: string): string => {
  const cleanA = String(userIdA || 'user_a').trim();
  const cleanB = String(userIdB || 'user_b').trim();
  const sorted = [cleanA, cleanB].sort();
  return `conv_${sorted[0]}___${sorted[1]}`;
};

export const firestoreService = {
  // --- Meetings Management & Persistence ---
  async createMeeting(meeting: Omit<FirestoreMeeting, 'id' | 'createdAt'>) {
    const colRef = collection(db, 'meetings');
    const docRef = await addDoc(colRef, {
      ...meeting,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getMeetings(): Promise<FirestoreMeeting[]> {
    try {
      const colRef = collection(db, 'meetings');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreMeeting));
    } catch {
      return [];
    }
  },

  // --- Bookmarks Persistence ---
  async saveBookmark(userId: string, bookmark: Omit<FirestoreBookmark, 'id' | 'createdAt'>) {
    const colRef = collection(db, 'users', userId, 'bookmarks');
    const docRef = await addDoc(colRef, {
      ...bookmark,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserBookmarks(userId: string): Promise<FirestoreBookmark[]> {
    try {
      const colRef = collection(db, 'users', userId, 'bookmarks');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBookmark));
    } catch {
      // Fallback query without index ordering if needed
      const colRef = collection(db, 'users', userId, 'bookmarks');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBookmark));
    }
  },

  async removeBookmark(userId: string, bookmarkId: string) {
    const docRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
    await deleteDoc(docRef);
  },

  // --- Reading Progress Persistence ---
  async updateReadingProgress(userId: string, progress: FirestoreReadingProgress) {
    const docRef = doc(db, 'users', userId, 'reading_history', progress.bookId);
    await setDoc(docRef, {
      ...progress,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  async getReadingProgress(userId: string, bookId: string): Promise<FirestoreReadingProgress | null> {
    const docRef = doc(db, 'users', userId, 'reading_history', bookId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as FirestoreReadingProgress;
    }
    return null;
  },

  // --- Reading Goals Persistence ---
  async saveReadingGoal(userId: string, goal: any) {
    const docRef = doc(db, 'users', userId, 'reading_goals', 'active');
    await setDoc(docRef, {
      ...goal,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return 'active';
  },

  async getUserReadingGoal(userId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'users', userId, 'reading_goals', 'active');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch {
      return null;
    }
  },

  // --- Badges & Achievements Persistence ---
  async saveUserBadge(userId: string, badge: any) {
    const docRef = doc(db, 'users', userId, 'badges', badge.code || badge.id);
    await setDoc(docRef, {
      ...badge,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return badge.code;
  },

  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const colRef = collection(db, 'users', userId, 'badges');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },

  // --- Transcriptions Persistence ---
  async saveTranscription(transcription: Omit<FirestoreTranscription, 'id' | 'createdAt'>) {
    const colRef = collection(db, 'transcriptions');
    const docRef = await addDoc(colRef, {
      ...transcription,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserTranscriptions(userId: string): Promise<FirestoreTranscription[]> {
    try {
      const colRef = collection(db, 'transcriptions');
      const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreTranscription));
    } catch {
      const colRef = collection(db, 'transcriptions');
      const snap = await getDocs(colRef);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as FirestoreTranscription))
        .filter(t => t.userId === userId);
    }
  },

  // --- Voice / Live API Sessions Persistence ---
  async saveVoiceSession(session: Omit<FirestoreLiveSession, 'id' | 'createdAt'>) {
    const colRef = collection(db, 'voice_sessions');
    const docRef = await addDoc(colRef, {
      ...session,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserVoiceSessions(userId: string): Promise<FirestoreLiveSession[]> {
    try {
      const colRef = collection(db, 'voice_sessions');
      const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreLiveSession));
    } catch {
      const colRef = collection(db, 'voice_sessions');
      const snap = await getDocs(colRef);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as FirestoreLiveSession))
        .filter(s => s.userId === userId);
    }
  },

  // --- Lyria Generated Music Persistence ---
  async saveGeneratedMusic(music: Omit<FirestoreGeneratedMusic, 'id' | 'createdAt'>) {
    const colRef = collection(db, 'generated_music');
    const docRef = await addDoc(colRef, {
      ...music,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserGeneratedMusic(userId: string): Promise<FirestoreGeneratedMusic[]> {
    try {
      const colRef = collection(db, 'generated_music');
      const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGeneratedMusic));
    } catch {
      const colRef = collection(db, 'generated_music');
      const snap = await getDocs(colRef);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as FirestoreGeneratedMusic))
        .filter(m => m.userId === userId);
    }
  },

  // --- User Profiles Persistence in Firestore ---
  async saveUserProfile(user: any) {
    if (!user || !user.id) return;
    try {
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department || 'General',
        instituteId: user.instituteId || '',
        instituteName: user.instituteName || '',
        rollNumber: user.rollNumber || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        status: user.status || 'active',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveUserProfile non-fatal:", err);
    }
  },

  async getUserProfile(userId: string): Promise<any | null> {
    if (!userId) return null;
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.warn("Firestore getUserProfile fallback:", err);
      return null;
    }
  },

  // --- Institutes & Organizations Persistence in Firestore ---
  async saveInstitute(inst: any) {
    if (!inst || !inst.id) return;
    try {
      const docRef = doc(db, 'institutes', inst.id);
      await setDoc(docRef, {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        slug: inst.slug || inst.code?.toLowerCase(),
        description: inst.description || '',
        logo: inst.logo || '',
        adminId: inst.adminId || '',
        adminName: inst.adminName || '',
        adminEmail: inst.adminEmail || '',
        status: inst.status || 'active',
        address: inst.address || '',
        website: inst.website || '',
        allowRegistration: inst.allowRegistration !== false,
        createdAt: inst.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return inst.id;
    } catch (err) {
      console.warn("Firestore saveInstitute non-fatal:", err);
      return inst.id;
    }
  },

  async getInstitutes(): Promise<any[]> {
    try {
      const colRef = collection(db, 'institutes');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore getInstitutes non-fatal:", err);
      return [];
    }
  },

  // --- Announcements Persistence in Firestore ---
  async saveAnnouncement(announcement: any) {
    if (!announcement) return;
    try {
      const id = announcement.id || `notif_${Date.now()}`;
      const docRef = doc(db, 'announcements', id);
      await setDoc(docRef, {
        id,
        title: announcement.title,
        message: announcement.message,
        type: announcement.type || 'announcement',
        targetGroup: announcement.targetGroup || announcement.targetAudience || 'all',
        visibility: announcement.visibility || (announcement.instituteId ? 'institute' : 'global'),
        isGlobal: announcement.visibility === 'global' || announcement.isGlobal === true,
        instituteId: announcement.instituteId || '',
        instituteName: announcement.instituteName || '',
        createdAt: announcement.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return id;
    } catch (err) {
      console.warn("Firestore saveAnnouncement non-fatal:", err);
    }
  },

  async getAnnouncements(instituteId?: string): Promise<any[]> {
    try {
      const colRef = collection(db, 'announcements');
      const snap = await getDocs(colRef);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (instituteId && instituteId !== 'all') {
        // Option 2: Show Global notices to all; Option 1: Only show to matching institute students
        list = list.filter((a: any) => a.visibility === 'global' || a.isGlobal || !a.instituteId || a.instituteId === 'all' || a.instituteId === instituteId);
      }
      return list;
    } catch (err) {
      console.warn("Firestore getAnnouncements non-fatal:", err);
      return [];
    }
  },

  // --- User Profile & Avatar Persistence in Firestore ---
  async updateUserProfile(userId: string, data: { name?: string; bio?: string; department?: string; avatar?: string; rollNumber?: string; instituteId?: string; instituteName?: string; notificationTune?: string }) {
    if (!userId) return;
    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore updateUserProfile non-fatal:", err);
    }
  },

  // --- Flashcards Decks Persistence in Firestore ---
  async saveFlashcardDeck(deck: any) {
    if (!deck || !deck.id) return;
    try {
      const docRef = doc(db, 'flashcard_decks', deck.id);
      await setDoc(docRef, {
        ...deck,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return deck.id;
    } catch (err) {
      console.warn("Firestore saveFlashcardDeck non-fatal:", err);
      return deck.id;
    }
  },

  async getFlashcardDecks(bookId?: string): Promise<any[]> {
    try {
      const colRef = collection(db, 'flashcard_decks');
      const snap = await getDocs(colRef);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (bookId) {
        list = list.filter((d: any) => d.bookId === bookId);
      }
      return list;
    } catch (err) {
      console.warn("Firestore getFlashcardDecks non-fatal:", err);
      return [];
    }
  },

  // --- Realtime Meeting Classroom Persistence ---
  async syncMeetingRecord(meetingData: any) {
    if (!meetingData) return;
    try {
      const docRef = doc(db, 'meetings', meetingData.meetCode || `meet_${Date.now()}`);
      await setDoc(docRef, {
        ...meetingData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return docRef.id;
    } catch (err) {
      console.warn("Firestore syncMeetingRecord non-fatal:", err);
    }
  },

  async saveMeetingMessage(meetingId: string, message: any) {
    if (!meetingId || !message) return;
    try {
      const msgId = message.id || `mm_${Date.now()}`;
      const docRef = doc(db, 'meetings', meetingId, 'messages', msgId);
      await setDoc(docRef, {
        ...message,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveMeetingMessage non-fatal:", err);
    }
  },

  async syncMeetingWhiteboard(meetingId: string, canvasData: string) {
    if (!meetingId) return;
    try {
      const docRef = doc(db, 'meetings', meetingId, 'whiteboard', 'canvas');
      await setDoc(docRef, {
        canvasData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore syncMeetingWhiteboard non-fatal:", err);
    }
  },

  // --- Lecture Videos & Study Pictures Persistence ---
  async syncLectureMedia(lecture: any) {
    if (!lecture || !lecture.id) return;
    try {
      const docRef = doc(db, 'lectures', lecture.id);
      await setDoc(docRef, {
        ...lecture,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return lecture.id;
    } catch (err) {
      console.warn("Firestore syncLectureMedia non-fatal:", err);
    }
  },

  async getLecturesFromFirestore(): Promise<any[]> {
    try {
      const colRef = collection(db, 'lectures');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore getLectures non-fatal:", err);
      return [];
    }
  },

  // --- AI Quiz Generator & Scoring Persistence ---
  async saveGeneratedQuiz(quiz: any) {
    if (!quiz || !quiz.id) return;
    try {
      const docRef = doc(db, 'quizzes', quiz.id);
      await setDoc(docRef, {
        ...quiz,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return quiz.id;
    } catch (err) {
      console.warn("Firestore saveGeneratedQuiz non-fatal:", err);
    }
  },

  async saveQuizAttempt(userId: string, attempt: any) {
    if (!userId || !attempt) return;
    try {
      const attemptId = attempt.id || `qa_${Date.now()}`;
      const docRef = doc(db, 'users', userId, 'quiz_attempts', attemptId);
      await setDoc(docRef, {
        ...attempt,
        userId,
        recordedAt: serverTimestamp()
      }, { merge: true });
      return attemptId;
    } catch (err) {
      console.warn("Firestore saveQuizAttempt non-fatal:", err);
    }
  },

  async getUserQuizAttempts(userId: string): Promise<any[]> {
    if (!userId) return [];
    try {
      const colRef = collection(db, 'users', userId, 'quiz_attempts');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore getUserQuizAttempts non-fatal:", err);
      return [];
    }
  },

  // --- Real-Time Private Direct Messaging (Firestore Conversations & Messages) ---
  async getOrCreateConversation(
    userA: DirectParticipant,
    userB: DirectParticipant,
    jobContext?: { jobId?: string; jobTitle?: string; companyOrInstitute?: string }
  ): Promise<DirectConversation> {
    const convId = getConversationId(userA.id, userB.id);
    const convRef = doc(db, 'conversations', convId);

    try {
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: convId,
          ...data,
          participantIds: data.participantIds || [userA.id, userB.id],
          participants: data.participants || [userA, userB],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          lastSenderId: data.lastSenderId || '',
          ...(jobContext ? { jobContext: { ...(data.jobContext || {}), ...jobContext } } : {})
        } as DirectConversation;
      }
    } catch (err) {
      console.warn("Firestore getDoc conversation error:", err);
    }

    const newConv: DirectConversation = {
      id: convId,
      participantIds: [userA.id, userB.id],
      participants: [
        {
          id: userA.id,
          name: userA.name || 'User',
          avatar: userA.avatar || '',
          role: userA.role || 'student',
          email: userA.email || ''
        },
        {
          id: userB.id,
          name: userB.name || 'Job Owner',
          avatar: userB.avatar || '',
          role: userB.role || 'faculty',
          email: userB.email || ''
        }
      ],
      lastMessage: 'Conversation started',
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastMessageTimestamp: Date.now(),
      lastSenderId: userA.id,
      unreadCount: 0,
      ...(jobContext ? { jobContext } : {})
    };

    try {
      await setDoc(convRef, {
        ...newConv,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore setDoc conversation error:", err);
    }

    return newConv;
  },

  async sendDirectMessage(params: {
    conversationId: string;
    sender: DirectParticipant;
    receiver: DirectParticipant;
    text: string;
    jobContext?: { jobId?: string; jobTitle?: string; companyOrInstitute?: string };
  }): Promise<string> {
    const { conversationId, sender, receiver, text, jobContext } = params;
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestamp = Date.now();

    // 1. Add document to Firestore 'messages' collection
    const messagesCol = collection(db, 'messages');
    let messageId = `msg_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const addedDoc = await addDoc(messagesCol, {
        conversationId,
        senderId: sender.id,
        senderName: sender.name,
        senderAvatar: sender.avatar || '',
        receiverId: receiver.id,
        receiverName: receiver.name,
        text,
        timestamp,
        read: false,
        createdAt: serverTimestamp()
      });
      messageId = addedDoc.id;
    } catch (err) {
      console.warn("Firestore addDoc message error:", err);
    }

    // 2. Update Firestore 'conversations' collection
    const convRef = doc(db, 'conversations', conversationId);
    try {
      await setDoc(convRef, {
        id: conversationId,
        participantIds: [sender.id, receiver.id],
        participants: [sender, receiver],
        lastMessage: text,
        lastMessageTime: timeFormatted,
        lastMessageTimestamp: timestamp,
        lastSenderId: sender.id,
        updatedAt: serverTimestamp(),
        ...(jobContext ? { jobContext } : {})
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore update conversation error:", err);
    }

    return messageId;
  },

  subscribeToUserConversations(
    userId: string,
    callback: (conversations: DirectConversation[]) => void
  ): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'conversations');
      const q = query(colRef, where('participantIds', 'array-contains', userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const convs = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              participantIds: data.participantIds || [],
              participants: data.participants || [],
              lastMessage: data.lastMessage || '',
              lastMessageTime: data.lastMessageTime || '',
              lastMessageTimestamp: data.lastMessageTimestamp || (data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()),
              lastSenderId: data.lastSenderId || ''
            } as DirectConversation;
          });

          convs.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
          callback(convs);
        },
        (error) => {
          console.warn("Firestore subscribeToUserConversations notice:", error);
          this.getUserConversations(userId).then(callback).catch(() => callback([]));
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Firestore subscribeToUserConversations error:", err);
      this.getUserConversations(userId).then(callback).catch(() => callback([]));
      return () => {};
    }
  },

  subscribeToConversationMessages(
    conversationId: string,
    callback: (messages: DirectMessage[]) => void
  ): () => void {
    if (!conversationId) {
      callback([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'messages');
      const q = query(colRef, where('conversationId', '==', conversationId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar || '',
              receiverId: data.receiverId,
              receiverName: data.receiverName || '',
              text: data.text || '',
              timestamp: data.timestamp || (data.createdAt?.toMillis ? data.createdAt.toMillis() : 0),
              createdAt: data.createdAt,
              read: data.read || false
            } as DirectMessage;
          });

          msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          callback(msgs);
        },
        (error) => {
          console.warn("Firestore subscribeToConversationMessages notice:", error);
          this.getConversationMessages(conversationId).then(callback).catch(() => callback([]));
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Firestore subscribeToConversationMessages error:", err);
      this.getConversationMessages(conversationId).then(callback).catch(() => callback([]));
      return () => {};
    }
  },

  async getUserConversations(userId: string): Promise<DirectConversation[]> {
    if (!userId) return [];
    try {
      const colRef = collection(db, 'conversations');
      const q = query(colRef, where('participantIds', 'array-contains', userId));
      const snap = await getDocs(q);
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectConversation));
      convs.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      return convs;
    } catch (err) {
      console.warn("Firestore getUserConversations notice:", err);
      return [];
    }
  },

  async getConversationMessages(conversationId: string): Promise<DirectMessage[]> {
    if (!conversationId) return [];
    try {
      const colRef = collection(db, 'messages');
      const q = query(colRef, where('conversationId', '==', conversationId));
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectMessage));
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      return msgs;
    } catch (err) {
      console.warn("Firestore getConversationMessages notice:", err);
      return [];
    }
  }
};

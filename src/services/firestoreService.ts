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
        avatar: user.avatar || '',
        status: user.status || 'active',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveUserProfile non-fatal:", err);
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
  }
};

/**
 * Dot X Library - Offline Storage Engine using Native IndexedDB
 * 
 * Manages client-side persistent storage for:
 * 1. Downloaded textbooks & publications (with complete offline chapter text, pages & metadata)
 * 2. Student study notes & annotations (offline creation, search, edit, and deletion)
 */

export interface OfflineBook {
  id: string;
  title: string;
  author: string;
  categoryId: string;
  categoryName: string;
  description: string;
  coverImage: string;
  fileUrl: string;
  fileSize: string;
  pages: number;
  downloadAllowed: boolean;
  rating: number;
  publishYear: number;
  publisher: string;
  contentPages: { page: number; title: string; content: string }[];
  downloadedAt: string;
  lastReadPage: number;
  notesCount?: number;
  isOfflineCached: boolean;
}

export type NoteColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';

export interface StudentNote {
  id: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  chapterTitle?: string;
  title: string;
  content: string;
  tags: string[];
  color: NoteColor;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'DotX_Offline_Vault_v1';
const DB_VERSION = 1;
const STORE_BOOKS = 'downloaded_books';
const STORE_NOTES = 'student_notes';

class OfflineDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported on this device/browser.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Books Store
        if (!db.objectStoreNames.contains(STORE_BOOKS)) {
          const bookStore = db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
          bookStore.createIndex('by_category', 'categoryName', { unique: false });
          bookStore.createIndex('by_downloadedAt', 'downloadedAt', { unique: false });
          bookStore.createIndex('by_title', 'title', { unique: false });
        }

        // 2. Notes Store
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          const noteStore = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
          noteStore.createIndex('by_bookId', 'bookId', { unique: false });
          noteStore.createIndex('by_page', ['bookId', 'pageNumber'], { unique: false });
          noteStore.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Auto-seed sample offline content if brand new user session
        try {
          const checkTx = db.transaction([STORE_BOOKS, STORE_NOTES], 'readwrite');
          const bookStore = checkTx.objectStore(STORE_BOOKS);
          const countReq = bookStore.count();
          countReq.onsuccess = () => {
            if (countReq.result === 0) {
              const seedBooks: OfflineBook[] = [
                {
                  id: 'book_algo',
                  title: 'Introduction to Algorithms & Data Structures',
                  author: 'Thomas H. Cormen, Charles E. Leiserson',
                  categoryId: 'cs',
                  categoryName: 'Computer Science',
                  description: 'The foundational textbook on algorithmic analysis, dynamic programming, graph algorithms, and asymptotic bounds.',
                  coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e37b29?w=600&auto=format&fit=crop&q=80',
                  fileUrl: '/downloads/book_algo.pdf',
                  fileSize: '14.2 MB',
                  pages: 120,
                  downloadAllowed: true,
                  rating: 4.9,
                  publishYear: 2024,
                  publisher: 'Dot X MIT Academic Press',
                  downloadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                  lastReadPage: 1,
                  isOfflineCached: true,
                  contentPages: [
                    {
                      page: 1,
                      title: 'Chapter 1: The Role of Algorithms in Computing',
                      content: '# Chapter 1: The Role of Algorithms in Computing\n\nAn algorithm is any well-defined computational procedure that takes some value, or set of values, as input and produces some value, or set of values, as output.\n\n## 1.1 Algorithms as a Technology\nSuppose computers were infinitely fast and computer memory was free. Would you have any reason to study algorithms? The answer is yes, if only because you would still want to demonstrate that your solution method terminates and does so with the correct answer.\n\n```python\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n```\n\nEfficiency matters because computers may be fast, but they are not infinitely fast. Memory may be inexpensive, but it is not free. Computing time is therefore a bounded resource, and so is space in memory.'
                    },
                    {
                      page: 2,
                      title: 'Chapter 2: Getting Started with Divide-and-Conquer',
                      content: '# Chapter 2: Getting Started with Divide-and-Conquer\n\nMany useful algorithms are recursive in structure: to solve a given problem, they call themselves recursively one or more times to deal with closely related subproblems.\n\n### Three Key Steps of Divide-and-Conquer\n1. **Divide** the problem into a number of subproblems that are smaller instances of the same problem.\n2. **Conquer** the subproblems by solving them recursively.\n3. **Combine** the solutions to the subproblems into the solution for the original problem.\n\n### Asymptotic Recurrence\nT(n) = 2T(n/2) + Theta(n)\nBy the Master Theorem, case 2 applies, yielding T(n) = Theta(n log n).'
                    },
                    {
                      page: 3,
                      title: 'Chapter 3: Dynamic Programming and Bellman Equation',
                      content: '# Chapter 3: Dynamic Programming\n\nDynamic programming, like the divide-and-conquer method, solves problems by combining the solutions to subproblems.\n\n## Optimal Substructure\nA problem exhibits optimal substructure if an optimal solution to the problem contains within it optimal solutions to subproblems.\n\n```text\nDP Memoization Strategy:\n1. Characterize the structure of an optimal solution.\n2. Recursively define the value of an optimal solution.\n3. Compute the value of an optimal solution, typically in a bottom-up fashion.\n4. Construct an optimal solution from computed information.\n```'
                    }
                  ]
                },
                {
                  id: 'book_networks',
                  title: 'Principles of Modern Computer Networks & Cloud Systems',
                  author: 'Andrew S. Tanenbaum, David J. Wetherall',
                  categoryId: 'engineering',
                  categoryName: 'Network Engineering',
                  description: 'Standard textbook exploring OSI reference architecture, TCP/IP congestion control, and low-latency distributed protocols.',
                  coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
                  fileUrl: '/downloads/book_networks.pdf',
                  fileSize: '18.7 MB',
                  pages: 95,
                  downloadAllowed: true,
                  rating: 4.8,
                  publishYear: 2024,
                  publisher: 'Dot X Engineering Press',
                  downloadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                  lastReadPage: 1,
                  isOfflineCached: true,
                  contentPages: [
                    {
                      page: 1,
                      title: 'Chapter 1: Network Layer Architecture',
                      content: '# Chapter 1: Network Layer Architecture\n\nThe network layer is concerned with getting packets from the source all the way to the destination.\n\n## 1.1 Store-and-Forward Packet Switching\nA host with a packet to send transmits it to the nearest router, either on its own LAN or over a point-to-point link to the provider. The packet is stored there until it has fully arrived and its checksum is verified.'
                    },
                    {
                      page: 2,
                      title: 'Chapter 2: Congestion Control in Transport Layer',
                      content: '# Chapter 2: Congestion Control\n\nWhen too many packets are present in a network, performance degrades rapidly. This situation is called congestion.\n\n```text\nTCP Congestion Avoidance States:\n- Slow Start (Exponential growth)\n- Congestion Avoidance (Additive Increase Multiplicative Decrease - AIMD)\n- Fast Retransmit & Fast Recovery\n```'
                    }
                  ]
                }
              ];

              seedBooks.forEach((sb) => bookStore.put(sb));

              const noteStore = checkTx.objectStore(STORE_NOTES);
              const seedNotes: StudentNote[] = [
                {
                  id: 'note_seed_1',
                  bookId: 'book_algo',
                  bookTitle: 'Introduction to Algorithms & Data Structures',
                  pageNumber: 1,
                  chapterTitle: 'Chapter 1: The Role of Algorithms',
                  title: 'Midterm Reminder: Master Theorem Cases',
                  content: 'Important formula for exam: If T(n) = aT(n/b) + f(n), compare n^(log_b a) with f(n). Case 2: if equal, T(n) = Theta(n^(log_b a) * log n). Review practice problems 2.3-1 and 2.3-2.',
                  tags: ['exam', 'formulas', 'midterm'],
                  color: 'blue',
                  createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                  updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
                },
                {
                  id: 'note_seed_2',
                  bookId: 'book_networks',
                  bookTitle: 'Principles of Modern Computer Networks',
                  pageNumber: 2,
                  chapterTitle: 'Chapter 2: Congestion Control',
                  title: 'Lab 3 Notes: AIMD vs BBR Throughput',
                  content: 'BBR measures bottleneck bandwidth and round-trip propagation time rather than treating packet loss as an indicator of queue saturation. Test latency under 5% synthetic packet loss in Mininet.',
                  tags: ['lab', 'networks'],
                  color: 'emerald',
                  createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
                  updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
                }
              ];

              seedNotes.forEach((sn) => noteStore.put(sn));
            }
          };
        } catch (e) {
          console.warn('Auto-seed check error', e);
        }

        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB database.'));
      };
    });

    return this.dbPromise;
  }

  // ==========================================
  // 1. Downloaded Books Management
  // ==========================================

  async saveBookOffline(book: {
    id: string;
    title: string;
    author: string;
    categoryId?: string;
    categoryName?: string;
    description?: string;
    coverImage?: string;
    fileUrl?: string;
    fileSize?: string;
    pages?: number;
    downloadAllowed?: boolean;
    rating?: number;
    publishYear?: number;
    publisher?: string;
    contentPages?: { page: number; title: string; content: string }[];
    lastReadPage?: number;
  }): Promise<OfflineBook> {
    const db = await this.getDB();

    // Ensure fallback content chapters exist for reading even without network
    const pages = book.pages || 100;
    let contentPages = book.contentPages;
    if (!contentPages || contentPages.length === 0) {
      contentPages = [
        {
          page: 1,
          title: `Chapter 1: Foundations of ${book.title}`,
          content: `# ${book.title}\n\nBy ${book.author}\n\n## Overview\n${book.description || 'Comprehensive digital textbook edition with full offline caching.'}\n\n### Core Principles\nThis publication is stored in your Dot X Local Offline Vault via IndexedDB and Service Worker cache. You can read every chapter, adjust typography, search keywords, and take student annotations without an active internet connection.`
        },
        {
          page: 2,
          title: 'Chapter 2: In-Depth Methodologies & Theory',
          content: `## Academic Framework & Formulation\n\nScholarly reference preserved under institutional access standards.\n\n\`\`\`text\nTheorem 1.1: Academic Continuity Principle\nOffline cached publications must retain total integrity and permit annotation.\n\`\`\`\n\nStudents can highlight text, bookmark formulas, and add notes to this chapter.`
        },
        {
          page: 3,
          title: 'Chapter 3: Practical Applications & Exercises',
          content: `## Lab Exercises & Problem Sets\n\n1. Review the introductory concepts and formulate a hypothesis.\n2. Cross-reference definitions with your saved student notes.\n3. Prepare seminar notes for upcoming collaborative study sessions.`
        }
      ];
    }

    const offlineRecord: OfflineBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      categoryId: book.categoryId || 'academic',
      categoryName: book.categoryName || 'General Science',
      description: book.description || '',
      coverImage: book.coverImage || 'https://images.unsplash.com/photo-1532012164546-f432f2e37b29?w=600&auto=format&fit=crop&q=80',
      fileUrl: book.fileUrl || `/downloads/${book.id}.pdf`,
      fileSize: book.fileSize || '12.4 MB',
      pages,
      downloadAllowed: book.downloadAllowed !== false,
      rating: book.rating || 4.8,
      publishYear: book.publishYear || new Date().getFullYear(),
      publisher: book.publisher || 'Dot X Academic Press',
      contentPages,
      downloadedAt: new Date().toISOString(),
      lastReadPage: book.lastReadPage || 1,
      isOfflineCached: true,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.put(offlineRecord);

      req.onsuccess = () => resolve(offlineRecord);
      req.onerror = () => reject(req.error || new Error('Could not save book to IndexedDB'));
    });
  }

  async isBookOffline(bookId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_BOOKS, 'readonly');
        const store = tx.objectStore(STORE_BOOKS);
        const req = store.get(bookId);
        req.onsuccess = () => resolve(Boolean(req.result));
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getOfflineBook(bookId: string): Promise<OfflineBook | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readonly');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.get(bookId);

      req.onsuccess = () => resolve((req.result as OfflineBook) || null);
      req.onerror = () => reject(req.error || new Error('Failed to fetch offline book'));
    });
  }

  async getAllOfflineBooks(): Promise<OfflineBook[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_BOOKS, 'readonly');
        const store = tx.objectStore(STORE_BOOKS);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as OfflineBook[]) || [];
          // Sort newest downloaded first
          list.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error || new Error('Failed to fetch offline books'));
      });
    } catch {
      return [];
    }
  }

  async removeBookOffline(bookId: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.delete(bookId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Failed to remove offline book'));
    });
  }

  async updateLastReadPage(bookId: string, pageNumber: number): Promise<void> {
    try {
      const book = await this.getOfflineBook(bookId);
      if (book) {
        book.lastReadPage = pageNumber;
        const db = await this.getDB();
        const tx = db.transaction(STORE_BOOKS, 'readwrite');
        tx.objectStore(STORE_BOOKS).put(book);
      }
    } catch (e) {
      console.warn('Could not update offline reading page', e);
    }
  }

  // ==========================================
  // 2. Student Study Notes Management
  // ==========================================

  async saveNote(note: {
    id?: string;
    bookId: string;
    bookTitle: string;
    pageNumber?: number;
    chapterTitle?: string;
    title: string;
    content: string;
    tags?: string[];
    color?: NoteColor;
  }): Promise<StudentNote> {
    const db = await this.getDB();
    const id = note.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    // Check if updating existing note
    const existing = note.id ? await this.getNoteById(note.id) : null;

    const noteRecord: StudentNote = {
      id,
      bookId: note.bookId,
      bookTitle: note.bookTitle || 'General Academic Notes',
      pageNumber: note.pageNumber || 1,
      chapterTitle: note.chapterTitle || '',
      title: note.title.trim() || 'Untitled Note',
      content: note.content.trim(),
      tags: note.tags && note.tags.length > 0 ? note.tags : ['study'],
      color: note.color || 'blue',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.put(noteRecord);

      req.onsuccess = () => resolve(noteRecord);
      req.onerror = () => reject(req.error || new Error('Failed to save student note in IndexedDB'));
    });
  }

  async getNoteById(id: string): Promise<StudentNote | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readonly');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as StudentNote) || null);
      req.onerror = () => reject(req.error || new Error('Failed to load note'));
    });
  }

  async getAllNotes(): Promise<StudentNote[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NOTES, 'readonly');
        const store = tx.objectStore(STORE_NOTES);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as StudentNote[]) || [];
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error || new Error('Failed to fetch student notes'));
      });
    } catch {
      return [];
    }
  }

  async getNotesForBook(bookId: string): Promise<StudentNote[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NOTES, 'readonly');
        const store = tx.objectStore(STORE_NOTES);
        const index = store.index('by_bookId');
        const req = index.getAll(bookId);

        req.onsuccess = () => {
          const list = (req.result as StudentNote[]) || [];
          list.sort((a, b) => (a.pageNumber - b.pageNumber) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
          resolve(list);
        };
        req.onerror = () => reject(req.error || new Error('Failed to load notes for book'));
      });
    } catch {
      return [];
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.delete(noteId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Failed to delete student note'));
    });
  }

  // ==========================================
  // 3. Storage Diagnostics & Export Utilities
  // ==========================================

  async getStorageStats(): Promise<{
    booksCount: number;
    notesCount: number;
    estimatedUsageMB: number;
    quotaMB: number;
  }> {
    try {
      const [books, notes] = await Promise.all([
        this.getAllOfflineBooks(),
        this.getAllNotes(),
      ]);

      let estimatedUsageMB = 0;
      let quotaMB = 0;

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          estimatedUsageMB = Number((estimate.usage / (1024 * 1024)).toFixed(2));
        }
        if (estimate.quota) {
          quotaMB = Number((estimate.quota / (1024 * 1024)).toFixed(0));
        }
      }

      // If usage wasn't available, calculate approx string size
      if (!estimatedUsageMB) {
        const booksSize = JSON.stringify(books).length;
        const notesSize = JSON.stringify(notes).length;
        estimatedUsageMB = Number(((booksSize + notesSize) / (1024 * 1024)).toFixed(2));
      }

      return {
        booksCount: books.length,
        notesCount: notes.length,
        estimatedUsageMB,
        quotaMB,
      };
    } catch {
      return {
        booksCount: 0,
        notesCount: 0,
        estimatedUsageMB: 0,
        quotaMB: 0,
      };
    }
  }

  async exportNotesAsMarkdown(): Promise<string> {
    const notes = await this.getAllNotes();
    if (notes.length === 0) return '# Dot X Library - Student Study Notes\n\nNo saved notes found.';

    let md = `# Dot X Library - Student Study Notes\nExported on: ${new Date().toLocaleString()}\n\n`;
    notes.forEach((n) => {
      md += `## ${n.title}\n`;
      md += `**Publication:** ${n.bookTitle} (Page ${n.pageNumber}${n.chapterTitle ? ` • ${n.chapterTitle}` : ''})\n`;
      md += `**Tags:** ${n.tags.join(', ')} | **Updated:** ${new Date(n.updatedAt).toLocaleDateString()}\n\n`;
      md += `${n.content}\n\n---\n\n`;
    });
    return md;
  }
}

export const offlineDb = new OfflineDbService();

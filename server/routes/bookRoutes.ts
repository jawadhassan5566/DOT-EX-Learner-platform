/**
 * Dot X Library - Book & Catalog Routes
 */
import { Router, Response } from 'express';
import { db, Book } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin, requirePermission } from '../auth.js';

const router = Router();

// Get Books with Search, Filters, Sorting
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, category, sort, featured, limit, page, instituteId, adminFilter } = req.query;

  let results = [...db.books];

  // "Each institute will have a separate admin panel, but books will be visible to everyone."
  // Only filter by institute if specifically requested by admin management view (adminFilter === 'true')
  if (adminFilter === 'true') {
    const headerInst = req.headers['x-institute-id'] as string | undefined;
    const isSuper = req.user?.role === 'superadmin';
    const effectiveInstitute = isSuper ? (headerInst || (typeof instituteId === 'string' ? instituteId : undefined)) : req.user?.instituteId;
    if (effectiveInstitute && effectiveInstitute !== 'all') {
      results = results.filter(b => b.instituteId === effectiveInstitute);
    }
  }

  // 1. Search Query
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.categoryName.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }

  // 2. Category Filter
  if (typeof category === 'string' && category && category !== 'all') {
    results = results.filter(b => b.categoryId === category || b.categoryName.toLowerCase() === category.toLowerCase());
  }

  // 3. Featured Filter
  if (featured === 'true') {
    results = results.filter(b => b.isFeatured);
  }

  // 4. Sorting
  if (sort === 'popular') {
    results.sort((a, b) => b.readCount - a.readCount);
  } else if (sort === 'newest') {
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'downloads') {
    results.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  // 5. Pagination
  const pageSize = limit ? parseInt(limit as string, 10) : 50;
  const pageNum = page ? parseInt(page as string, 10) : 1;
  const total = results.length;
  const paginated = results.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  res.json({
    success: true,
    total,
    page: pageNum,
    pageSize,
    books: paginated
  });
});

// Get Book Details & Related Books
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const book = db.books.find(b => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, error: "Book not found" });
  }

  // Find related books in same category
  const related = db.books
    .filter(b => b.categoryId === book.categoryId && b.id !== book.id)
    .slice(0, 4);

  // Check if current user has bookmarked or has reading history
  let userBookmark = null;
  let userReading = null;
  if (req.user) {
    userBookmark = db.bookmarks.find(bm => bm.userId === req.user!.id && bm.bookId === book.id) || null;
    userReading = db.readingHistory.find(rh => rh.userId === req.user!.id && rh.bookId === book.id) || null;
  }

  res.json({
    success: true,
    book,
    related,
    userBookmark,
    userReading
  });
});

// Read Book Online (increments read count)
router.get('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const book = db.books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ success: false, error: "Book not found" });

  book.readCount += 1;

  res.json({
    success: true,
    bookId: book.id,
    title: book.title,
    author: book.author,
    totalPages: book.pages,
    downloadAllowed: book.downloadAllowed,
    contentPages: book.contentPages
  });
});

// Download Book PDF (Permission Protected)
router.get('/:id/download', (req: AuthenticatedRequest, res: Response) => {
  const book = db.books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ success: false, error: "Book not found" });

  if (!book.downloadAllowed && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin'))) {
    return res.status(403).json({
      success: false,
      error: "This academic publication is restricted to Online Reading only. Download permission denied."
    });
  }

  book.downloadCount += 1;
  if (req.user) {
    db.logAction(req.user.id, req.user.name, req.user.role, "Book Downloaded", `Downloaded: ${book.title}`, req.ip);
  }

  // Respond with virtual academic pdf stream download url / json metadata
  res.json({
    success: true,
    message: "Download approved by Dot X Library access guard.",
    downloadUrl: book.fileUrl,
    filename: `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    fileSize: book.fileSize
  });
});

// Toggle Bookmark
router.post('/:id/bookmark', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { pageNumber, note } = req.body;
  const userId = req.user!.id;

  const existingIdx = db.bookmarks.findIndex(b => b.userId === userId && b.bookId === id);
  if (existingIdx !== -1) {
    db.bookmarks.splice(existingIdx, 1);
    return res.json({ success: true, isBookmarked: false, message: "Bookmark removed." });
  }

  const newBookmark = {
    id: "bm_" + Date.now(),
    userId,
    bookId: id,
    pageNumber: pageNumber || 1,
    note: note || "",
    createdAt: new Date().toISOString()
  };
  db.bookmarks.push(newBookmark);
  res.json({ success: true, isBookmarked: true, bookmark: newBookmark, message: "Book saved to bookmarks!" });
});

// Save Reading Progress
router.post('/:id/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { pageNumber, totalPages } = req.body;
  const userId = req.user!.id;

  const book = db.books.find(b => b.id === id);
  const total = totalPages || (book ? book.pages : 100);
  const percent = Math.min(100, Math.round(((pageNumber || 1) / total) * 100));

  let record = db.readingHistory.find(r => r.userId === userId && r.bookId === id);
  if (record) {
    record.lastPage = pageNumber;
    record.totalPages = total;
    record.progressPercentage = percent;
    record.updatedAt = new Date().toISOString();
  } else {
    record = {
      id: "rh_" + Date.now(),
      userId,
      bookId: id,
      lastPage: pageNumber || 1,
      totalPages: total,
      progressPercentage: percent,
      updatedAt: new Date().toISOString()
    };
    db.readingHistory.push(record);
  }

  res.json({ success: true, progress: record });
});

// ADMIN: Create Book
router.post('/', requireAuth, requirePermission('manage_books'), (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    author,
    categoryId,
    description,
    coverImage,
    fileSize,
    pages,
    downloadAllowed,
    isFeatured,
    publisher,
    isbn,
    publishYear
  } = req.body;

  if (!title || !author || !categoryId) {
    return res.status(400).json({ success: false, error: "Title, author, and category are required." });
  }

  const cat = db.categories.find(c => c.id === categoryId);
  const targetInstId = req.body.instituteId || (req.headers['x-institute-id'] as string) || req.user?.instituteId || 'inst_dotx';
  const targetInst = db.institutes.find(i => i.id === targetInstId);

  const newBook: Book = {
    id: "book_" + Date.now(),
    title: title.trim(),
    author: author.trim(),
    categoryId,
    categoryName: cat?.name || "General",
    instituteId: targetInstId,
    instituteName: targetInst?.name || "Dot X Central University",
    description: description || "Academic text published on Dot X Library.",
    coverImage: coverImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
    fileUrl: `/api/files/${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
    fileSize: fileSize || "15.0 MB",
    pages: Number(pages) || 250,
    isFeatured: Boolean(isFeatured),
    isPopular: false,
    isNew: true,
    downloadAllowed: downloadAllowed !== false,
    readCount: 0,
    downloadCount: 0,
    rating: 5.0,
    publishYear: Number(publishYear) || 2026,
    isbn: isbn || "978-0-00-000000-0",
    language: "English",
    publisher: publisher || "Dot X Academic Press",
    createdAt: new Date().toISOString(),
    contentPages: [
      {
        page: 1,
        title: "Chapter 1: Academic Overview",
        content: `# ${title}\n\nAuthored by **${author}**\n\nWelcome to this publication on Dot X Library. This textbook contains full academic annotations, figures, and curriculum breakdown.`
      },
      {
        page: 2,
        title: "Chapter 2: Fundamental Principles",
        content: `### Core Theories and Applied Methodology\n\nIn this section, foundational concepts and experimental proofs are provided.`
      }
    ]
  };

  db.books.unshift(newBook);
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Book Created", `Added textbook: ${newBook.title}`, req.ip);

  res.status(201).json({ success: true, book: newBook, message: "Book created successfully!" });
});

// ADMIN: Edit Book
router.put('/:id', requireAuth, requirePermission('manage_books'), (req: AuthenticatedRequest, res: Response) => {
  const book = db.books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ success: false, error: "Book not found" });

  const {
    title,
    author,
    categoryId,
    description,
    coverImage,
    fileSize,
    pages,
    downloadAllowed,
    isFeatured,
    publisher,
    isbn,
    publishYear
  } = req.body;

  if (title) book.title = title.trim();
  if (author) book.author = author.trim();
  if (categoryId) {
    book.categoryId = categoryId;
    const cat = db.categories.find(c => c.id === categoryId);
    if (cat) book.categoryName = cat.name;
  }
  if (description !== undefined) book.description = description;
  if (coverImage) book.coverImage = coverImage;
  if (fileSize) book.fileSize = fileSize;
  if (pages) book.pages = Number(pages);
  if (downloadAllowed !== undefined) book.downloadAllowed = Boolean(downloadAllowed);
  if (isFeatured !== undefined) book.isFeatured = Boolean(isFeatured);
  if (publisher) book.publisher = publisher;
  if (isbn) book.isbn = isbn;
  if (publishYear) book.publishYear = Number(publishYear);

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Book Updated", `Updated details for: ${book.title}`, req.ip);
  res.json({ success: true, book, message: "Book updated successfully." });
});

// ADMIN: Delete Book
router.delete('/:id', requireAuth, requirePermission('manage_books'), (req: AuthenticatedRequest, res: Response) => {
  const idx = db.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Book not found" });

  const removed = db.books.splice(idx, 1)[0];
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Book Deleted", `Removed textbook: ${removed.title}`, req.ip);

  res.json({ success: true, message: "Textbook deleted successfully." });
});

export default router;

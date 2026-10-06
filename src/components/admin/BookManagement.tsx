import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Star,
  CheckCircle2,
  X,
  Lock,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Book, Category } from '../../types/index.js';

export const BookManagement: React.FC = () => {
  const { addToast } = useApp();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('cat_cs');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [pages, setPages] = useState(300);
  const [fileSize, setFileSize] = useState('14.2 MB');
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [publisher, setPublisher] = useState('Dot X Academic Press');
  const [isbn, setIsbn] = useState('978-0134685991');

  const loadData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        api.getBooks({ search: search.trim() || undefined }),
        api.getCategories()
      ]);
      if (bRes.success) setBooks(bRes.books);
      if (cRes.success) setCategories(cRes.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openCreateModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setCategoryId(categories[0]?.id || 'cat_cs');
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80');
    setPages(320);
    setFileSize('12.5 MB');
    setDownloadAllowed(true);
    setIsFeatured(false);
    setPublisher('Dot X Academic Press');
    setIsbn('978-0-123456-78-9');
    setModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setCategoryId(book.categoryId);
    setDescription(book.description);
    setCoverImage(book.coverImage);
    setPages(book.pages);
    setFileSize(book.fileSize);
    setDownloadAllowed(book.downloadAllowed);
    setIsFeatured(book.isFeatured);
    setPublisher(book.publisher);
    setIsbn(book.isbn);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === categoryId);

    const payload = {
      title,
      author,
      categoryId,
      categoryName: cat ? cat.name : 'Computer Science',
      description,
      coverImage,
      fileSize,
      pages: Number(pages),
      downloadAllowed,
      isFeatured,
      publisher,
      isbn
    };

    try {
      if (editingBook) {
        const res = await api.updateBook(editingBook.id, payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Updated', message: res.message });
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createBook(payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Created', message: res.message });
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the academic library?`)) return;
    try {
      const res = await api.deleteBook(id);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span>Academic Textbook Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add new curricula, configure download permissions, and curate featured books.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Textbook</span>
          </button>
        </div>
      </div>

      {/* Book Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4">Book Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Pages / Size</th>
              <th className="p-4">Downloads</th>
              <th className="p-4">Permissions</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {books.map((b) => (
              <tr key={b.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={b.coverImage} alt={b.title} className="w-10 h-14 object-cover rounded-lg bg-slate-950" />
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">{b.title}</h4>
                      <p className="text-[11px] text-slate-400">{b.author}</p>
                      {b.isFeatured && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-300">{b.categoryName}</td>
                <td className="p-4 font-mono text-slate-400">{b.pages}p • {b.fileSize}</td>
                <td className="p-4 font-mono text-slate-300">{b.downloadCount}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.downloadAllowed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {b.downloadAllowed ? 'Downloadable' : 'Protected'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Edit Book"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                    title="Delete Book"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBook ? 'Edit Academic Textbook' : 'Publish New Academic Textbook'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Book Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description / Abstract</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Pages</label>
                  <input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value, 10))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">File Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadAllowed}
                    onChange={(e) => setDownloadAllowed(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Allow PDF Download</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Mark as Featured</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
                >
                  {editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

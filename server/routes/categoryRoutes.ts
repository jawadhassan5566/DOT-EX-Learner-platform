/**
 * Dot X Library - Category Routes
 */
import { Router, Response } from 'express';
import { db, Category } from '../db.js';
import { AuthenticatedRequest, requireAuth, requirePermission } from '../auth.js';

const router = Router();

// Get All Categories (with counts)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const categoriesWithCounts = db.categories.map(c => {
    const bookCount = db.books.filter(b => b.categoryId === c.id).length;
    return {
      ...c,
      bookCount
    };
  });

  // Sort by orderIndex
  categoriesWithCounts.sort((a, b) => a.orderIndex - b.orderIndex);

  res.json({
    success: true,
    categories: categoriesWithCounts
  });
});

// ADMIN: Create Category
router.post('/', requireAuth, requirePermission('manage_categories'), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, icon, orderIndex } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "Category name is required." });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const existing = db.categories.find(c => c.slug === slug);
  if (existing) {
    return res.status(400).json({ success: false, error: "A category with this title already exists." });
  }

  const newCat: Category = {
    id: "cat_" + Date.now(),
    name: name.trim(),
    slug,
    description: description || "",
    icon: icon || "BookOpen",
    orderIndex: Number(orderIndex) || db.categories.length + 1,
    isActive: true
  };

  db.categories.push(newCat);
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Category Created", `Created category: ${newCat.name}`, req.ip);

  res.status(201).json({ success: true, category: newCat, message: "Category created successfully!" });
});

// ADMIN: Edit Category
router.put('/:id', requireAuth, requirePermission('manage_categories'), (req: AuthenticatedRequest, res: Response) => {
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ success: false, error: "Category not found" });

  const { name, description, icon, orderIndex, isActive } = req.body;
  if (name) {
    cat.name = name.trim();
    cat.slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  if (description !== undefined) cat.description = description;
  if (icon) cat.icon = icon;
  if (orderIndex !== undefined) cat.orderIndex = Number(orderIndex);
  if (isActive !== undefined) cat.isActive = Boolean(isActive);

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Category Updated", `Updated category: ${cat.name}`, req.ip);
  res.json({ success: true, category: cat, message: "Category updated successfully." });
});

// ADMIN: Delete Category
router.delete('/:id', requireAuth, requirePermission('manage_categories'), (req: AuthenticatedRequest, res: Response) => {
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Category not found" });

  const removed = db.categories.splice(idx, 1)[0];
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Category Deleted", `Deleted category: ${removed.name}`, req.ip);

  res.json({ success: true, message: "Category deleted successfully." });
});

export default router;

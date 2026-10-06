/**
 * Dot X Library - Institutes & Organizations Management Routes
 * Supports full multi-tenant institute isolation:
 * Each institute has its own books, users, meetings, and announcement feed.
 */
import { Router, Response } from 'express';
import { db, Institute, User, Book, Meeting, Notification } from '../db.js';
import {
  AuthenticatedRequest,
  requireAuth,
  requireAdmin,
  requireMainAdmin,
  requireSuperAdmin,
  hashPassword
} from '../auth.js';

const router = Router();

// Helper to compute live institute statistics
export function getEnrichedInstitute(inst: Institute) {
  const users = db.users.filter(u => u.instituteId === inst.id);
  const studentCount = users.filter(u => u.role === 'student').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const bookCount = db.books.filter(b => b.instituteId === inst.id).length;
  const meetingCount = db.meetings.filter(m => m.instituteId === inst.id).length;
  const announcementCount = db.notifications.filter(n => n.instituteId === inst.id).length;

  return {
    ...inst,
    studentCount,
    teacherCount,
    adminCount,
    bookCount,
    meetingCount,
    announcementCount
  };
}

// 1. Get All Active Institutes (Public & App Scope)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  // If Super Admin, show all institutes, else only active institutes
  const isSuper = req.user?.role === 'superadmin';
  const list = isSuper ? db.institutes : db.institutes.filter(i => i.status === 'active');
  const enriched = list.map(getEnrichedInstitute);

  res.json({
    success: true,
    institutes: enriched
  });
});

// 2. Get Single Institute Details
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const inst = db.institutes.find(i => i.id === req.params.id);
  if (!inst) {
    return res.status(404).json({ success: false, error: "Institute not found." });
  }

  const enriched = getEnrichedInstitute(inst);
  res.json({ success: true, institute: enriched });
});

// 3. Admin: Get Institutes with Detailed Metrics (Main Admin & Super Admin only; Sub-Admins barred)
router.get('/admin/list', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user?.role === 'superadmin';
  let list = db.institutes;

  // Institute admins only see their own institute if not super admin
  if (!isSuper && req.user?.instituteId) {
    list = list.filter(i => i.id === req.user?.instituteId);
  }

  const enriched = list.map(getEnrichedInstitute);
  res.json({
    success: true,
    institutes: enriched
  });
});

// 4. Super Admin: Create New Institute with Dedicated Admin & Isolated Content
router.post('/admin/create', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    code,
    slug,
    description,
    logo,
    adminName,
    adminEmail,
    adminPassword,
    address,
    website,
    allowRegistration
  } = req.body;

  if (!name || !code || !adminName || !adminEmail) {
    return res.status(400).json({
      success: false,
      error: "Institute name, institutional code, admin name, and admin email are required."
    });
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanEmail = adminEmail.trim().toLowerCase();

  // Validate uniqueness of institute code
  if (db.institutes.some(i => i.code.toUpperCase() === cleanCode)) {
    return res.status(400).json({
      success: false,
      error: `An institute with institutional code '${cleanCode}' already exists.`
    });
  }

  // Generate ID and slug
  const instId = `inst_${cleanCode.toLowerCase()}_${Date.now().toString(36)}`;
  const finalSlug = slug?.trim() || cleanCode.toLowerCase() + '-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);

  // 1. Create Institute record
  const newInst: Institute = {
    id: instId,
    name: name.trim(),
    code: cleanCode,
    slug: finalSlug,
    description: description?.trim() || `Academic research and teaching organization for ${name.trim()}.`,
    logo: logo?.trim() || "https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80",
    adminId: `user_admin_${cleanCode.toLowerCase()}`,
    adminName: adminName.trim(),
    adminEmail: cleanEmail,
    status: 'active',
    address: address?.trim() || "Campus Boulevard, Academic District",
    website: website?.trim() || `https://${cleanCode.toLowerCase()}.edu`,
    allowRegistration: allowRegistration !== false,
    createdAt: new Date().toISOString()
  };

  db.institutes.push(newInst);

  // 2. Provision Dedicated Institute Admin Account
  const adminId = `user_admin_${cleanCode.toLowerCase()}`;
  const existingUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!existingUser) {
    const newAdminUser: User = {
      id: adminId,
      name: adminName.trim(),
      username: `admin_${cleanCode.toLowerCase()}`,
      email: cleanEmail,
      passwordHash: hashPassword(adminPassword || 'password123'),
      role: 'admin',
      roleId: 'institute_admin_role',
      instituteId: instId,
      instituteName: newInst.name,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bio: `Dedicated Administrator for ${newInst.name}`,
      department: "Institutional Administration",
      status: 'active',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: "Never"
    };
    db.users.push(newAdminUser);
  } else {
    existingUser.instituteId = instId;
    existingUser.instituteName = newInst.name;
    existingUser.role = 'admin';
    existingUser.roleId = 'institute_admin_role';
  }

  // 3. Seed Inaugural Book for this Isolated Institute Catalog
  const inauguralBook: Book = {
    id: `book_${cleanCode.toLowerCase()}_handbook`,
    title: `${newInst.name} Academic Curriculum & Research Handbook`,
    author: `${adminName.trim()} & Academic Senate`,
    categoryId: 'cat_cs',
    categoryName: 'Computer Science',
    instituteId: instId,
    instituteName: newInst.name,
    description: `Official inaugural curriculum guide, faculty standards, laboratory access rules, and syllabi for ${newInst.name}.`,
    coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500&auto=format&fit=crop&q=80",
    fileUrl: `/api/files/${cleanCode.toLowerCase()}-handbook.pdf`,
    fileSize: "18.4 MB",
    pages: 280,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    downloadAllowed: true,
    readCount: 1,
    downloadCount: 0,
    rating: 5.0,
    publishYear: 2026,
    isbn: `978-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-0`,
    language: "English",
    publisher: `${newInst.name} Press`,
    createdAt: new Date().toISOString(),
    contentPages: [
      {
        page: 1,
        title: "Section 1: Institutional Vision & Mission",
        content: `# Welcome to ${newInst.name}\n\nOur mission is to foster academic excellence, cutting-edge research, and technological advancement in our students and researchers.\n\n### Institutional Code: ${cleanCode}\nCampus Address: ${newInst.address}\nOfficial Portal: ${newInst.website}`
      },
      {
        page: 2,
        title: "Section 2: Research Laboratories & Digital Library Access",
        content: `### Digital Library Protocols\nStudents registered under ${newInst.name} have exclusive access to this isolated repository, course materials, and interactive classroom sessions.`
      }
    ]
  };
  db.books.push(inauguralBook);

  // 4. Seed Inaugural Meeting for this Isolated Institute
  const inauguralMeeting: Meeting = {
    id: `meet_${cleanCode.toLowerCase()}_orientation`,
    title: `${newInst.name} Faculty & Student Orientation`,
    description: `Welcome session and academic orientation for all students and researchers at ${newInst.name}.`,
    hostId: adminId,
    hostName: adminName.trim(),
    instituteId: instId,
    instituteName: newInst.name,
    category: 'Computer Science',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: "11:00 AM",
    durationMinutes: 60,
    status: 'upcoming',
    meetCode: `${cleanCode}-ORIENTATION`,
    allowChat: true,
    allowWhiteboard: true,
    allowScreenShare: true,
    participantsCount: 1,
    maxParticipants: 300
  };
  db.meetings.push(inauguralMeeting);

  // 5. Seed Welcome Announcement for this Isolated Institute Feed
  const welcomeNotif: Notification = {
    id: `notif_${cleanCode.toLowerCase()}_welcome`,
    title: `Welcome to ${newInst.name} Academic Portal`,
    message: `The institutional workspace for ${newInst.name} is now officially initialized. Access your dedicated books, live classrooms, and campus bulletin.`,
    type: 'announcement',
    targetGroup: 'all',
    targetAudience: 'all',
    instituteId: instId,
    instituteName: newInst.name,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(welcomeNotif);

  // 6. Log Security / Audit Action
  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Institute Provisioned",
    `Created new isolated institute: ${newInst.name} (${cleanCode}) with admin ${cleanEmail}`,
    req.ip
  );

  const enriched = getEnrichedInstitute(newInst);
  res.status(201).json({
    success: true,
    institute: enriched,
    message: `Institute '${newInst.name}' provisioned successfully with isolated books, admin account, and announcement feed.`
  });
});

// 5. Super Admin / Main Admin: Update Institute Details (Sub-Admins strictly blocked)
router.put('/admin/:id', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const inst = db.institutes.find(i => i.id === req.params.id);
  if (!inst) {
    return res.status(404).json({ success: false, error: "Institute not found." });
  }

  // Non-superadmins can only update their own institute
  if (req.user?.role !== 'superadmin' && req.user?.instituteId !== inst.id) {
    return res.status(403).json({ success: false, error: "Unauthorized to update this institute." });
  }

  const {
    name,
    code,
    description,
    logo,
    address,
    website,
    status,
    allowRegistration
  } = req.body;

  if (name) inst.name = name.trim();
  if (code) inst.code = code.trim().toUpperCase();
  if (description !== undefined) inst.description = description.trim();
  if (logo !== undefined) inst.logo = logo.trim();
  if (address !== undefined) inst.address = address.trim();
  if (website !== undefined) inst.website = website.trim();
  if (allowRegistration !== undefined) inst.allowRegistration = Boolean(allowRegistration);

  // Status can only be changed by superadmin
  if (status && req.user?.role === 'superadmin') {
    if (['active', 'suspended'].includes(status)) {
      inst.status = status;
    }
  }

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Institute Updated",
    `Updated parameters for institute: ${inst.name} (${inst.code})`,
    req.ip
  );

  const enriched = getEnrichedInstitute(inst);
  res.json({
    success: true,
    institute: enriched,
    message: `Institute '${inst.name}' updated successfully.`
  });
});

// 6. Super Admin: Delete Institute
router.delete('/admin/:id', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === 'inst_dotx') {
    return res.status(403).json({
      success: false,
      error: "The primary headquarters institute (Dot X Central) cannot be deleted."
    });
  }

  const idx = db.institutes.findIndex(i => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Institute not found." });
  }

  const removed = db.institutes.splice(idx, 1)[0];

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Institute Removed",
    `Deleted institute ${removed.name} (${removed.code}) and quarantined associated records`,
    req.ip
  );

  res.json({
    success: true,
    message: `Institute '${removed.name}' removed successfully.`
  });
});

export default router;

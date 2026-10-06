/**
 * Dot X Library - Complete Admin Management, RBAC, Logs & Analytics Routes
 */
import { Router, Response } from 'express';
import { db, User, Role, Notification } from '../db.js';
import {
  AuthenticatedRequest,
  requireAuth,
  requireAdmin,
  requireMainAdmin,
  requireSuperAdmin,
  requirePermission,
  hashPassword
} from '../auth.js';

const router = Router();

// 1. Admin Dashboard Overview Statistics
router.get('/dashboard-stats', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user?.role === 'superadmin';
  const headerInst = req.headers['x-institute-id'] as string | undefined;
  // Institute admins are strictly isolated to their own institute
  const instituteScope = isSuper
    ? (headerInst || (typeof req.query.instituteId === 'string' ? req.query.instituteId : undefined))
    : req.user?.instituteId;

  let scopedUsers = db.users;
  let scopedBooks = db.books;
  let scopedMeetings = db.meetings;

  if (instituteScope && instituteScope !== 'all') {
    scopedUsers = db.users.filter(u => u.instituteId === instituteScope);
    scopedBooks = db.books.filter(b => b.instituteId === instituteScope);
    scopedMeetings = db.meetings.filter(m => m.instituteId === instituteScope);
  }

  const totalUsers = scopedUsers.length;
  // Note: Total books in the shared library is visible to everyone, but we also report books authored by this institute
  const totalBooks = db.books.length; // Books visible to everyone
  const instituteBooksCount = scopedBooks.length;
  const totalDownloads = db.books.reduce((acc, b) => acc + (b.downloadCount || 0), 0);
  const activeMeetings = scopedMeetings.filter(m => m.status === 'live').length;
  const aiUsage = db.aiMessages.length * 32 + 5400; // Simulated token / query count
  const unreadMessages = db.contactMessages.filter(m => m.status === 'new').length;

  // Monthly library usage trend data
  const monthlyUsage = [
    { month: 'Jan', reads: 420, downloads: 180 },
    { month: 'Feb', reads: 580, downloads: 240 },
    { month: 'Mar', reads: 710, downloads: 310 },
    { month: 'Apr', reads: 650, downloads: 290 },
    { month: 'May', reads: 890, downloads: 410 },
    { month: 'Jun', reads: 950, downloads: 460 },
    { month: 'Jul', reads: 820, downloads: 390 },
    { month: 'Aug', reads: 1100, downloads: 540 },
    { month: 'Sep', reads: 1350, downloads: 680 }
  ];

  // Category distribution
  const categoryStats = db.categories.map(c => ({
    name: c.name,
    count: db.books.filter(b => b.categoryId === c.id).length
  }));

  // Top 5 recent activity logs
  const recentActivity = isSuper
    ? db.activityLogs.slice(0, 8)
    : db.activityLogs.filter(l => l.userId === req.user?.id || (scopedUsers.some(u => u.id === l.userId))).slice(0, 8);

  const currentInstitute = db.institutes.find(i => i.id === instituteScope);

  res.json({
    success: true,
    instituteScope: instituteScope || 'all',
    instituteName: currentInstitute?.name || (isSuper ? 'Global System (All Institutes)' : req.user?.instituteName),
    stats: {
      totalUsers,
      totalBooks,
      instituteBooksCount,
      totalDownloads,
      activeMeetings,
      aiUsage,
      unreadMessages,
    },
    monthlyUsage,
    categoryStats,
    recentActivity
  });
});

// 2. User Management (Main Admin & Super Admin only; Sub-Admins strictly barred)
router.get('/users', requireAuth, requireMainAdmin, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  const { search, role, status, instituteId } = req.query;
  const isSuper = req.user?.role === 'superadmin';
  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const instituteScope = isSuper
    ? (headerInst || (typeof instituteId === 'string' ? instituteId : undefined))
    : req.user?.instituteId;

  let list = db.users.map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });

  if (instituteScope && instituteScope !== 'all') {
    list = list.filter(u => u.instituteId === instituteScope);
  }

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }

  if (typeof role === 'string' && role && role !== 'all') {
    list = list.filter(u => u.role === role);
  }

  if (typeof status === 'string' && status && status !== 'all') {
    list = list.filter(u => u.status === status);
  }

  res.json({ success: true, users: list });
});

// Update User Status (Activate, Suspend, Deactivate)
router.put('/users/:id/status', requireAuth, requireMainAdmin, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const { status } = req.body;
  if (!['active', 'suspended', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value" });
  }

  // Prevent suspending superadmin
  if (user.role === 'superadmin') {
    return res.status(403).json({ success: false, error: "Cannot modify Super Admin account status." });
  }

  user.status = status;
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "User Status Changed", `Set status of ${user.name} to ${status}`, req.ip);

  res.json({ success: true, message: `User status changed to ${status}.` });
});

// Delete User
router.delete('/users/:id', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "User not found" });

  if (db.users[idx].role === 'superadmin') {
    return res.status(403).json({ success: false, error: "Super Admin cannot be deleted." });
  }

  const removed = db.users.splice(idx, 1)[0];
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "User Deleted", `Deleted user account: ${removed.email}`, req.ip);

  res.json({ success: true, message: "User deleted successfully." });
});

// 3. Admin Management (Super Admin & Main Admin)
router.get('/admins', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user?.role === 'superadmin';
  let adminUsers = db.users
    .filter(u => u.role === 'admin' || u.role === 'superadmin' || u.role === 'subadmin')
    .map(u => {
      const { passwordHash: _, ...safe } = u;
      const role = db.roles.find(r => r.id === u.roleId);
      return {
        ...safe,
        roleName: role ? role.name : (u.role === 'superadmin' ? 'Super Admin' : u.role === 'subadmin' ? 'Sub-Admin' : 'Main Admin'),
        permissions: u.role === 'superadmin'
          ? db.permissions.map(p => p.code)
          : u.role === 'subadmin'
          ? ["manage_books", "manage_notifications", "manage_meetings"]
          : (role?.permissions || [])
      };
    });

  if (!isSuper && req.user?.instituteId) {
    adminUsers = adminUsers.filter(u => u.instituteId === req.user?.instituteId || u.id === req.user?.id);
  }

  res.json({ success: true, admins: adminUsers });
});

// Super Admin: Create Main Admin for an Institution
router.post('/main-admins', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, password, department, instituteId } = req.body;

  if (!name || !username || !email || !password || !instituteId) {
    return res.status(400).json({ success: false, error: "Name, username, email, password, and target institution are required." });
  }

  const inst = db.institutes.find(i => i.id === instituteId);
  if (!inst) return res.status(404).json({ success: false, error: "Target institution not found." });

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, error: "Email already associated with an account." });
  }

  const newMainAdmin: User = {
    id: "admin_main_" + Date.now(),
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: "admin",
    adminType: "main",
    roleId: "institute_admin_role",
    instituteId: inst.id,
    instituteName: inst.name,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: `Main Administrator of ${inst.name}`,
    department: department?.trim() || "Institutional Administration",
    status: "active",
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: "Never"
  };

  db.users.push(newMainAdmin);
  inst.adminId = newMainAdmin.id;
  inst.adminName = newMainAdmin.name;
  inst.adminEmail = newMainAdmin.email;

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Main Admin Created",
    `Super Admin created Main Admin ${newMainAdmin.name} (${newMainAdmin.email}) for ${inst.name}`,
    req.ip
  );

  const { passwordHash: _, ...safe } = newMainAdmin;
  res.status(201).json({
    success: true,
    mainAdmin: safe,
    institute: inst,
    message: `Main Admin for ${inst.name} created successfully.`
  });
});

// Super Admin Creates General Administrator / Main Admin
router.post('/admins', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, password, roleId, department, instituteId, isMainAdmin } = req.body;

  if (!name || !username || !email || !password || !roleId) {
    return res.status(400).json({ success: false, error: "All administrative details and role assignment are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, error: "Email already associated with an account." });
  }

  let inst = instituteId ? db.institutes.find(i => i.id === instituteId) : undefined;
  if (!inst && isMainAdmin) {
    inst = db.institutes[0];
  }

  const newAdmin: User = {
    id: "admin_" + Date.now(),
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: "admin",
    adminType: isMainAdmin || instituteId ? "main" : "sub",
    roleId,
    instituteId: inst?.id,
    instituteName: inst?.name,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    bio: isMainAdmin ? `Main Administrator of ${inst?.name}` : "Platform Administrator",
    department: department?.trim() || "Operations",
    status: "active",
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: "Never"
  };

  db.users.push(newAdmin);

  if (isMainAdmin && inst) {
    inst.adminId = newAdmin.id;
    inst.adminName = newAdmin.name;
    inst.adminEmail = newAdmin.email;
  }

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Admin Created", `Created admin user: ${newAdmin.name} (${newAdmin.email})`, req.ip);

  const { passwordHash: _, ...safe } = newAdmin;
  res.status(201).json({ success: true, admin: safe, message: "New administrator created successfully." });
});

// SUB-ADMIN MANAGEMENT: Main Admin creates up to four Sub-Admins under him
// GET /sub-admins: List Sub-Admins for current Main Admin's institution
router.get('/sub-admins', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user!.role === 'superadmin';
  const targetInstituteId = isSuper
    ? (typeof req.query.instituteId === 'string' ? req.query.instituteId : undefined)
    : req.user!.instituteId;

  let subAdmins = db.users.filter(u => u.role === 'subadmin');
  if (targetInstituteId && targetInstituteId !== 'all') {
    subAdmins = subAdmins.filter(u => u.instituteId === targetInstituteId);
  } else if (!isSuper) {
    subAdmins = subAdmins.filter(u => u.parentAdminId === req.user!.id || u.instituteId === req.user!.instituteId);
  }

  const safeList = subAdmins.map(({ passwordHash: _, ...safe }) => ({
    ...safe,
    permissions: ["manage_books", "manage_notifications", "manage_meetings"],
    allowedActions: [
      "Manage Books (Add, Edit, Catalog)",
      "Create Announcements (Campus Notices)",
      "Create Meetings (Schedule, Host, Moderate)"
    ],
    restrictedActions: [
      "Institution Settings (Blocked)",
      "User Management (Blocked)"
    ]
  }));

  const count = safeList.length;
  const maxLimit = 4;
  const remaining = Math.max(0, maxLimit - count);

  res.json({
    success: true,
    subAdmins: safeList,
    count,
    maxLimit,
    remaining,
    instituteId: targetInstituteId,
    canCreate: count < maxLimit
  });
});

// POST /sub-admins: Main Admin Creates a Sub-Admin (Max 4 Sub-Admins per Main Admin)
router.post('/sub-admins', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, password, department, instituteId } = req.body;
  const isSuper = req.user!.role === 'superadmin';
  const targetInstituteId = isSuper ? (instituteId || 'inst_punjab') : req.user!.instituteId;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, username, email, and password are required." });
  }

  const inst = db.institutes.find(i => i.id === targetInstituteId);
  if (!inst) {
    return res.status(404).json({ success: false, error: "Target institution not found." });
  }

  // Enforce Max 4 Sub-Admins limit for this Main Admin / Institution
  const existingSubAdmins = db.users.filter(u => u.role === 'subadmin' && u.instituteId === targetInstituteId);
  if (existingSubAdmins.length >= 4) {
    return res.status(400).json({
      success: false,
      error: `Sub-Admin limit reached! Each Main Admin can create a maximum of 4 Sub-Admins under them. Current count: ${existingSubAdmins.length}/4.`
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, error: "Email already associated with an existing account." });
  }

  const newSubAdmin: User = {
    id: "subadmin_" + Date.now(),
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: "subadmin",
    roleId: "subadmin_role",
    adminType: "sub",
    parentAdminId: req.user!.id,
    parentAdminName: req.user!.name,
    instituteId: inst.id,
    instituteName: inst.name,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: `Sub-Admin for ${inst.name} - Delegated Authority: Books, Announcements, Meetings`,
    department: department?.trim() || "Operations",
    status: "active",
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: "Never"
  };

  db.users.push(newSubAdmin);

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Sub-Admin Created",
    `Main Admin ${req.user!.name} created Sub-Admin: ${newSubAdmin.name} (${newSubAdmin.email}) for ${inst.name}. Sub-Admin slot: ${existingSubAdmins.length + 1}/4`,
    req.ip
  );

  const { passwordHash: _, ...safe } = newSubAdmin;
  res.status(201).json({
    success: true,
    subAdmin: safe,
    count: existingSubAdmins.length + 1,
    maxLimit: 4,
    remaining: 4 - (existingSubAdmins.length + 1),
    message: `Sub-Admin created successfully (${existingSubAdmins.length + 1} of 4 slots used). Delegated permissions: Manage Books, Create Announcements, Create Meetings.`
  });
});

// DELETE /sub-admins/:id: Main Admin Deletes a Sub-Admin
router.delete('/sub-admins/:id', requireAuth, requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user!.role === 'superadmin';
  const subAdminIdx = db.users.findIndex(u => u.id === req.params.id && u.role === 'subadmin');
  if (subAdminIdx === -1) {
    return res.status(404).json({ success: false, error: "Sub-Admin not found." });
  }

  const subAdmin = db.users[subAdminIdx];
  if (!isSuper && subAdmin.instituteId !== req.user!.instituteId && subAdmin.parentAdminId !== req.user!.id) {
    return res.status(403).json({ success: false, error: "You can only manage Sub-Admins belonging to your own institution." });
  }

  db.users.splice(subAdminIdx, 1);
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Sub-Admin Deleted", `Removed Sub-Admin ${subAdmin.name}. Quota slot freed up.`, req.ip);

  res.json({ success: true, message: `Sub-Admin ${subAdmin.name} removed. Quota slot restored.` });
});

// Super Admin: Update Admin Role Assignment
router.put('/admins/:id/role', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: "Admin not found." });

  if (user.role === 'superadmin') {
    return res.status(403).json({ success: false, error: "Cannot reassign primary Super Admin role." });
  }

  const { roleId } = req.body;
  const role = db.roles.find(r => r.id === roleId);
  if (!role) return res.status(400).json({ success: false, error: "Selected role does not exist." });

  user.roleId = roleId;
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Admin Role Reassigned", `Reassigned ${user.name} to [${role.name}]`, req.ip);

  res.json({ success: true, message: `Admin assigned to ${role.name} role.` });
});

// 4. Role & Permission Management (RBAC)
router.get('/roles-permissions', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    roles: db.roles,
    permissions: db.permissions
  });
});

// Configure Permissions for a Role (Super Admin or permission)
router.put('/roles/:id/permissions', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const role = db.roles.find(r => r.id === req.params.id);
  if (!role) return res.status(404).json({ success: false, error: "Role not found." });

  if (role.id === 'superadmin_role') {
    return res.status(403).json({ success: false, error: "Super Admin permissions cannot be modified." });
  }

  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ success: false, error: "Permissions array required." });
  }

  role.permissions = permissions;
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Role Permissions Configured", `Updated permissions for [${role.name}]`, req.ip);

  res.json({ success: true, role, message: `Permissions updated for ${role.name}.` });
});

// 5. Activity & Security Logs
router.get('/logs', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { search, action } = req.query;

  let logs = [...db.activityLogs];

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    logs = logs.filter(l =>
      l.userName.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  }

  if (typeof action === 'string' && action && action !== 'all') {
    logs = logs.filter(l => l.action.toLowerCase() === action.toLowerCase());
  }

  res.json({ success: true, logs });
});

// Admin Broadcast Notification Route
router.post('/notifications/broadcast', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, message, type, targetGroup, targetAudience, scheduledAt } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, error: "Notice headline and message content are required." });
  }

  const effectiveTarget = targetGroup || targetAudience || 'all';

  const newNotif: Notification = {
    id: "notif_" + Date.now(),
    title: title.trim(),
    message: message.trim(),
    type: type || 'announcement',
    targetGroup: effectiveTarget,
    targetAudience: effectiveTarget,
    readBy: [],
    scheduledAt,
    createdAt: new Date().toISOString()
  };

  db.notifications.unshift(newNotif);
  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Notification Dispatched",
    `Broadcasted: "${newNotif.title}" to target group [${effectiveTarget}]`,
    req.ip
  );

  res.status(201).json({
    success: true,
    notification: newNotif,
    message: "Campus bulletin broadcasted successfully to all target recipients!"
  });
});

// 6. System Settings
router.get('/settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, settings: db.systemSettings });
});

router.put('/settings', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    platformName,
    tagline,
    supportEmail,
    maintenanceMode,
    maxFileSizeMB,
    allowedFileTypes,
    defaultTheme,
    aiModel,
    aiSystemInstruction,
    aiDailyLimit,
    enableRegistration
  } = req.body;

  if (platformName) db.systemSettings.platformName = platformName.trim();
  if (tagline) db.systemSettings.tagline = tagline.trim();
  if (supportEmail) db.systemSettings.supportEmail = supportEmail.trim();
  if (maintenanceMode !== undefined) db.systemSettings.maintenanceMode = Boolean(maintenanceMode);
  if (maxFileSizeMB !== undefined) db.systemSettings.maxFileSizeMB = Number(maxFileSizeMB);
  if (Array.isArray(allowedFileTypes)) db.systemSettings.allowedFileTypes = allowedFileTypes;
  if (defaultTheme) db.systemSettings.defaultTheme = defaultTheme;
  if (aiModel) db.systemSettings.aiModel = aiModel;
  if (aiSystemInstruction) db.systemSettings.aiSystemInstruction = aiSystemInstruction;
  if (aiDailyLimit !== undefined) db.systemSettings.aiDailyLimit = Number(aiDailyLimit);
  if (enableRegistration !== undefined) db.systemSettings.enableRegistration = Boolean(enableRegistration);

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "System Settings Updated", "Modified global platform configuration", req.ip);

  res.json({ success: true, settings: db.systemSettings, message: "System settings saved successfully." });
});

export default router;

/**
 * Dot X Library - Notifications Routes
 */
import { Router, Response } from 'express';
import { db, Notification } from '../db.js';
import { AuthenticatedRequest, requireAuth, requirePermission } from '../auth.js';

const router = Router();

// Get Notifications for Current User
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user ? req.user.id : null;
  const userRole = req.user ? req.user.role : 'guest';
  const userInstituteId = req.user?.instituteId;
  const isSuper = userRole === 'superadmin';

  // Institute Scoping
  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const queryInst = typeof req.query.instituteId === 'string' ? req.query.instituteId : undefined;
  const activeScope = headerInst || queryInst;

  // Filter based on targetGroup, visibility (Option 1: institute-only vs Option 2: global) and instituteId
  let list = db.notifications.filter(n => {
    // 1. Role-based check
    if (n.targetGroup === 'students' && (userRole !== 'student' && userRole !== 'admin' && userRole !== 'superadmin')) return false;
    if (n.targetGroup === 'teachers' && (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'superadmin')) return false;
    if (n.targetGroup === 'admins' && (userRole !== 'admin' && userRole !== 'superadmin')) return false;

    // 2. Visibility & Institute Scoping:
    // Option 2: Show Global (All Students across all campuses)
    const isGlobalAnnouncement = n.visibility === 'global' || n.isGlobal === true || !n.instituteId || n.instituteId === 'all';

    if (isGlobalAnnouncement) {
      // Global announcements are shown to all students across all institutes
      if (isSuper && activeScope && activeScope !== 'all') {
        // Super admin filter: show if matches active scope or was dispatched globally
        if (n.instituteId && n.instituteId !== activeScope && n.visibility !== 'global') {
          return false;
        }
      }
      return true;
    }

    // Option 1: Only show to institute students (Institute-Only)
    // Strictly restricted to enrolled students and staff of that specific institute
    if (!req.user || userRole === 'guest') {
      return false; // Guests cannot view private institute-only announcements
    }

    if (userRole === 'student') {
      if (!userInstituteId || userInstituteId !== n.instituteId) {
        return false;
      }
    } else if (userRole === 'admin' && !isSuper) {
      // Institute admins see announcements for their own institute
      if (!userInstituteId || userInstituteId !== n.instituteId) {
        return false;
      }
    } else if (userRole === 'teacher') {
      if (!userInstituteId || userInstituteId !== n.instituteId) {
        return false;
      }
    } else if (isSuper) {
      if (activeScope && activeScope !== 'all' && n.instituteId !== activeScope) {
        return false;
      }
    }

    return true;
  });

  // Calculate read status
  const formatted = list.map(n => ({
    ...n,
    isRead: userId ? n.readBy.includes(userId) : false
  }));

  formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, notifications: formatted });
});

// Mark Single Notification as Read
router.post('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });

  const userId = req.user!.id;
  if (!notif.readBy.includes(userId)) {
    notif.readBy.push(userId);
  }

  res.json({ success: true, message: "Notification marked as read." });
});

// Mark All as Read
router.post('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  db.notifications.forEach(n => {
    if (!n.readBy.includes(userId)) {
      n.readBy.push(userId);
    }
  });

  res.json({ success: true, message: "All notifications marked as read." });
});

// ADMIN: Create & Broadcast Notification
router.post('/', requireAuth, requirePermission('manage_notifications'), (req: AuthenticatedRequest, res: Response) => {
  const { title, message, type, targetGroup, targetAudience, scheduledAt, instituteId, instituteName, visibility, scope } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, error: "Title and message are required." });
  }

  const effectiveTarget = targetGroup || targetAudience || 'all';
  const isSuper = req.user?.role === 'superadmin';

  // Option 1: 'institute' (only show on institute students)
  // Option 2: 'global' (show global to all students across all institutes)
  const chosenVisibility: 'institute' | 'global' = (visibility === 'global' || scope === 'global' || instituteId === 'all')
    ? 'global'
    : 'institute';

  // Originating Institute details:
  let assignedInstId = isSuper ? (instituteId || req.user?.instituteId) : (req.user?.instituteId || instituteId);
  let assignedInstName = isSuper ? (instituteName || req.user?.instituteName) : (req.user?.instituteName || instituteName);

  if (assignedInstId && assignedInstId !== 'all' && !assignedInstName) {
    const inst = db.institutes.find(i => i.id === assignedInstId);
    if (inst) assignedInstName = inst.name;
  }

  const newNotif: Notification = {
    id: "notif_" + Date.now(),
    title: title.trim(),
    message: message.trim(),
    type: type || 'announcement',
    targetGroup: effectiveTarget,
    targetAudience: effectiveTarget,
    visibility: chosenVisibility,
    isGlobal: chosenVisibility === 'global',
    instituteId: assignedInstId && assignedInstId !== 'all' ? assignedInstId : undefined,
    instituteName: assignedInstName,
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
    `Sent: ${newNotif.title} [${chosenVisibility === 'global' ? 'Option 2: Global' : 'Option 1: Institute-Only'}] for ${assignedInstName || 'Global'}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    notification: newNotif,
    message: chosenVisibility === 'global'
      ? `Global announcement broadcasted to all students across every institute on the platform!`
      : `Announcement securely routed only to students enrolled in ${assignedInstName || 'this institute'}.`
  });
});

// Broadcast Alias (/notifications/broadcast)
router.post('/broadcast', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, message, type, targetGroup, targetAudience, scheduledAt, instituteId, instituteName, visibility, scope } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, error: "Title and message are required." });
  }

  const effectiveTarget = targetGroup || targetAudience || 'all';
  const isSuper = req.user?.role === 'superadmin';

  // Option 1: 'institute' (only show on institute students)
  // Option 2: 'global' (show global to all students across all institutes)
  const chosenVisibility: 'institute' | 'global' = (visibility === 'global' || scope === 'global' || instituteId === 'all')
    ? 'global'
    : 'institute';

  let assignedInstId = isSuper ? (instituteId || req.user?.instituteId) : (req.user?.instituteId || instituteId);
  let assignedInstName = isSuper ? (instituteName || req.user?.instituteName) : (req.user?.instituteName || instituteName);

  if (assignedInstId && assignedInstId !== 'all' && !assignedInstName) {
    const inst = db.institutes.find(i => i.id === assignedInstId);
    if (inst) assignedInstName = inst.name;
  }

  const newNotif: Notification = {
    id: "notif_" + Date.now(),
    title: title.trim(),
    message: message.trim(),
    type: type || 'announcement',
    targetGroup: effectiveTarget,
    targetAudience: effectiveTarget,
    visibility: chosenVisibility,
    isGlobal: chosenVisibility === 'global',
    instituteId: assignedInstId && assignedInstId !== 'all' ? assignedInstId : undefined,
    instituteName: assignedInstName,
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
    `Sent: ${newNotif.title} [${chosenVisibility === 'global' ? 'Option 2: Global' : 'Option 1: Institute-Only'}] for ${assignedInstName || 'Global'}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    notification: newNotif,
    message: chosenVisibility === 'global'
      ? `Global announcement broadcasted to all students across every institute on the platform!`
      : `Announcement securely routed only to students enrolled in ${assignedInstName || 'this institute'}.`
  });
});

// ADMIN: Delete Notification
router.delete('/:id', requireAuth, requirePermission('manage_notifications'), (req: AuthenticatedRequest, res: Response) => {
  const idx = db.notifications.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Notification not found" });

  const removed = db.notifications.splice(idx, 1)[0];
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Notification Deleted", `Deleted: ${removed.title}`, req.ip);

  res.json({ success: true, message: "Notification deleted." });
});

export default router;

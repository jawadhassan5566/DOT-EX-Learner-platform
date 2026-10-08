/**
 * Dot X Library - Online Classroom & Meeting Routes
 */
import { Router, Response } from 'express';
import { db, Meeting, MeetingMessage } from '../db.js';
import { AuthenticatedRequest, requireAuth, requirePermission } from '../auth.js';
import { activeScreenShares } from '../meetingSocket.js';

const router = Router();

// Get Meetings (Filter by upcoming, live, completed)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { status, category, instituteId } = req.query;

  let list = [...db.meetings];

  // Institute Scoping (Header takes precedence, then query param, then non-superadmin user's institute)
  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const instituteScope = headerInst || (typeof instituteId === 'string' ? instituteId : undefined);
  if (instituteScope && instituteScope !== 'all') {
    list = list.filter(m => m.instituteId === instituteScope);
  }

  if (typeof status === 'string' && status) {
    list = list.filter(m => m.status === status);
  }

  if (typeof category === 'string' && category && category !== 'all') {
    list = list.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }

  // Sort: live first, then upcoming by date, then completed
  list.sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return new Date(b.scheduledDate + ' ' + b.startTime).getTime() - new Date(a.scheduledDate + ' ' + a.startTime).getTime();
  });

  res.json({ success: true, meetings: list });
});

// Export Attendance as CSV format directly from API
router.get('/attendance/export-csv', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, instituteId } = req.query;
  let list = [...db.meetingAttendance];

  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const instituteScope = headerInst || (typeof instituteId === 'string' ? instituteId : undefined);
  if (instituteScope && instituteScope !== 'all') {
    list = list.filter(a => a.instituteId === instituteScope);
  }

  if (typeof meetingId === 'string' && meetingId && meetingId !== 'all') {
    list = list.filter(a => a.meetingId === meetingId);
  }

  const csvRows = [
    [
      "Attendance ID",
      "Meeting Title",
      "Room Code",
      "Category",
      "Host / Professor",
      "Institute",
      "Participant Name",
      "Email Address",
      "Role",
      "Academic Department",
      "Join Timestamp",
      "Duration (Minutes)",
      "Attendance Status",
      "Device / Client",
      "IP Address"
    ]
  ];

  for (const record of list) {
    csvRows.push([
      record.id,
      record.meetingTitle,
      record.meetCode,
      record.category,
      record.hostName,
      record.instituteName || "Dot X Central University",
      record.userName,
      record.userEmail,
      record.userRole,
      record.department || "General",
      new Date(record.joinedAt).toLocaleString(),
      record.durationMinutes.toString(),
      record.status.toUpperCase(),
      record.device || "Desktop Web",
      record.ipAddress || "N/A"
    ]);
  }

  const csvContent = "\uFEFF" + csvRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  const filename = meetingId && meetingId !== 'all'
    ? `Meeting_Attendance_${meetingId}_${new Date().toISOString().split('T')[0]}.csv`
    : `Live_Meeting_Attendance_Records_${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// Get Meeting Attendance List
router.get('/attendance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, instituteId, status, search } = req.query;

  let list = [...db.meetingAttendance];

  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const instituteScope = headerInst || (typeof instituteId === 'string' ? instituteId : undefined);
  if (instituteScope && instituteScope !== 'all') {
    list = list.filter(a => a.instituteId === instituteScope);
  }

  if (typeof meetingId === 'string' && meetingId && meetingId !== 'all') {
    list = list.filter(a => a.meetingId === meetingId);
  }

  if (typeof status === 'string' && status && status !== 'all') {
    list = list.filter(a => a.status === status);
  }

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(a =>
      a.userName.toLowerCase().includes(q) ||
      a.userEmail.toLowerCase().includes(q) ||
      a.meetingTitle.toLowerCase().includes(q) ||
      a.meetCode.toLowerCase().includes(q) ||
      (a.department && a.department.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

  res.json({ success: true, attendance: list, total: list.length });
});

// Get Meeting by Code (e.g. CS-401 or link code)
router.get('/code/:code', (req: AuthenticatedRequest, res: Response) => {
  const code = req.params.code.trim().toUpperCase();
  const meeting = db.meetings.find(m => m.meetCode.toUpperCase() === code);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found with this code." });

  // Ensure live status so audio and video are live for anyone who opens code or link
  meeting.status = 'live';

  const messages = db.meetingMessages.filter(mm => mm.meetingId === meeting.id);
  const whiteboardData = db.whiteboardStates[meeting.id] || null;
  const activeScreenShare = activeScreenShares.get(meeting.id) || null;

  res.json({
    success: true,
    meeting,
    messages,
    whiteboardData,
    activeScreenShare
  });
});

// Get Single Meeting Details
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const meeting = db.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found" });

  const messages = db.meetingMessages.filter(mm => mm.meetingId === meeting.id);
  const whiteboardData = db.whiteboardStates[meeting.id] || null;
  const activeScreenShare = activeScreenShares.get(meeting.id) || null;

  res.json({
    success: true,
    meeting,
    messages,
    whiteboardData,
    activeScreenShare
  });
});

// Join Meeting (Simulated Real-Time Room Entry)
router.post('/:id/join', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const meeting = db.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found" });

  if (meeting.status === 'completed' || meeting.status === 'cancelled') {
    return res.status(400).json({ success: false, error: "This meeting is no longer active." });
  }

  // Ensure meeting is live so audio and video are immediately active for anyone who opens the link or code
  meeting.status = 'live';
  meeting.participantsCount = Math.min(meeting.maxParticipants, meeting.participantsCount + 1);

  // Record Attendance in Database
  const existingAttendance = db.meetingAttendance.find(
    a => a.meetingId === meeting.id && a.userId === req.user!.id
  );
  if (!existingAttendance) {
    db.meetingAttendance.unshift({
      id: "att_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetCode: meeting.meetCode,
      category: meeting.category,
      hostName: meeting.hostName,
      instituteId: meeting.instituteId,
      instituteName: meeting.instituteName,
      userId: req.user!.id,
      userName: req.user!.name,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      department: req.user!.department || "General",
      joinedAt: new Date().toISOString(),
      durationMinutes: 1,
      status: "active",
      device: (req.headers['user-agent']?.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'),
      ipAddress: req.ip || '127.0.0.1'
    });
  }

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Joined Classroom", `Joined session: ${meeting.title}`, req.ip);

  res.json({
    success: true,
    meeting,
    message: "Connected to virtual classroom audio/video gateway."
  });
});

// Send Chat Message inside Meeting
router.post('/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const meeting = db.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found" });

  if (!meeting.allowChat && req.user!.role !== 'admin' && req.user!.role !== 'superadmin' && req.user!.id !== meeting.hostId) {
    return res.status(403).json({ success: false, error: "Meeting chat has been disabled by the host." });
  }

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ success: false, error: "Message cannot be empty." });

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg: MeetingMessage = {
    id: "mm_" + Date.now(),
    meetingId: meeting.id,
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderRole: req.user!.role,
    text: text.trim(),
    timestamp: timeStr
  };

  db.meetingMessages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// Synchronize Collaborative Whiteboard State
router.post('/:id/whiteboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const meeting = db.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found" });

  const { canvasData, isOpen } = req.body;
  if (canvasData !== undefined) {
    db.whiteboardStates[meeting.id] = canvasData;
  }
  if (isOpen !== undefined) {
    meeting.isWhiteboardOpen = Boolean(isOpen);
  }

  res.json({
    success: true,
    message: "Whiteboard state synchronized.",
    isWhiteboardOpen: meeting.isWhiteboardOpen
  });
});

// Host / Admin Controls (Mute all, Toggle whiteboard/chat/screenshare, End meeting)
router.post('/:id/host-control', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const meeting = db.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ success: false, error: "Meeting not found" });

  // Only host or admin can control
  const isHost = meeting.hostId === req.user!.id;
  const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';
  if (!isHost && !isAdmin) {
    return res.status(403).json({ success: false, error: "Only the meeting host or platform administrator can perform this action." });
  }

  const { action, value } = req.body;

  if (action === 'toggle_chat') {
    meeting.allowChat = value !== undefined ? Boolean(value) : !meeting.allowChat;
  } else if (action === 'toggle_whiteboard') {
    meeting.allowWhiteboard = value !== undefined ? Boolean(value) : !meeting.allowWhiteboard;
  } else if (action === 'toggle_screenshare') {
    meeting.allowScreenShare = value !== undefined ? Boolean(value) : !meeting.allowScreenShare;
  } else if (action === 'end_meeting') {
    meeting.status = 'completed';
    meeting.participantsCount = 0;
  } else if (action === 'start_meeting') {
    meeting.status = 'live';
  }

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Meeting Host Control", `Action: ${action} on ${meeting.title}`, req.ip);

  res.json({ success: true, meeting, message: `Host action [${action}] executed successfully.` });
});

// Create Meeting (Teachers, Students, Admins)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    category,
    scheduledDate,
    startTime,
    durationMinutes,
    maxParticipants,
    allowChat,
    allowWhiteboard,
    allowScreenShare,
    isInstant
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: "Meeting title is required." });
  }

  const now = new Date();
  const dateStr = scheduledDate || now.toISOString().split('T')[0];
  const timeStr = startTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const code = (title.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'DOT').toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
  const meetId = "meet_" + Date.now();

  const origin = req.get('origin') || req.get('referer') || '';
  const shareLink = origin ? `${origin.replace(/\/$/, '')}/?meetingId=${meetId}&meetCode=${code}` : `/?meetingId=${meetId}&meetCode=${code}`;

  const targetInstId = req.body.instituteId || (req.headers['x-institute-id'] as string) || req.user!.instituteId || 'inst_dotx';
  const targetInst = db.institutes.find(i => i.id === targetInstId);

  const newMeeting: Meeting = {
    id: meetId,
    title: title.trim(),
    description: description || "Collaborative online lecture and academic discussion.",
    hostId: req.user!.id,
    hostName: req.user!.name,
    instituteId: targetInstId,
    instituteName: targetInst?.name || "Dot X Central University",
    category: category || "General Academic",
    scheduledDate: dateStr,
    startTime: timeStr,
    durationMinutes: Number(durationMinutes) || 60,
    status: "live", // Live immediately for anyone who opens the link or joins with code
    meetCode: code,
    shareLink,
    allowChat: allowChat !== false,
    allowWhiteboard: allowWhiteboard !== false,
    allowScreenShare: allowScreenShare !== false,
    participantsCount: 1,
    maxParticipants: Number(maxParticipants) || 100
  };

  db.meetings.unshift(newMeeting);
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Meeting Created", `Scheduled: ${newMeeting.title} (${code})`, req.ip);

  res.status(201).json({ 
    success: true, 
    meeting: newMeeting, 
    shareLink,
    message: isInstant ? "Instant meeting launched! Share link generated." : "Classroom meeting scheduled successfully!" 
  });
});

// ADMIN: Cancel / Delete Meeting
router.delete('/:id', requireAuth, requirePermission('manage_meetings'), (req: AuthenticatedRequest, res: Response) => {
  const idx = db.meetings.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Meeting not found" });

  const removed = db.meetings.splice(idx, 1)[0];
  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Meeting Deleted", `Cancelled: ${removed.title}`, req.ip);

  res.json({ success: true, message: "Meeting deleted successfully." });
});

export default router;

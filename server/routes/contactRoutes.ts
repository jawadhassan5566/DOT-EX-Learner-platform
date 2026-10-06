/**
 * Dot X Library - Contact Us, Support & Book Inquiries
 */
import { Router, Response } from 'express';
import { db, ContactMessage, Institute } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// Submit Contact Message / Complaint / Book Request / Academic Problem
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, type, subject, message, instituteId, instituteName } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: "Please fill in all required fields." });
  }

  const validTypes = ['contact', 'book_request', 'academic_problem', 'support', 'complaint', 'grievance'];
  const msgType = validTypes.includes(type) ? type : 'contact';

  // 1. Identify Target Institution & Main Admin
  let targetInst: Institute | undefined;

  if (instituteId) {
    targetInst = db.institutes.find(i =>
      i.id.toLowerCase() === instituteId.toLowerCase() ||
      i.code.toLowerCase() === instituteId.toLowerCase() ||
      i.name.toLowerCase() === instituteId.toLowerCase()
    );
  }

  if (!targetInst && instituteName) {
    targetInst = db.institutes.find(i =>
      i.name.toLowerCase().includes(instituteName.toLowerCase()) ||
      i.code.toLowerCase().includes(instituteName.toLowerCase())
    );
  }

  // Fallback to authenticated user's institute if not specified
  if (!targetInst && req.user?.instituteId) {
    targetInst = db.institutes.find(i => i.id === req.user!.instituteId);
  }

  // Fallback to Punjab College if query explicitly matches punjab, else Dot X Central
  if (!targetInst) {
    targetInst = db.institutes.find(i => i.id === 'inst_punjab') || db.institutes[0];
  }

  const adminEmail = targetInst.adminEmail || "admin@punjabcollege.edu";
  const adminName = targetInst.adminName || "Main Admin";
  const instId = targetInst.id;
  const instName = targetInst.name;
  const now = new Date().toISOString();
  const ticketId = "ticket_" + Date.now();

  // 2. Create the ticket with automated forwarding metadata
  const newTicket: ContactMessage = {
    id: ticketId,
    name: name.trim(),
    email: email.trim(),
    type: msgType as any,
    subject: subject.trim(),
    message: message.trim(),
    status: "new",
    instituteId: instId,
    instituteName: instName,
    forwardedToAdminEmail: adminEmail,
    forwardedToAdminName: adminName,
    forwardedAt: now,
    deliveryStatus: 'delivered',
    createdAt: now,
    updatedAt: now
  };

  db.contactMessages.unshift(newTicket);

  // 3. Dispatch automated notification to the Institution's Main Admin
  db.notifications.unshift({
    id: "notif_contact_" + Date.now(),
    title: `[${msgType === 'complaint' ? 'Urgent Student Complaint' : 'Academic Inquiry'}] Forwarded to ${adminName}`,
    message: `A message from ${name.trim()} (${email.trim()}) was automatically delivered to Main Admin email (${adminEmail}) for ${instName}: "${subject.trim()}".`,
    type: "contact",
    targetGroup: "admins",
    instituteId: instId,
    instituteName: instName,
    visibility: "institute",
    isGlobal: false,
    readBy: [],
    createdAt: now
  });

  // 4. Log the audit activity
  db.logAction(
    req.user ? req.user.id : "guest",
    name,
    req.user ? req.user.role : "guest",
    "Message Forwarded to Main Admin",
    `Auto-forwarded [${msgType}] to Main Admin (${adminEmail}) of ${instName}: ${subject.trim()}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    message: `Your ${msgType === 'complaint' ? 'complaint' : 'message'} has been automatically forwarded and delivered to the Main Admin of ${instName} (${adminName}) at ${adminEmail}.`,
    ticketId: newTicket.id,
    delivery: {
      recipientEmail: adminEmail,
      recipientName: adminName,
      instituteId: instId,
      instituteName: instName,
      forwardedAt: now
    }
  });
});

// ADMIN: Get All Contact Submissions
router.get('/', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, type, instituteId } = req.query;

  let list = [...db.contactMessages];

  // Institute Scoping
  const headerInst = req.headers['x-institute-id'] as string | undefined;
  const instituteScope = headerInst || (typeof instituteId === 'string' ? instituteId : undefined);
  if (instituteScope && instituteScope !== 'all' && req.user?.role !== 'superadmin') {
    list = list.filter(m => m.instituteId === instituteScope);
  }

  if (typeof status === 'string' && status) {
    list = list.filter(m => m.status === status);
  }
  if (typeof type === 'string' && type) {
    list = list.filter(m => m.type === type);
  }

  res.json({ success: true, messages: list });
});

// ADMIN: Update Status & Provide Official Academic Response
router.put('/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ticket = db.contactMessages.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found." });

  const { status, adminResponse } = req.body;
  if (status) ticket.status = status;
  if (adminResponse !== undefined) ticket.adminResponse = adminResponse;
  ticket.updatedAt = new Date().toISOString();

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Ticket Updated",
    `Status changed to [${ticket.status}] for ${ticket.id}`,
    req.ip
  );

  res.json({ success: true, ticket, message: "Ticket updated successfully." });
});

export default router;

/**
 * Dot X Library - Direct & Group Messaging Routes
 */
import { Router, Response } from 'express';
import { db, ChatConversation, ChatMessage } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();

// Get Current User's Conversations
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // Find conversations where user is a participant
  let userConvs = db.chatConversations.filter(c => c.participantIds.includes(userId));

  // If user has no conversations yet, create default direct chats with Main Admin and Teacher
  if (userConvs.length === 0) {
    const admin = db.users.find(u => u.role === 'superadmin') || db.users[0];
    const teacher = db.users.find(u => u.role === 'teacher') || db.users[1];

    if (admin && admin.id !== userId) {
      const convAdmin: ChatConversation = {
        id: `conv_${admin.id}_${userId}`,
        participantIds: [admin.id, userId],
        participantDetails: [
          { id: admin.id, name: admin.name, avatar: admin.avatar, role: admin.role },
          { id: userId, name: req.user!.name, avatar: req.user!.avatar, role: req.user!.role }
        ],
        lastMessage: "Welcome to Dot X Library! Feel free to reach out with any academic questions.",
        lastMessageTime: "Just now",
        unreadCount: 1
      };
      db.chatConversations.push(convAdmin);
      db.chatMessages.push({
        id: "cm_init_" + Date.now(),
        conversationId: convAdmin.id,
        senderId: admin.id,
        senderName: admin.name,
        text: "Welcome to Dot X Library! Feel free to reach out with any academic questions.",
        createdAt: new Date().toISOString(),
        isRead: false
      });
      userConvs.push(convAdmin);
    }
  }

  res.json({ success: true, conversations: userConvs });
});

// Get Messages for a specific conversation
router.get('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const conv = db.chatConversations.find(c => c.id === id);
  if (!conv || !conv.participantIds.includes(userId)) {
    return res.status(403).json({ success: false, error: "Access denied to conversation." });
  }

  const messages = db.chatMessages.filter(m => m.conversationId === id);
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Mark unread messages as read
  messages.forEach(m => {
    if (m.senderId !== userId) m.isRead = true;
  });
  conv.unreadCount = 0;

  res.json({ success: true, conversation: conv, messages });
});

// Send Message
router.post('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { text, attachmentUrl } = req.body;
  const userId = req.user!.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: "Message text cannot be empty." });
  }

  const conv = db.chatConversations.find(c => c.id === id);
  if (!conv || !conv.participantIds.includes(userId)) {
    return res.status(403).json({ success: false, error: "Access denied to conversation." });
  }

  const newMsg: ChatMessage = {
    id: "cm_" + Date.now(),
    conversationId: id,
    senderId: userId,
    senderName: req.user!.name,
    text: text.trim(),
    attachmentUrl,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  db.chatMessages.push(newMsg);
  conv.lastMessage = text.trim();
  conv.lastMessageTime = "Just now";

  // Simulate automated friendly professor/faculty response if user messages teacher
  const otherId = conv.participantIds.find(p => p !== userId);
  const otherUser = db.users.find(u => u.id === otherId);
  if (otherUser && (otherUser.role === 'teacher' || otherUser.role === 'admin')) {
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: "cm_reply_" + Date.now(),
        conversationId: id,
        senderId: otherUser.id,
        senderName: otherUser.name,
        text: `Thank you for your message, ${req.user!.name}. I've logged this academic inquiry and will discuss it during our upcoming office hours or live classroom.`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      db.chatMessages.push(autoReply);
      conv.lastMessage = autoReply.text;
      conv.lastMessageTime = "Just now";
    }, 1200);
  }

  res.status(201).json({ success: true, message: newMsg });
});

// Start New Conversation with a User
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user!.id;

  if (!targetUserId || targetUserId === currentUserId) {
    return res.status(400).json({ success: false, error: "Invalid recipient user." });
  }

  const target = db.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ success: false, error: "Recipient user not found." });

  // Check if conversation already exists
  let conv = db.chatConversations.find(c =>
    c.participantIds.includes(currentUserId) && c.participantIds.includes(targetUserId)
  );

  if (!conv) {
    conv = {
      id: `conv_${currentUserId}_${targetUserId}_${Date.now()}`,
      participantIds: [currentUserId, targetUserId],
      participantDetails: [
        { id: req.user!.id, name: req.user!.name, avatar: req.user!.avatar, role: req.user!.role },
        { id: target.id, name: target.name, avatar: target.avatar, role: target.role }
      ],
      lastMessage: "Conversation opened",
      lastMessageTime: "Just now",
      unreadCount: 0
    };
    db.chatConversations.unshift(conv);
  }

  res.json({ success: true, conversation: conv });
});

export default router;

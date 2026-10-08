/**
 * Dot X Library - Study Lectures & Media Routes
 * Admins upload lecture videos and study pictures with Private (Institute only) or Global visibility.
 * Students and users can like, react (names of reactors recorded & shown), comment, and share.
 */
import { Router, Response } from 'express';
import { db, LectureMedia, LectureReaction, LectureComment } from '../db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// 1. Get Lectures & Study Media
// Access Control:
// - Global lectures are visible to everyone (all users and guests).
// - Private lectures are visible only to students, teachers, admins, and staff of that institute.
// - Super Admins can see all lectures across all institutes.
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const userInstituteId = user?.instituteId;
  const isSuperAdmin = user?.role === 'superadmin';

  const { search, mediaType, subject, visibility, instituteId } = req.query;

  let list = db.lectureMedia.filter((item) => {
    // Visibility access control:
    if (item.visibility === 'global') {
      return true;
    }
    // Private item:
    if (!user) {
      return false; // Guests cannot view private institute materials
    }
    if (isSuperAdmin) {
      return true; // Super Admin can review all institute materials
    }
    // Must match the user's institute
    return userInstituteId && item.instituteId === userInstituteId;
  });

  // Query Filters
  if (mediaType && mediaType !== 'all') {
    list = list.filter(item => item.mediaType === mediaType);
  }

  if (subject && subject !== 'all') {
    list = list.filter(item => item.subject.toLowerCase() === String(subject).toLowerCase());
  }

  if (visibility && visibility !== 'all') {
    list = list.filter(item => item.visibility === visibility);
  }

  if (instituteId && instituteId !== 'all') {
    list = list.filter(item => item.instituteId === instituteId);
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase();
    list = list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      (item.topic && item.topic.toLowerCase().includes(q)) ||
      item.uploaderName.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Sort by newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    count: list.length,
    lectures: list
  });
});

// 2. Get Single Lecture by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const isSuperAdmin = user?.role === 'superadmin';
  const lecture = db.lectureMedia.find(l => l.id === req.params.id);

  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  // Private permission check
  if (lecture.visibility === 'private') {
    if (!user || (!isSuperAdmin && user.instituteId !== lecture.instituteId)) {
      return res.status(403).json({
        success: false,
        error: "Access restricted. This lecture is private to students and staff of " + lecture.instituteName + "."
      });
    }
  }

  res.json({ success: true, lecture });
});

// 3. Upload Lecture Video or Study Picture
// All admins (Super Admin, Main Admin, Sub-Admin) can upload!
router.post('/', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    title,
    description,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    visibility = 'global',
    subject,
    topic,
    courseLevel = 'Undergraduate',
    durationMinutes,
    tags = []
  } = req.body;

  if (!title || !description || !mediaType || !mediaUrl || !subject) {
    return res.status(400).json({
      success: false,
      error: "Title, description, media type (video/picture), media URL, and subject are required."
    });
  }

  if (!['video', 'picture'].includes(mediaType)) {
    return res.status(400).json({
      success: false,
      error: "Media type must be either 'video' or 'picture'."
    });
  }

  if (!['private', 'global'].includes(visibility)) {
    return res.status(400).json({
      success: false,
      error: "Visibility must be either 'private' (institute only) or 'global' (everyone)."
    });
  }

  // Resolve institute for private attribution
  let instId = user.instituteId || 'inst_mit';
  let instName = user.instituteName || 'Dot X Academic Institute';

  if (req.body.instituteId && (user.role === 'superadmin' || user.role === 'admin')) {
    const inst = db.institutes.find(i => i.id === req.body.instituteId);
    if (inst) {
      instId = inst.id;
      instName = inst.name;
    }
  }

  // Format tags
  const processedTags: string[] = Array.isArray(tags)
    ? tags.map(t => String(t).trim()).filter(Boolean)
    : typeof tags === 'string'
    ? tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const newLecture: LectureMedia = {
    id: "lec_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    description: description.trim(),
    mediaType,
    mediaUrl,
    thumbnailUrl: thumbnailUrl || (mediaType === 'picture' ? mediaUrl : undefined),
    uploaderId: user.id,
    uploaderName: user.name,
    uploaderRole: user.role,
    uploaderAvatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
    instituteId: instId,
    instituteName: instName,
    visibility,
    subject: subject.trim(),
    topic: topic ? topic.trim() : undefined,
    courseLevel,
    durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
    tags: processedTags,
    likesCount: 0,
    likedUserIds: [],
    reactions: [],
    comments: [],
    sharesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.lectureMedia.unshift(newLecture);

  // Log action
  db.logAction(
    user.id,
    user.name,
    user.role,
    "Lecture Upload",
    `Uploaded ${mediaType} "${newLecture.title}" (${visibility.toUpperCase()} for ${instName})`,
    req.ip
  );

  // Send notification to institute students or global students
  db.notifications.unshift({
    id: "notif_lec_" + Date.now(),
    title: `📚 New ${mediaType === 'video' ? 'Video Lecture' : 'Study Picture'} Posted!`,
    message: `${user.name} uploaded "${newLecture.title}" for ${subject}.`,
    type: 'announcement',
    targetGroup: 'all',
    instituteId: visibility === 'private' ? instId : undefined,
    instituteName: visibility === 'private' ? instName : undefined,
    visibility: visibility === 'private' ? 'institute' : 'global',
    isGlobal: visibility === 'global',
    readBy: [],
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    lecture: newLecture,
    message: `Lecture ${mediaType} "${newLecture.title}" successfully published as ${visibility === 'private' ? 'Private (Institute Only)' : 'Global'}!`
  });
});

// 4. Update Lecture Description / Minor Info
router.put('/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const lecture = db.lectureMedia.find(l => l.id === req.params.id);

  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  // Only the uploading admin or superadmin can edit
  if (lecture.uploaderId !== user.id && user.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: "You can only edit lectures you uploaded." });
  }

  const { title, description, visibility, subject, topic, courseLevel, durationMinutes, tags, mediaUrl, thumbnailUrl } = req.body;

  if (title) lecture.title = title.trim();
  if (description) lecture.description = description.trim();
  if (visibility && ['private', 'global'].includes(visibility)) lecture.visibility = visibility;
  if (subject) lecture.subject = subject.trim();
  if (topic !== undefined) lecture.topic = topic.trim();
  if (courseLevel) lecture.courseLevel = courseLevel;
  if (durationMinutes !== undefined) lecture.durationMinutes = Number(durationMinutes) || undefined;
  if (mediaUrl) lecture.mediaUrl = mediaUrl;
  if (thumbnailUrl !== undefined) lecture.thumbnailUrl = thumbnailUrl;
  if (tags) {
    lecture.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : lecture.tags;
  }

  lecture.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    lecture,
    message: "Lecture updated successfully."
  });
});

// 5. Delete Lecture
router.delete('/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const index = db.lectureMedia.findIndex(l => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  const lecture = db.lectureMedia[index];

  // Only the uploading admin or superadmin can delete
  if (lecture.uploaderId !== user.id && user.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: "You can only delete lectures you uploaded." });
  }

  db.lectureMedia.splice(index, 1);

  db.logAction(
    user.id,
    user.name,
    user.role,
    "Lecture Deleted",
    `Deleted lecture "${lecture.title}"`,
    req.ip
  );

  res.json({
    success: true,
    message: `Lecture "${lecture.title}" deleted.`
  });
});

// 6. Like / Unlike Lecture
router.post('/:id/like', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const lecture = db.lectureMedia.find(l => l.id === req.params.id);

  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  if (!Array.isArray(lecture.likedUserIds)) {
    lecture.likedUserIds = [];
  }
  if (!Array.isArray(lecture.reactions)) {
    lecture.reactions = [];
  }

  const likedIndex = lecture.likedUserIds.indexOf(user.id);
  let isLiked = false;

  if (likedIndex === -1) {
    lecture.likedUserIds.push(user.id);
    lecture.likesCount += 1;
    isLiked = true;

    // Record user in reactions so their name and profile preview are available
    const rIdx = lecture.reactions.findIndex(r => r.userId === user.id);
    if (rIdx === -1) {
      lecture.reactions.push({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        userRole: user.role,
        reactionType: 'like',
        createdAt: new Date().toISOString()
      });
    }
  } else {
    lecture.likedUserIds.splice(likedIndex, 1);
    lecture.likesCount = Math.max(0, lecture.likesCount - 1);
    isLiked = false;

    // Remove from reactions if it was 'like'
    const rIdx = lecture.reactions.findIndex(r => r.userId === user.id && r.reactionType === 'like');
    if (rIdx !== -1) {
      lecture.reactions.splice(rIdx, 1);
    }
  }

  res.json({
    success: true,
    isLiked,
    likesCount: lecture.likesCount,
    likedUserIds: lecture.likedUserIds,
    reactions: lecture.reactions
  });
});

// 7. React to Lecture (with reactor name shown!)
// Allows reactions: 'like' (👍), 'love' (❤️), 'insightful' (💡), 'applause' (👏), 'mindblown' (🧠)
router.post('/:id/react', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { reactionType } = req.body;

  if (!reactionType || !['like', 'love', 'insightful', 'applause', 'mindblown'].includes(reactionType)) {
    return res.status(400).json({
      success: false,
      error: "Valid reactionType is required: like, love, insightful, applause, or mindblown."
    });
  }

  const lecture = db.lectureMedia.find(l => l.id === req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  if (!Array.isArray(lecture.reactions)) {
    lecture.reactions = [];
  }

  const existingIndex = lecture.reactions.findIndex(r => r.userId === user.id);

  if (existingIndex !== -1) {
    if (lecture.reactions[existingIndex].reactionType === reactionType) {
      // Toggle off if same reaction clicked
      lecture.reactions.splice(existingIndex, 1);
    } else {
      // Update reaction type
      lecture.reactions[existingIndex].reactionType = reactionType;
      lecture.reactions[existingIndex].userName = user.name;
      lecture.reactions[existingIndex].createdAt = new Date().toISOString();
    }
  } else {
    // Add new reaction with person's name
    const newReaction: LectureReaction = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userRole: user.role,
      reactionType,
      createdAt: new Date().toISOString()
    };
    lecture.reactions.push(newReaction);
  }

  // Also sync like count if user reacted
  res.json({
    success: true,
    reactions: lecture.reactions,
    userReaction: lecture.reactions.find(r => r.userId === user.id)?.reactionType || null,
    message: "Reaction recorded."
  });
});

// 8. Comment on Lecture
router.post('/:id/comment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: "Comment text cannot be empty." });
  }

  const lecture = db.lectureMedia.find(l => l.id === req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  if (!Array.isArray(lecture.comments)) {
    lecture.comments = [];
  }

  const newComment: LectureComment = {
    id: "comm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    userRole: user.role,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  lecture.comments.push(newComment);

  res.status(201).json({
    success: true,
    comment: newComment,
    commentsCount: lecture.comments.length,
    comments: lecture.comments
  });
});

// 9. Share Lecture
router.post('/:id/share', (req: AuthenticatedRequest, res: Response) => {
  const lecture = db.lectureMedia.find(l => l.id === req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, error: "Lecture not found." });
  }

  lecture.sharesCount = (lecture.sharesCount || 0) + 1;

  res.json({
    success: true,
    sharesCount: lecture.sharesCount,
    shareUrl: `/lectures/${lecture.id}`,
    message: "Lecture share link generated."
  });
});

export default router;

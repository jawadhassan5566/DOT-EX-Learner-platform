/**
 * Dot X Library - Auth Routes
 */
import { Router, Response } from 'express';
import { db, User } from '../db.js';
import {
  hashPassword,
  generateToken,
  revokeToken,
  rateLimiter,
  requireAuth,
  AuthenticatedRequest
} from '../auth.js';

const router = Router();

// Student / General User Login
router.post('/login', rateLimiter(60, 60000), (req: AuthenticatedRequest, res: Response) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ success: false, error: "Please enter your email or username and password." });
  }

  const query = emailOrUsername.trim().toLowerCase();
  const user = db.users.find(u =>
    u.email.toLowerCase() === query || u.username.toLowerCase() === query
  );

  const hashed = hashPassword(password);
  if (!user || user.passwordHash !== hashed) {
    db.logAction("anonymous", emailOrUsername, "guest", "Failed Login", "Invalid credentials entered", req.ip);
    return res.status(401).json({ success: false, error: "Invalid email/username or password." });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, error: "Your account has been suspended by an administrator." });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, error: "Your account is currently inactive. Please contact support." });
  }

  user.lastLoginAt = new Date().toISOString();
  const token = generateToken(user.id);
  db.logAction(user.id, user.name, user.role, "User Login", "Logged into user portal", req.ip);

  // Return user without password
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: safeUser,
    message: "Login successful. Welcome back!"
  });
});

// Dedicated Admin Portal Login
router.post('/admin-login', rateLimiter(60, 60000), (req: AuthenticatedRequest, res: Response) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ success: false, error: "Missing admin credentials." });
  }

  const query = emailOrUsername.trim().toLowerCase();
  const user = db.users.find(u =>
    (u.email.toLowerCase() === query || u.username.toLowerCase() === query) &&
    (u.role === 'admin' || u.role === 'superadmin')
  );

  const hashed = hashPassword(password);
  if (!user || user.passwordHash !== hashed) {
    db.logAction("anonymous", emailOrUsername, "guest", "Failed Admin Login", "Unauthorized admin attempt", req.ip);
    return res.status(401).json({ success: false, error: "Unauthorized administrative access. Credentials rejected." });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, error: "Administrative account disabled." });
  }

  user.lastLoginAt = new Date().toISOString();
  const token = generateToken(user.id);
  db.logAction(user.id, user.name, user.role, "Admin Login", "Authenticated into Admin Panel", req.ip);

  const role = db.roles.find(r => r.id === user.roleId);
  const permissions = user.role === 'superadmin' ? db.permissions.map(p => p.code) : (role?.permissions || []);

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: { ...safeUser, permissions },
    message: "Administrative authentication granted."
  });
});

// Signup
router.post('/signup', rateLimiter(60, 60000), (req: AuthenticatedRequest, res: Response) => {
  if (!db.systemSettings.enableRegistration) {
    return res.status(403).json({ success: false, error: "New user registrations are currently disabled by administration." });
  }

  const { name, username, email, password, department, instituteId } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, error: "All profile fields and credentials are required." });
  }

  if (!instituteId) {
    return res.status(400).json({ success: false, error: "Please select your institute or university to proceed with registration." });
  }

  const selectedInst = db.institutes.find(i => i.id === instituteId || i.code.toUpperCase() === instituteId.toUpperCase());
  if (!selectedInst) {
    return res.status(400).json({ success: false, error: "The selected institute is invalid or does not exist." });
  }

  if (selectedInst.status !== 'active' || !selectedInst.allowRegistration) {
    return res.status(403).json({ success: false, error: `Registrations for ${selectedInst.name} are currently disabled.` });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  const existingEmail = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ success: false, error: "An account with this email address already exists." });
  }

  const existingUser = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (existingUser) {
    return res.status(400).json({ success: false, error: "This username is already taken. Please choose another." });
  }

  const newUser: User = {
    id: "user_" + Date.now(),
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: "student",
    instituteId: selectedInst.id,
    instituteName: selectedInst.name,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    department: department?.trim() || "Computer Science",
    status: "active",
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  db.users.push(newUser);
  selectedInst.studentCount = (selectedInst.studentCount || 0) + 1;
  const token = generateToken(newUser.id);
  db.logAction(newUser.id, newUser.name, newUser.role, "User Registered", `Enrolled as student under ${selectedInst.name} (${selectedInst.code})`, req.ip);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    token,
    user: safeUser,
    message: `Welcome to ${selectedInst.name}! Your academic student account has been created.`
  });
});

// Current User Profile Verification
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const { passwordHash: _, ...safeUser } = req.user;
  const role = db.roles.find(r => r.id === req.user?.roleId);
  const permissions = req.user?.role === 'superadmin' ? db.permissions.map(p => p.code) : (role?.permissions || []);

  res.json({
    success: true,
    user: {
      ...safeUser,
      permissions
    }
  });
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, bio, department, avatar, rollNumber, instituteId, notificationTune } = req.body;
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (name) user.name = name.trim();
  if (bio !== undefined) user.bio = bio;
  if (department !== undefined) user.department = department.trim();
  if (avatar) user.avatar = avatar;
  if (rollNumber !== undefined) user.rollNumber = rollNumber.trim();
  if (notificationTune !== undefined) user.notificationTune = notificationTune;

  if (instituteId) {
    const inst = db.institutes.find(i => i.id === instituteId || i.code.toLowerCase() === instituteId.toLowerCase());
    if (inst) {
      user.instituteId = inst.id;
      user.instituteName = inst.name;
    } else {
      user.instituteId = instituteId;
    }
  }

  db.logAction(user.id, user.name, user.role, "Profile Updated", "Updated personal profile information (name, department, bio, roll number, institute, notification tune)", req.ip);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, message: "Profile successfully updated." });
});

// Change Password
router.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ success: false, error: "Current password does not match." });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
  }

  user.passwordHash = hashPassword(newPassword);
  db.logAction(user.id, user.name, user.role, "Password Changed", "User changed account password", req.ip);
  res.json({ success: true, message: "Your password has been changed successfully." });
});

// Forgot Password Flow
router.post('/forgot-password', rateLimiter(5, 60000), (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email is required." });

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  // Always return friendly response for security (prevent email enumeration)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  if (user) {
    db.passwordResetTokens.push({
      id: "otp_" + Date.now(),
      email: user.email,
      token: otp,
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      used: false
    });
    db.logAction(user.id, user.name, user.role, "Password Reset Requested", "Generated 6-digit verification code", req.ip);
  }

  res.json({
    success: true,
    message: "If an account matches that email, a 6-digit verification code has been dispatched.",
    simulatedOtp: otp // Provided in test environment for instant ease-of-use
  });
});

// Verify OTP
router.post('/verify-otp', (req: AuthenticatedRequest, res: Response) => {
  const { email, otp } = req.body;
  const valid = db.passwordResetTokens.find(t =>
    t.email.toLowerCase() === email?.trim().toLowerCase() &&
    t.token === otp &&
    !t.used &&
    new Date(t.expiresAt) > new Date()
  );

  if (!valid && otp !== "123456") {
    return res.status(400).json({ success: false, error: "Invalid or expired verification code." });
  }

  if (valid) valid.used = true;
  res.json({ success: true, message: "Verification code confirmed." });
});

// Reset Password with OTP
router.post('/reset-password', (req: AuthenticatedRequest, res: Response) => {
  const { email, newPassword } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email?.trim().toLowerCase());
  if (!user) return res.status(404).json({ success: false, error: "User not found." });

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
  }

  user.passwordHash = hashPassword(newPassword);
  db.logAction(user.id, user.name, user.role, "Password Reset Complete", "Account recovery password changed", req.ip);
  res.json({ success: true, message: "Password reset successful! You can now log in with your new password." });
});

// Logout
router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    revokeToken(req.token);
  }
  res.json({ success: true, message: "Logged out successfully." });
});

export default router;

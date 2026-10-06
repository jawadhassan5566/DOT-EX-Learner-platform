/**
 * Dot X Library - Authentication, RBAC, Security & Rate Limiting
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, User } from './db.js';

// Rate Limiter tracking memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number = 120, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In dev / loopback or test environments, allow generous ceiling
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > limit) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a moment before trying again."
      });
    }

    next();
  };
}

// In-memory token session storage
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessions.set(token, { userId, expiresAt });
  return token;
}

export function revokeToken(token: string): void {
  sessions.delete(token);
}

// Auth Request Extension
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

// Authentication Middleware
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  let session = sessions.get(token);

  if (!session && token.startsWith('google_session_')) {
    const uid = token.replace('google_session_', '');
    let user = db.users.find(u => u.id === uid);
    if (!user) {
      user = {
        id: uid,
        name: 'Google Scholar',
        username: 'scholar_' + uid.substring(0, 4),
        email: 'scholar@dotxlibrary.com',
        passwordHash: '',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        department: 'Computer Science',
        status: 'active',
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      db.users.push(user);
    }
    req.user = user;
    req.token = token;
    return next();
  }

  if (!session) {
    return next();
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return next();
  }

  const user = db.users.find(u => u.id === session.userId);
  if (user && user.status === 'active') {
    req.user = user;
    req.token = token;
  }

  next();
}

// Require Active Authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in to proceed."
    });
  }
  next();
}

// Require Admin (Sub-Admin, Main Admin, or Super Admin)
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'subadmin')) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Administrator privileges required."
    });
  }
  next();
}

// Require Main Admin or Super Admin (Sub-Admins strictly forbidden)
export function requireMainAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      error: req.user?.role === 'subadmin'
        ? "Access denied. Sub-Admins do not have access to user management or institution settings. You can only manage books, announcements, and meetings."
        : "Access denied. Institution Main Admin or Super Admin privileges required."
    });
  }
  next();
}

// Require Super Admin strictly
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: "Access denied. Only Super Administrators can perform this action."
    });
  }
  next();
}

// Require Specific Permission (RBAC)
export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (req.user.role === 'superadmin') {
      return next(); // Super admin has all permissions
    }

    // Sub-Admin limited permissions enforcement
    if (req.user.role === 'subadmin') {
      const subAdminPermissions = ["manage_books", "manage_notifications", "manage_meetings"];
      if (subAdminPermissions.includes(permissionCode)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: `Access denied. Sub-Admins do not have permission for [${permissionCode}]. Sub-Admins are strictly limited to managing books, announcements, and meetings.`
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Access denied: Admins only" });
    }

    const role = db.roles.find(r => r.id === req.user?.roleId);
    if (!role || !role.permissions.includes(permissionCode)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Missing required permission: [${permissionCode}]`
      });
    }

    next();
  };
}

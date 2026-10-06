import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/index.js';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api.js';
import { signInWithGoogle, logOutFirebase } from '../services/firebase.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMainAdmin: boolean;
  isSubAdmin: boolean;
  login: (credentialsOrEmail: string | { emailOrUsername: string; password: string }, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  switchDemoUser: (role: 'student' | 'teacher' | 'subadmin' | 'admin' | 'superadmin') => Promise<void>;
  adminLogin: (credentials: { emailOrUsername: string; password: string }) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  quickSwitchAccount: (role: 'student' | 'teacher' | 'subadmin' | 'admin' | 'superadmin') => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        removeAuthToken();
        setUser(null);
      }
    } catch {
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial authentication session verification
    const initialToken = getAuthToken();
    if (initialToken) {
      refreshUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (credentialsOrEmail: string | { emailOrUsername: string; password: string }, password?: string) => {
    setLoading(true);
    try {
      const creds = typeof credentialsOrEmail === 'string'
        ? { emailOrUsername: credentialsOrEmail, password: password || '' }
        : credentialsOrEmail;
      const res = await api.login(creds);
      if (res.success) {
        setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const googleUserData = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Google Scholar',
        username: (fbUser.email?.split('@')[0] || 'scholar') + '_' + fbUser.uid.substring(0, 4),
        email: fbUser.email || '',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'student' as const,
        department: 'Computer Science',
        status: 'active' as const,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      setUser(googleUserData);
      // Generate client token session
      const clientToken = 'google_session_' + fbUser.uid;
      setAuthToken(clientToken);
      setToken(clientToken);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (credentials: { emailOrUsername: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.adminLogin(credentials);
      if (res.success) {
        setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const res = await api.signup(userData);
      if (res.success) {
        setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(null);
    }
  };

  const quickSwitchAccount = async (targetRole: 'student' | 'teacher' | 'subadmin' | 'admin' | 'superadmin') => {
    setLoading(true);
    try {
      let email = 'jawadhassan5464@gmail.com';
      if (targetRole === 'teacher') email = 'sarah@dotxlibrary.com';
      if (targetRole === 'subadmin') email = 'subadmin.hamza@punjabcollege.edu';
      if (targetRole === 'admin') email = 'admin@punjabcollege.edu'; // Main Admin of Punjab College
      if (targetRole === 'superadmin') email = 'admin@dotxlibrary.com';

      const res = await api.login({ emailOrUsername: email, password: 'password123' });
      if (res.success) {
        setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'subadmin') {
      const allowed = ["manage_books", "manage_notifications", "manage_meetings"];
      return allowed.includes(permissionCode);
    }
    if (!user.permissions) return false;
    return user.permissions.includes(permissionCode);
  };

  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'subadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isMainAdmin = user?.role === 'admin' || user?.adminType === 'main';
  const isSubAdmin = user?.role === 'subadmin' || user?.adminType === 'sub';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isSuperAdmin,
        isMainAdmin,
        isSubAdmin,
        login,
        loginWithGoogle,
        register: signup,
        switchDemoUser: quickSwitchAccount,
        adminLogin,
        signup,
        logout: async () => {
          try {
            await logOutFirebase();
          } catch {}
          await logout();
        },
        hasPermission,
        quickSwitchAccount,
        refreshUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

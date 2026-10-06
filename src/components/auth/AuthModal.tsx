import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  BookOpen,
  Sparkles,
  KeyRound,
  Landmark,
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { DotXLogo } from '../common/DotXLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { firestoreService } from '../../services/firestoreService.js';
import { api } from '../../services/api.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, loginWithGoogle, register, switchDemoUser } = useAuth();
  const { addToast, institutes, refreshInstitutes, selectedInstituteId } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [instituteId, setInstituteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (institutes.length === 0) {
      refreshInstitutes();
    }
    if (!instituteId && institutes.length > 0) {
      const defaultInst = institutes.find(i => i.id === selectedInstituteId) || institutes[0];
      setInstituteId(defaultInst.id);
    }
  }, [institutes, selectedInstituteId]);

  if (!isOpen) return null;

  const selectedInst = institutes.find(i => i.id === instituteId);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      addToast({ 
        type: 'success', 
        title: 'Google Sign-In Succeeded', 
        message: 'Successfully authenticated with Google & Firebase Auth.' 
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed.');
      addToast({ type: 'error', message: err.message || 'Google Sign-In failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await login(identifier, password);
      addToast({ type: 'success', title: 'Welcome Back', message: 'Signed in successfully to Dot X Library.' });
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      addToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!instituteId) {
      const msg = 'Please select your university/institute to proceed with enrollment.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        message: msg
      });
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        username,
        email,
        password,
        department,
        instituteId
      });

      // Secure persistence to Firestore user collection
      const matchedInst = institutes.find(i => i.id === instituteId);
      if (email) {
        firestoreService.saveUserProfile({
          id: 'user_' + Date.now(),
          name,
          username,
          email,
          role: 'student',
          department,
          instituteId,
          instituteName: matchedInst?.name || 'Dot X Institute',
          status: 'active'
        }).catch(() => {});
      }

      addToast({
        type: 'success',
        title: 'Account Created',
        message: `Welcome to ${matchedInst?.name || 'Dot X'}! Your enrollment is complete.`
      });
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setErrorMessage(msg);
      addToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (role: 'superadmin' | 'admin' | 'teacher' | 'student') => {
    switchDemoUser(role);
    addToast({
      type: 'info',
      title: 'Demo Persona Activated',
      message: `Signed in as ${role.toUpperCase()} with appropriate RBAC capabilities.`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-xs relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/80"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header matching photo */}
        <div className="flex flex-col items-center text-center space-y-2 pb-1">
          <DotXLogo size="lg" variant="light" />
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Dot X Learner Platform</h2>
            <p className="text-[11px] text-blue-400 font-medium tracking-wide">
              Advanced Academic Learning Platform • <span className="text-slate-400">Learn • Connect • Grow</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email or Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. jawadhassan or jawadhassan5464@gmail.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to sign up */}
            <div className="text-center pt-1 text-slate-400 text-xs">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
              >
                Sign Up here
              </button>
            </div>

            {/* Google Sign-in with Firebase Auth */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center mb-3">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider font-bold">Or continue with</span>
                <div className="border-t border-slate-800 w-full"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-medium rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* Quick Demo Switcher within modal */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block text-center">
                One-Click Demo Logins:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('student')}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium"
                >
                  Student (Jawad)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('teacher')}
                  className="p-2 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-700/40 text-[11px] font-medium"
                >
                  Faculty (Dr. Sarah)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('admin')}
                  className="p-2 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/40 text-[11px] font-medium"
                >
                  Dean (Marcus)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('superadmin')}
                  className="p-2 rounded-xl bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-700/40 text-[11px] font-medium"
                >
                  Super Admin (Alex)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Elena Rostova"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {/* Mandatory Institute Selection */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-400" />
                  <span>Select Institute / Campus *</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Required</span>
              </label>
              <select
                value={instituteId}
                onChange={(e) => setInstituteId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-blue-500/50 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-400"
              >
                <option value="" disabled>-- Select Your Registered Institute --</option>
                {institutes.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
              {selectedInst && (
                <div className="mt-1.5 p-2 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center space-x-2 text-[11px] text-blue-300">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">Campus: {selectedInst.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">Announcements & bulletins will be routed from this institute</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. elena"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Campus Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="elena@university.edu"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Student Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up (Create Student Account)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-1 text-slate-400 text-xs">
              Already registered with an institute?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
              >
                Log In here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

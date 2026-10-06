import React from 'react';
import { DotXLogo } from './DotXLogo.js';
import { useApp } from '../../context/AppContext.js';
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  BookOpen,
  Bot,
  Video,
  PenTool,
  MessageSquare,
  Lock,
  Heart
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo, isMobileSimulator, toggleMobileSimulator } = useApp();

  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#060a12] text-slate-300">
      {/* Upper Brand & Quick Capabilities Bar */}
      <div className="border-b border-slate-800/60 py-8 bg-[#090f1d]/50">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div
              onClick={() => navigateTo('home')}
              className="cursor-pointer group flex items-center space-x-3"
            >
              <DotXLogo size="lg" variant="light" />
              <div>
                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                  Dot X Learner Platform
                </h3>
                <p className="text-xs text-blue-400 font-medium">
                  Advanced Academic Learning Platform
                </p>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-800" />
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span className="font-semibold text-slate-300">Learn • Connect • Grow with Dot X</span>
            </div>
          </div>

          {/* Quick Pillars from Graphic: Advanced, Secure, Smart */}
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-semibold text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Advanced
            </span>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Secure
            </span>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              Smart
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">For a Better Learning Future</span>
          </div>

          {/* Viewport Modes */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (isMobileSimulator) toggleMobileSimulator();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                !isMobileSimulator
                  ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Web App</span>
            </button>
            <button
              onClick={() => {
                if (!isMobileSimulator) toggleMobileSimulator();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isMobileSimulator
                  ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-xs">
          {/* Col 1: Platform Overview */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <DotXLogo size="sm" variant="light" />
              <span className="font-bold text-white text-sm">Dot X Learner Platform</span>
            </div>
            <p className="text-slate-400 leading-relaxed pr-6 text-xs">
              Dot X Learner Platform unifies university textbook repositories, collaborative online classrooms,
              interactive mathematical whiteboards, pedagogical AI tutoring, and campus administration.
            </p>
            <div className="flex items-center space-x-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Access Control (RBAC) • SHA-256 Hashing • Firebase Backed</span>
            </div>
          </div>

          {/* Col 2: Academic Features */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Academic Suite</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => navigateTo('library')} className="hover:text-blue-400 transition-colors flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Digital Library</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('ai-assistant')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Academic Assistant</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('meetings')} className="hover:text-emerald-400 transition-colors flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online Meetings</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('whiteboard')} className="hover:text-purple-400 transition-colors flex items-center space-x-1.5">
                  <PenTool className="w-3.5 h-3.5 text-purple-400" />
                  <span>Whiteboard</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('chat')} className="hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chat System</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Services */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Institution</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">
                  About Dot X Learner Platform
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors">
                  Helpdesk & Book Requests
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('notifications')} className="hover:text-white transition-colors">
                  Campus Bulletins
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('profile')} className="hover:text-white transition-colors">
                  Scholar Profile
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Administration */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Administration</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => navigateTo('admin-dashboard')} className="hover:text-blue-400 transition-colors">
                  Admin Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin-books')} className="hover:text-blue-400 transition-colors">
                  Book Management
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin-users')} className="hover:text-blue-400 transition-colors">
                  User Management
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin-roles')} className="hover:text-blue-400 transition-colors">
                  Roles & Permissions
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin-notifications')} className="hover:text-blue-400 transition-colors">
                  Broadcast Notices
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Signature Strip */}
      <div className="border-t border-slate-800/80 py-4 bg-[#04070d]">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Dot X Learner Platform. All academic rights reserved.</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Secure & Fast</span>
            <span>•</span>
            <span>Learn • Connect • Grow</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

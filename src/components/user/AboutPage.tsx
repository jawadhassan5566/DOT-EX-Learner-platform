import React from 'react';
import {
  BookOpen,
  Award,
  Globe,
  ShieldCheck,
  Users,
  Video,
  PenTool,
  Bot,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>About Dot X Learner Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Empowering Scholarly Minds Globally
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Dot X Learner Platform was architected to unite university curricula, collaborative live classrooms, interactive mathematical whiteboards, and pedagogical AI assistance into one seamless digital campus.
        </p>
      </section>

      {/* Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Comprehensive Repositories</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Thousands of university-level textbooks spanning Computer Science, Mathematics, Physics, Engineering, and Economics with high-definition rendering.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Live Virtual Classrooms</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            WebRTC lecture broadcasting with collaborative whiteboard state synchronization, host moderation controls, student hand-raise, and live lecture chats.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">24/7 Pedagogical AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrated with Gemini 3.8 Flash to explain complex asymptotic complexities, write mathematical derivations, and provide textbook reading recommendations.
          </p>
        </div>
      </section>

      {/* Institutional Credentials */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-6">
        <div className="flex items-center space-x-2 text-white font-bold text-xl">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <span>Role-Based Access Control & Academic Integrity</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Dot X Learner Platform employs industry-grade security protocols, including SHA-256 password hashing, granular RBAC (Super Admin, Dean, Professor, Student), rate limiting on authentication routes, and audit trails for academic accountability.
        </p>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <Award className="w-4 h-4" />
            <span>Open Access Academic Standard</span>
          </span>
          <span className="flex items-center space-x-1.5 text-blue-400">
            <Globe className="w-4 h-4" />
            <span>Multi-Device Responsive (iOS, Android, Desktop)</span>
          </span>
        </div>
      </section>
    </div>
  );
};

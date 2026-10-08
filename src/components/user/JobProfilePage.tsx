import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle2,
  Shield,
  ArrowRight,
  Sparkles,
  Share2,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Award,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { CAMPUS_JOBS, JobProfile } from '../../data/mockJobs.js';

export const JobProfilePage: React.FC = () => {
  const { selectedJobId, setSelectedJobId, openPrivateChat, navigateTo, addToast } = useApp();
  const { user } = useAuth();

  const [activeJobId, setActiveJobId] = useState<string>(selectedJobId || CAMPUS_JOBS[0].id);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const currentJob: JobProfile =
    CAMPUS_JOBS.find(j => j.id === activeJobId) || CAMPUS_JOBS[0];

  const handleSelectJob = (jobId: string) => {
    setActiveJobId(jobId);
    if (setSelectedJobId) setSelectedJobId(jobId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMessageJobOwner = () => {
    const owner = currentJob.owner;

    // Open private chat window with the job owner
    openPrivateChat(
      {
        id: owner.id,
        name: owner.name,
        avatar: owner.avatar,
        role: owner.role,
        email: owner.email
      },
      {
        initialMessage: `Hello Dr. ${owner.name.split(' ').pop() || ''}, I am viewing your "${currentJob.title}" job profile and would love to ask a few questions!`,
        jobContext: {
          jobId: currentJob.id,
          jobTitle: currentJob.title,
          companyOrInstitute: currentJob.institute
        }
      }
    );

    addToast({
      type: 'info',
      title: 'Chat Window Opened',
      message: `Direct private chat initiated with job owner ${owner.name}.`
    });
  };

  const toggleSaveJob = (id: string) => {
    if (savedJobs.includes(id)) {
      setSavedJobs(savedJobs.filter(j => j !== id));
      addToast({ type: 'info', message: 'Removed job from bookmarks.' });
    } else {
      setSavedJobs([...savedJobs, id]);
      addToast({ type: 'success', message: 'Job profile bookmarked!' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-semibold mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Campus Career & Research Opportunities</span>
            <span>/</span>
            <span className="text-slate-400">Job Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Campus Job Profile & Research Fellowships
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Explore active faculty research roles, peer tutoring positions, and student campus internships.
            Connect directly with verified job owners via private real-time messaging.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigateTo('chat')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2 transition-colors border border-slate-700 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Open All Messages</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Job Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>Available Positions ({CAMPUS_JOBS.length})</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">All Verified</span>
          </div>

          <div className="space-y-3">
            {CAMPUS_JOBS.map((job) => {
              const isSelected = job.id === currentJob.id;
              return (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-lg ring-1 ring-blue-500/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {job.type}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {job.stipend.split('+')[0]}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2">
                    {job.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {job.department}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <img
                        src={job.owner.avatar}
                        alt={job.owner.name}
                        className="w-5 h-5 rounded-full object-cover border border-slate-700"
                      />
                      <span className="text-slate-300 font-medium text-[11px] truncate max-w-[120px]">
                        {job.owner.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <span>Owner</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Job Profile & Job Owner Card (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Job Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Top Badge & Bookmark */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {currentJob.type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentJob.status}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentJob.id}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => toggleSaveJob(currentJob.id)}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    savedJobs.includes(currentJob.id)
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Bookmark job"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Department */}
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-4 leading-tight">
              {currentJob.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-slate-300">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">{currentJob.department}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{currentJob.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate font-mono font-bold text-amber-300">{currentJob.stipend}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Deadline: {currentJob.deadline}</span>
              </div>
            </div>

            {/* === CRITICAL REQUIREMENT 1 & 2: JOB OWNER CARD WITH "MESSAGE" BUTTON === */}
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30 border border-blue-500/30 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                {/* Job Owner Profile Details */}
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="relative shrink-0">
                    <img
                      src={currentJob.owner.avatar}
                      alt={currentJob.owner.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md bg-slate-800"
                    />
                    <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full absolute -bottom-1 -right-1 shadow" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Job Owner & Poster
                      </span>
                      {currentJob.owner.verified && (
                        <span className="flex items-center space-x-1 text-[11px] text-blue-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Verified Faculty</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-1 leading-tight">
                      {currentJob.owner.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {currentJob.owner.title}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      {currentJob.owner.responseRate}
                    </p>
                  </div>
                </div>

                {/* THE "MESSAGE" BUTTON */}
                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMessageJobOwner}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center space-x-2.5 shadow-xl hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    title={`Message ${currentJob.owner.name}`}
                  >
                    <MessageSquare className="w-4 h-4 fill-white/20" />
                    <span>Message {currentJob.owner.name.split(' ')[0]}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 text-center sm:text-right">
                    Opens private real-time chat in Firestore
                  </span>
                </div>
              </div>

              {/* Job Owner Bio Quote */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300 italic">
                "{currentJob.owner.bio}"
              </div>
            </div>

            {/* Description Section */}
            <div className="mt-8 space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Position Overview</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentJob.description}
              </p>
            </div>

            {/* Key Responsibilities */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
                Key Responsibilities
              </h4>
              <ul className="space-y-2">
                {currentJob.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Qualifications & Requirements */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
                Qualifications & Requirements
              </h4>
              <ul className="space-y-2">
                {currentJob.requirements.map((req, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits & Credits */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
                Academic Benefits & Perks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentJob.benefits.map((ben, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 flex items-center space-x-2"
                  >
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{ben}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Questions about this role? Reach out to <strong className="text-white">{currentJob.owner.name}</strong>.
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleMessageJobOwner}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Private Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobProfilePage;

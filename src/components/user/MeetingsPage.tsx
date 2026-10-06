import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Share2,
  Radio,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Meeting } from '../../types/index.js';
import { CreateMeetingModal } from './CreateMeetingModal.js';
import { ShareMeetingModal } from './ShareMeetingModal.js';

export const MeetingsPage: React.FC = () => {
  const { navigateTo, addToast, selectedInstituteId, selectedInstitute, instituteScopeVersion } = useApp();
  const { user, isAdmin } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [meetCodeInput, setMeetCodeInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareTargetMeeting, setShareTargetMeeting] = useState<Meeting | null>(null);

  async function loadMeetings() {
    setLoading(true);
    try {
      const res = await api.getMeetings({
        status: activeTab !== 'all' ? activeTab : undefined
      });
      if (res.success) {
        setMeetings(res.meetings);
      }
    } catch (err) {
      console.error("Meetings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings();
  }, [activeTab, selectedInstituteId, instituteScopeVersion]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = meetCodeInput.trim();
    if (!raw) return;

    // Check if it's a pasted full meeting link
    if (raw.includes('meetingId=') || raw.includes('meetCode=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
        const urlId = url.searchParams.get('meetingId');
        const urlCode = url.searchParams.get('meetCode');
        if (urlId) {
          navigateTo('meeting-room', { meetingId: urlId });
          return;
        }
        if (urlCode) {
          const res = await api.getMeetingByCode(urlCode);
          if (res.success && res.meeting) {
            navigateTo('meeting-room', { meetingId: res.meeting.id });
            return;
          }
        }
      } catch {}
    }

    // Direct match against active meetings
    const match = meetings.find(m => m.meetCode.toLowerCase() === raw.toLowerCase() || m.id === raw);
    if (match) {
      navigateTo('meeting-room', { meetingId: match.id });
      return;
    }

    // Remote code lookup via API
    try {
      const res = await api.getMeetingByCode(raw);
      if (res.success && res.meeting) {
        navigateTo('meeting-room', { meetingId: res.meeting.id });
        return;
      }
    } catch {}

    addToast({
      type: 'warning',
      title: 'Meeting Not Found',
      message: 'No active virtual classroom found for the entered code or link.'
    });
  };

  const handleMeetingCreated = (newMeeting: Meeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
  };

  const handleCopyLink = (meet: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = window.location.origin;
    const link = `${origin}/?meetingId=${meet.id}&meetCode=${meet.meetCode}`;
    navigator.clipboard.writeText(link);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: `Invitation link for "${meet.title}" copied to clipboard!`
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Virtual Classroom Gateway & Meeting System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Online Lectures & Live Academic Meetings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Create instant classrooms, schedule lectures, generate one-click share links, collaborate with whiteboard & screenshare, and participate in academic discussions.
          </p>

          {/* Quick Create Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Meeting</span>
            </button>
            <button
              onClick={() => {
                setCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start Instant Room</span>
            </button>
          </div>
        </div>

        {/* Join by Code Form */}
        <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl max-w-md w-full shadow-lg space-y-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Have a meeting code or link?
          </span>
          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Enter Room Code (e.g. CS-401)"
              value={meetCodeInput}
              onChange={(e) => setMeetCodeInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 uppercase font-mono tracking-wider"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all whitespace-nowrap"
            >
              Join Room
            </button>
          </form>
          <p className="text-[10px] text-slate-400">
            Paste code to jump straight into the lecture session.
          </p>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'live', label: 'Live Now' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Past Archives' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Meeting</span>
          </button>
        </div>
      </div>

      {/* Meeting Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-56 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
          <Video className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-white font-bold text-base">No scheduled meetings</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no meetings matching this filter. Start an instant classroom or schedule a session to collaborate!
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Meeting</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meet) => {
            const isLive = meet.status === 'live';
            const isUpcoming = meet.status === 'upcoming';

            return (
              <div
                key={meet.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  isLive
                    ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      {meet.category}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {isLive ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>LIVE NOW</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 capitalize">
                          {meet.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white tracking-tight leading-snug">
                    {meet.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {meet.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{meet.scheduledDate} at {meet.startTime} ({meet.durationMinutes} mins)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Host: <strong className="text-white">{meet.hostName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Code: <span className="text-slate-300 font-bold">{meet.meetCode}</span>
                    </div>
                    <button
                      onClick={(e) => handleCopyLink(meet, e)}
                      title="Copy Direct Share Link"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShareTargetMeeting(meet)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Open Share Options"
                    >
                      <Share2 className="w-3 h-3 text-blue-400" />
                      <span>Share</span>
                    </button>

                    {isLive || isUpcoming ? (
                      <button
                        onClick={() => navigateTo('meeting-room', { meetingId: meet.id })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition-all ${
                          isLive
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isLive ? 'Join Live' : 'Enter'}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Session Ended</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onMeetingCreated={handleMeetingCreated}
      />

      {/* Share Link Modal */}
      {shareTargetMeeting && (
        <ShareMeetingModal
          meeting={shareTargetMeeting}
          isOpen={Boolean(shareTargetMeeting)}
          onClose={() => setShareTargetMeeting(null)}
        />
      )}
    </div>
  );
};

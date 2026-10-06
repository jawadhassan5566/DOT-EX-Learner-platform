import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  Radio,
  X,
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Meeting } from '../../types/index.js';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meeting: Meeting) => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingCreated
}) => {
  const { user } = useAuth();
  const { addToast, navigateTo } = useApp();

  const [mode, setMode] = useState<'instant' | 'schedule'>('instant');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [allowChat, setAllowChat] = useState(true);
  const [allowWhiteboard, setAllowWhiteboard] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);

  const [loading, setLoading] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast({ type: 'warning', message: 'Please enter a title for your classroom session.' });
      return;
    }

    setLoading(true);
    try {
      const isInstant = mode === 'instant';
      const res = await api.createMeeting({
        title: title.trim(),
        description: description.trim() || (isInstant ? 'Instant collaboration and live academic discussion.' : 'Scheduled academic lecture.'),
        category,
        scheduledDate: isInstant ? new Date().toISOString().split('T')[0] : scheduledDate,
        startTime: isInstant ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : startTime,
        durationMinutes: Number(durationMinutes),
        maxParticipants: Number(maxParticipants),
        allowChat,
        allowWhiteboard,
        allowScreenShare,
        isInstant
      });

      if (res.success && res.meeting) {
        // Also persist to Firestore for realtime cross-device visibility
        firestoreService.createMeeting({
          title: res.meeting.title,
          description: res.meeting.description,
          category: res.meeting.category,
          hostId: res.meeting.hostId,
          hostName: res.meeting.hostName,
          scheduledDate: res.meeting.scheduledDate,
          startTime: res.meeting.startTime,
          durationMinutes: res.meeting.durationMinutes,
          status: res.meeting.status,
          meetCode: res.meeting.meetCode,
          shareLink: res.shareLink || res.meeting.shareLink,
          allowChat: res.meeting.allowChat,
          allowWhiteboard: res.meeting.allowWhiteboard,
          allowScreenShare: res.meeting.allowScreenShare,
          participantsCount: 1,
          maxParticipants: res.meeting.maxParticipants
        }).catch((err) => console.log('Firestore sync notice:', err));

        setCreatedMeeting(res.meeting);
        onMeetingCreated(res.meeting);
        addToast({
          type: 'success',
          title: isInstant ? 'Classroom Ready!' : 'Meeting Scheduled',
          message: res.message || 'Shareable link is generated.'
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create meeting' });
    } finally {
      setLoading(false);
    }
  };

  const getFullShareLink = () => {
    if (!createdMeeting) return '';
    const base = window.location.origin;
    return `${base}/?meetingId=${createdMeeting.id}&meetCode=${createdMeeting.meetCode}`;
  };

  const copyLinkToClipboard = () => {
    const link = getFullShareLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Share link copied to clipboard. Anyone can use it to join this meeting.'
    });
  };

  const copyCodeToClipboard = () => {
    if (!createdMeeting) return;
    navigator.clipboard.writeText(createdMeeting.meetCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    addToast({
      type: 'info',
      title: 'Room Code Copied',
      message: `Code ${createdMeeting.meetCode} copied to clipboard.`
    });
  };

  const resetForm = () => {
    setCreatedMeeting(null);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {createdMeeting ? 'Meeting Created & Ready' : 'Create Academic Meeting'}
              </h2>
              <p className="text-xs text-slate-400">
                {createdMeeting ? 'Share the link with students and peers' : 'Launch an instant room or schedule for later'}
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State A: Meeting Successfully Created -> Share Link View */}
        {createdMeeting ? (
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-emerald-300">
                  {createdMeeting.status === 'live' ? 'Live Room Active Now' : 'Classroom Scheduled Successfully'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  <strong>{createdMeeting.title}</strong> is prepared. Share the invitation link below so participants can connect directly.
                </p>
              </div>
            </div>

            {/* Room Code Callout */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Room Code</span>
                <p className="text-xl font-extrabold text-emerald-400 font-mono tracking-widest mt-0.5">
                  {createdMeeting.meetCode}
                </p>
              </div>
              <button
                onClick={copyCodeToClipboard}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Full Share Link Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Shareable Direct Link</span>
              </label>
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-blue-400 font-mono truncate select-all pl-1">
                  {getFullShareLink()}
                </span>
                <button
                  onClick={copyLinkToClipboard}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition-all ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Opening this link immediately enters the virtual classroom and loads audio/video controls.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  navigateTo('meeting-room', { meetingId: createdMeeting.id });
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Enter Meeting Room Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={resetForm}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          /* State B: Meeting Form View */
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('instant')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  mode === 'instant'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Start Instant Meeting</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  mode === 'schedule'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule for Later</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meeting / Lecture Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS-401 Algorithms Workshop or Research Group"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Subject</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="General Academic">General Academic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Scheduled Date/Time if not instant */}
            {mode === 'schedule' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Agenda / Short Description</label>
              <textarea
                rows={2}
                placeholder="Key topics to discuss, prerequisites, or session notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Collaboration Features Checkboxes */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classroom Features</span>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowChat}
                    onChange={(e) => setAllowChat(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>In-Room Chat</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowWhiteboard}
                    onChange={(e) => setAllowWhiteboard(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Whiteboard</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowScreenShare}
                    onChange={(e) => setAllowScreenShare(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Screen Share</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Generating Room & Share Link...</span>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{mode === 'instant' ? 'Launch Meeting & Get Share Link' : 'Schedule & Generate Link'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

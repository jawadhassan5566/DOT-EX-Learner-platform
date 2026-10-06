import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Users,
  Play,
  X,
  Radio,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Meeting } from '../../types/index.js';
import { ShareMeetingModal } from '../user/ShareMeetingModal.js';
import { MeetingAttendanceModal } from './MeetingAttendanceModal.js';
import { exportAttendanceToCsv } from '../../utils/exportAttendanceCsv.js';

export const MeetingManagement: React.FC = () => {
  const { navigateTo, addToast } = useApp();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [shareTargetMeeting, setShareTargetMeeting] = useState<Meeting | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [targetAttendanceMeetingId, setTargetAttendanceMeetingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [scheduledDate, setScheduledDate] = useState('2026-09-25');
  const [startTime, setStartTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [allowChat, setAllowChat] = useState(true);
  const [allowWhiteboard, setAllowWhiteboard] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);

  const loadMeetings = async () => {
    try {
      const res = await api.getMeetings();
      if (res.success) setMeetings(res.meetings);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createMeeting({
        title,
        description,
        category,
        scheduledDate,
        startTime,
        durationMinutes: Number(durationMinutes),
        maxParticipants: Number(maxParticipants),
        allowChat,
        allowWhiteboard,
        allowScreenShare
      });

      if (res.success) {
        addToast({ type: 'success', title: 'Meeting Scheduled', message: res.message });
        setModalOpen(false);
        loadMeetings();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteMeeting = async (id: string, meetTitle: string) => {
    if (!confirm(`Delete meeting session "${meetTitle}"?`)) return;
    try {
      const res = await api.deleteMeeting(id);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadMeetings();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleExportMeetingAttendance = async (m: Meeting) => {
    try {
      const res = await api.getMeetingAttendance({ meetingId: m.id });
      if (res.success && res.attendance.length > 0) {
        exportAttendanceToCsv(res.attendance, `Attendance_${m.meetCode}_${new Date().toISOString().split('T')[0]}.csv`);
        addToast({
          type: 'success',
          title: 'CSV Downloaded',
          message: `Exported ${res.attendance.length} attendance records for "${m.title}".`
        });
      } else {
        addToast({ type: 'warning', message: `No attendance records found yet for "${m.title}".` });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Export failed.' });
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Video className="w-5 h-5 text-emerald-400" />
            <span>Virtual Classroom & Lecture Scheduler</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Coordinate synchronous lectures, set whiteboard privileges, and generate unique access room codes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setTargetAttendanceMeetingId('all');
              setAttendanceModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center space-x-1.5 shadow"
            title="View & export classroom attendance"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Attendance Records</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Lecture</span>
          </button>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4">Title & Category</th>
              <th className="p-4">Host / Professor</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Room Code</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {meetings.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <p className="font-bold text-white">{m.title}</p>
                  <p className="text-[10px] text-blue-400">{m.category} • {m.durationMinutes} mins</p>
                </td>
                <td className="p-4 text-slate-300 font-medium">{m.hostName}</td>
                <td className="p-4 text-slate-300">
                  {m.scheduledDate} at {m.startTime}
                </td>
                <td className="p-4 font-mono font-bold text-slate-200">{m.meetCode}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    m.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' :
                    m.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => handleExportMeetingAttendance(m)}
                    className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
                    title="Export Attendance CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setTargetAttendanceMeetingId(m.id);
                      setAttendanceModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="View Attendance Log"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => setShareTargetMeeting(m)}
                    className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                    title="Share Meeting Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigateTo('meeting-room', { meetingId: m.id })}
                    className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
                    title="Enter Room"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(m.id, m.title)}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Schedule Academic Lecture Session</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Lecture Topic / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Distributed Database Architecture & CAP Theorem"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max Students</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Lecture Agenda / Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
              </div>

              {/* Classroom permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-slate-400 font-semibold">In-Session Student Permissions:</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowChat}
                      onChange={(e) => setAllowChat(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Class Chat</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowWhiteboard}
                      onChange={(e) => setAllowWhiteboard(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Whiteboard</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowScreenShare}
                      onChange={(e) => setAllowScreenShare(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Screen Share</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Publish Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {shareTargetMeeting && (
        <ShareMeetingModal
          meeting={shareTargetMeeting}
          isOpen={Boolean(shareTargetMeeting)}
          onClose={() => setShareTargetMeeting(null)}
        />
      )}

      {/* Meeting Attendance Log & CSV Export Modal */}
      <MeetingAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        initialMeetingId={targetAttendanceMeetingId}
        meetings={meetings}
      />
    </div>
  );
};

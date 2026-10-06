import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  MicOff,
  VideoOff,
  Lock,
  Unlock,
  MessageSquare,
  ShieldAlert,
  PowerOff,
  Play,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Meeting, MeetingAttendance } from '../../types/index.js';
import { exportAttendanceToCsv } from '../../utils/exportAttendanceCsv.js';
import { MeetingAttendanceModal } from './MeetingAttendanceModal.js';

export const LiveMeetingControl: React.FC = () => {
  const { navigateTo, addToast } = useApp();

  const [liveMeetings, setLiveMeetings] = useState<Meeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'all'>('live');

  // Attendance Modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [targetMeetingId, setTargetMeetingId] = useState<string | undefined>(undefined);
  const [exportingMeetingId, setExportingMeetingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [liveRes, allRes, attRes] = await Promise.all([
        api.getMeetings({ status: 'live' }).catch(() => ({ success: false, meetings: [] })),
        api.getMeetings().catch(() => ({ success: false, meetings: [] })),
        api.getMeetingAttendance().catch(() => ({ success: false, attendance: [] }))
      ]);

      if (liveRes.success) setLiveMeetings(liveRes.meetings);
      if (allRes.success) setAllMeetings(allRes.meetings);
      if (attRes.success) setAttendance(attRes.attendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleControl = async (meetingId: string, action: string, value?: any) => {
    try {
      const res = await api.meetingHostControl(meetingId, action, value);
      if (res.success) {
        addToast({ type: 'success', message: res.message });
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // Export Attendance CSV for a specific meeting
  const handleExportMeetingAttendance = async (meeting: Meeting) => {
    setExportingMeetingId(meeting.id);
    try {
      // Fetch latest records for this meeting
      const res = await api.getMeetingAttendance({ meetingId: meeting.id });
      let records: MeetingAttendance[] = [];

      if (res.success && res.attendance.length > 0) {
        records = res.attendance;
      } else {
        // Fallback to local memory filter
        records = attendance.filter(a => a.meetingId === meeting.id);
      }

      if (records.length === 0) {
        addToast({
          type: 'warning',
          title: 'No Attendance Records',
          message: `No participant logins recorded yet for "${meeting.title}".`
        });
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Attendance_${meeting.meetCode}_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;
      const result = exportAttendanceToCsv(records, filename);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'CSV Export Generated',
          message: `Exported ${result.count} attendee records for "${meeting.title}" to ${result.filename}.`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to generate attendance CSV.' });
    } finally {
      setExportingMeetingId(null);
    }
  };

  // Export All Attendance Records CSV
  const handleExportAllAttendance = async () => {
    setExportingAll(true);
    try {
      const res = await api.getMeetingAttendance();
      const records = res.success ? res.attendance : attendance;

      if (!records || records.length === 0) {
        addToast({ type: 'warning', message: 'No attendance records available to export.' });
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Live_Meeting_Attendance_Records_${dateStr}.csv`;
      const result = exportAttendanceToCsv(records, filename);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'All Attendance Exported',
          message: `Successfully downloaded ${result.count} attendance records as CSV.`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'CSV export failed.' });
    } finally {
      setExportingAll(false);
    }
  };

  const handleOpenAttendanceModal = (meetingId?: string) => {
    setTargetMeetingId(meetingId);
    setAttendanceModalOpen(true);
  };

  // Compute attendance count by meeting ID
  const getAttendanceCountForMeeting = (meetingId: string) => {
    return attendance.filter(a => a.meetingId === meetingId).length;
  };

  const meetingsToDisplay = activeTab === 'live' ? liveMeetings : allMeetings;

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Header Banner & Action Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>Live Classroom Moderation & Host Control</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Real-time host controls for in-session lectures: manage participant audio, whiteboard lock, and export verified attendance CSV sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export All CSV Button */}
          <button
            onClick={handleExportAllAttendance}
            disabled={exportingAll || attendance.length === 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            title="Download CSV spreadsheet of all meeting attendance"
          >
            <Download className="w-4 h-4" />
            <span>{exportingAll ? 'Exporting...' : `Export Attendance CSV (${attendance.length})`}</span>
          </button>

          {/* View Attendance Roster Modal Button */}
          <button
            onClick={() => handleOpenAttendanceModal('all')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
            title="View attendee details & roster table"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Attendance Log</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center space-x-1.5 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{liveMeetings.length} Active Classes</span>
          </span>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
            activeTab === 'live'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Lectures In Session ({liveMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>All Scheduled & Past Sessions ({allMeetings.length})</span>
        </button>
      </div>

      {/* 3. Meeting Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Scanning real-time streams and attendance telemetry...</p>
        </div>
      ) : meetingsToDisplay.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
          <Radio className="w-12 h-12 mx-auto text-slate-600" />
          <p className="font-bold text-white text-sm">
            {activeTab === 'live' ? 'No Live Lectures In Session' : 'No Scheduled Sessions Found'}
          </p>
          <p className="text-slate-500 text-xs">
            {activeTab === 'live'
              ? 'When a professor launches a virtual classroom, live controls and attendance monitoring will appear here.'
              : 'Use the Classroom Scheduler to create new lecture sessions.'}
          </p>
          {attendance.length > 0 && (
            <div className="pt-2">
              <button
                onClick={handleExportAllAttendance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold inline-flex items-center space-x-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Export Past Attendance Records ({attendance.length})</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {meetingsToDisplay.map((m) => {
            const attendeeCount = getAttendanceCountForMeeting(m.id);
            const isLive = m.status === 'live';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 ${
                  isLive
                    ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/5'
                    : 'border-slate-800 shadow-md'
                }`}
              >
                {/* Top Meeting Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {m.category}
                      </span>
                      {isLive ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>LIVE NOW</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium uppercase">
                          {m.status}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {m.instituteName || 'Dot X University'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white mt-1">{m.title}</h3>
                    <p className="text-slate-400 text-[11px]">
                      Host: <strong className="text-slate-200">{m.hostName}</strong> • Code:{' '}
                      <strong className="text-emerald-400 font-mono">{m.meetCode}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => navigateTo('meeting-room', { meetingId: m.id })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center space-x-1 shadow transition-colors"
                      title="Enter Classroom Room"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isLive ? 'Enter Room' : 'Preview'}</span>
                    </button>
                  </div>
                </div>

                {/* Attendance Summary & CSV Export Bar */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">
                          {attendeeCount > 0 ? attendeeCount : m.participantsCount} Registered Attendees
                        </span>
                        {isLive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                            Logging Telemetry
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {m.scheduledDate} at {m.startTime} ({m.durationMinutes} mins)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenAttendanceModal(m.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center space-x-1 border border-slate-700 transition-colors"
                      title="View attendee details for this lecture"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>View Roster</span>
                    </button>

                    {/* Dedicated CSV Export Button for this meeting */}
                    <button
                      onClick={() => handleExportMeetingAttendance(m)}
                      disabled={exportingMeetingId === m.id}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                      title="Download attendance records as CSV spreadsheet"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{exportingMeetingId === m.id ? 'Exporting...' : 'Export CSV'}</span>
                    </button>
                  </div>
                </div>

                {/* Host Quick Controls Bar (If Live) */}
                {isLive && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold text-slate-300">Administrative Override Controls:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleControl(m.id, 'toggle_chat')}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>{m.allowChat ? 'Disable Chat' : 'Enable Chat'}</span>
                      </button>

                      <button
                        onClick={() => handleControl(m.id, 'toggle_whiteboard')}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        {m.allowWhiteboard ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{m.allowWhiteboard ? 'Lock Board' : 'Unlock Board'}</span>
                      </button>

                      <button
                        onClick={() => handleControl(m.id, 'mute_all')}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Mute All</span>
                      </button>

                      <button
                        onClick={() => handleControl(m.id, 'end_meeting')}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>End Class</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Attendance & CSV Export Modal */}
      <MeetingAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        initialMeetingId={targetMeetingId}
        meetings={allMeetings}
      />
    </div>
  );
};


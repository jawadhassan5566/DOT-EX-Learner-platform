import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  X,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Radio,
  UserCheck,
  Building2,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Meeting, MeetingAttendance } from '../../types/index.js';
import { exportAttendanceToCsv } from '../../utils/exportAttendanceCsv.js';
import { useApp } from '../../context/AppContext.js';

interface MeetingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetingId?: string;
  meetings: Meeting[];
}

export const MeetingAttendanceModal: React.FC<MeetingAttendanceModalProps> = ({
  isOpen,
  onClose,
  initialMeetingId,
  meetings
}) => {
  const { addToast } = useApp();
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(initialMeetingId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (initialMeetingId) {
      setSelectedMeetingId(initialMeetingId);
    }
  }, [initialMeetingId]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getMeetingAttendance();
      if (res.success) {
        setAttendance(res.attendance);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to load attendance records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAttendance();
    }
  }, [isOpen]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendance.filter((item) => {
      // Meeting filter
      if (selectedMeetingId !== 'all' && item.meetingId !== selectedMeetingId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.userName?.toLowerCase().includes(q);
        const matchEmail = item.userEmail?.toLowerCase().includes(q);
        const matchTitle = item.meetingTitle?.toLowerCase().includes(q);
        const matchCode = item.meetCode?.toLowerCase().includes(q);
        const matchDept = item.department?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchTitle && !matchCode && !matchDept) {
          return false;
        }
      }
      return true;
    });
  }, [attendance, selectedMeetingId, statusFilter, searchQuery]);

  // Quick stats
  const activeCount = filteredRecords.filter(r => r.status === 'active').length;
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      addToast({ type: 'warning', message: 'No attendance records match the selected filter.' });
      return;
    }

    setExporting(true);
    try {
      let customName = '';
      if (selectedMeetingId !== 'all') {
        const targetMeeting = meetings.find(m => m.id === selectedMeetingId);
        const code = targetMeeting?.meetCode || 'CLASS';
        customName = `Attendance_${code}_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        customName = `Live_Meeting_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
      }

      const result = exportAttendanceToCsv(filteredRecords, customName);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'CSV Export Successful',
          message: `Exported ${result.count} attendance records to "${result.filename}".`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to export CSV.' });
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>Classroom Attendance Records & CSV Export</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  {attendance.length} Total Logs
                </span>
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Audit student participant logins, session duration, and export verified records as a spreadsheet.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting || filteredRecords.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
              title="Download CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Generating...' : `Export ${filteredRecords.length} to CSV`}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, email, department, or meet code..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Meeting selector */}
            <div>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="all">All Lectures & Sessions</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.status === 'live' ? '🔴 ' : ''}{m.title} ({m.meetCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="all">All Statuses ({filteredRecords.length})</option>
                <option value="active">Active Now ({activeCount})</option>
                <option value="present">Present ({presentCount})</option>
                <option value="late">Late Arrival ({lateCount})</option>
              </select>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Attendees: <strong className="text-white">{activeCount}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Present: <strong className="text-white">{presentCount}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Late Arrivals: <strong className="text-white">{lateCount}</strong></span>
              </span>
            </div>

            <button
              onClick={loadAttendance}
              disabled={loading}
              className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading attendance telemetry...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-600" />
              <p className="font-bold text-white text-sm">No Attendance Records Found</p>
              <p className="text-slate-500 text-xs">
                No students match your current filter parameters or search query.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 sticky top-0 z-10 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Student / Participant</th>
                  <th className="p-3.5">Meeting / Lecture</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Join Time</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5">Client / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Participant */}
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-blue-300 shrink-0">
                          {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{item.userName}</p>
                          <p className="text-[10px] text-slate-400">{item.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Meeting */}
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-200 line-clamp-1">{item.meetingTitle}</p>
                      <span className="font-mono text-[10px] text-emerald-400">{item.meetCode}</span>
                    </td>

                    {/* Department */}
                    <td className="p-3.5 text-slate-300">
                      <span>{item.department || 'Computer Science'}</span>
                    </td>

                    {/* Join Time */}
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {item.joinedAt ? (
                        <span>
                          {new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[10px] text-slate-500">
                            {new Date(item.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>

                    {/* Duration */}
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      <span className="font-semibold">{item.durationMinutes} mins</span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'present'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Client / IP */}
                    <td className="p-3.5 pr-5 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                      <span>{item.device || 'Desktop Web'}</span>
                      <span className="block text-[10px] text-slate-600">{item.ipAddress || '127.0.0.1'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            Showing <strong className="text-white">{filteredRecords.length}</strong> of{' '}
            <strong className="text-white">{attendance.length}</strong> total attendance records.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold border border-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExportCsv}
              disabled={exporting || filteredRecords.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

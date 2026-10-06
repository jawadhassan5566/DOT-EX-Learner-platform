import { MeetingAttendance } from '../types/index.js';

/**
 * Utility to generate and download a sanitized, Excel-friendly CSV file
 * containing meeting attendance records.
 */
export function exportAttendanceToCsv(
  attendanceRecords: MeetingAttendance[],
  customFilename?: string
): { success: boolean; count: number; filename: string } {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const headers = [
    'Attendance ID',
    'Meeting Title',
    'Room Code',
    'Category',
    'Host / Professor',
    'Institute',
    'Participant Name',
    'Email Address',
    'Role',
    'Academic Department',
    'Join Date & Time',
    'Duration (Minutes)',
    'Attendance Status',
    'Client / Device',
    'IP Address'
  ];

  const escapeCsv = (val: any): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCsv).join(','));

  for (const item of attendanceRecords) {
    const formattedDate = item.joinedAt
      ? new Date(item.joinedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      : 'N/A';

    const row = [
      escapeCsv(item.id),
      escapeCsv(item.meetingTitle),
      escapeCsv(item.meetCode),
      escapeCsv(item.category),
      escapeCsv(item.hostName),
      escapeCsv(item.instituteName || 'Dot X Central University'),
      escapeCsv(item.userName),
      escapeCsv(item.userEmail),
      escapeCsv(item.userRole.toUpperCase()),
      escapeCsv(item.department || 'General'),
      escapeCsv(formattedDate),
      escapeCsv(item.durationMinutes),
      escapeCsv(item.status.toUpperCase()),
      escapeCsv(item.device || 'Desktop Web'),
      escapeCsv(item.ipAddress || '127.0.0.1')
    ];
    rows.push(row.join(','));
  }

  // Prepend \uFEFF (UTF-8 BOM) for Excel compatibility
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const dateStamp = new Date().toISOString().split('T')[0];
  const defaultName = attendanceRecords.length === 1 || (new Set(attendanceRecords.map(a => a.meetingId)).size === 1)
    ? `Attendance_${attendanceRecords[0].meetCode}_${dateStamp}.csv`
    : `Meeting_Attendance_Records_${dateStamp}.csv`;

  const finalFilename = customFilename || defaultName;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: attendanceRecords.length, filename: finalFilename };
}

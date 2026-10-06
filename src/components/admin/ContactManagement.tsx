import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  X,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { ContactTicket } from '../../types/index.js';

export const ContactManagement: React.FC = () => {
  const { addToast } = useApp();

  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<ContactTicket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [status, setStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await api.getContactTickets();
      if (res.success) setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !responseMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.respondContactTicket(activeTicket.id, responseMessage, status);
      if (res.success) {
        addToast({ type: 'success', title: 'Reply Sent', message: res.message });
        setActiveTicket(null);
        setResponseMessage('');
        loadTickets();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span>Academic Helpdesk & Book Requests</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Resolve student inquiry tickets, approve requested textbooks, and log administrative resolutions.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[11px]">
          {tickets.filter(t => t.status === 'new').length} Pending Inquiries
        </span>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="p-4">Sender</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Classification</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-slate-400">{t.email}</p>
                </td>
                <td className="p-4 text-slate-200 font-medium">{t.subject}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    {t.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'new' ? 'bg-amber-500/20 text-amber-300' :
                    t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-500 text-[11px]">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setActiveTicket(t);
                      setResponseMessage(t.adminResponse || '');
                      setStatus(t.status === 'new' ? 'resolved' : t.status);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                  >
                    Review Ticket
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{activeTicket.subject}</h3>
                <p className="text-slate-400 text-[11px]">From: {activeTicket.name} ({activeTicket.email})</p>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Student Message:</span>
              <p className="text-slate-200 leading-relaxed">{activeTicket.message}</p>
            </div>

            <form onSubmit={handleReply} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Official Academic Response</label>
                <textarea
                  rows={4}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  required
                  placeholder="Provide resolution details or textbook acquisition status..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Ticket Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved & Closed</option>
                  <option value="new">Keep Open (New)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Sending...' : 'Send Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

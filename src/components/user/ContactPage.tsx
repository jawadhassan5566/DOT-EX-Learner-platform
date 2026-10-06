import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  HelpCircle,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Building2,
  ShieldCheck,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Institute } from '../../types/index.js';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('inst_punjab');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [type, setType] = useState<'contact' | 'book_request' | 'academic_problem' | 'support' | 'complaint'>('complaint');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{
    recipientEmail: string;
    recipientName: string;
    instituteName: string;
    ticketId: string;
    forwardedAt: string;
  } | null>(null);

  useEffect(() => {
    async function loadInstitutes() {
      try {
        const res = await api.getInstitutes();
        if (res.success && res.institutes.length > 0) {
          setInstitutes(res.institutes);
          // If user belongs to an institute, select it by default, else check for Punjab College
          if (user?.instituteId) {
            setSelectedInstituteId(user.instituteId);
          } else {
            const punjabInst = res.institutes.find((i: Institute) => 
              i.name.toLowerCase().includes('punjab') || i.code.toLowerCase() === 'punjab'
            );
            if (punjabInst) {
              setSelectedInstituteId(punjabInst.id);
            } else {
              setSelectedInstituteId(res.institutes[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading institutes for contact page:', err);
      }
    }
    loadInstitutes();
  }, [user]);

  // Selected institute object
  const activeInstitute = institutes.find(i => i.id === selectedInstituteId) || institutes[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      addToast({ type: 'warning', message: 'Please complete all required fields.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitContact({
        name,
        email,
        type,
        subject,
        message,
        instituteId: selectedInstituteId,
        instituteName: activeInstitute?.name
      });

      if (res.success) {
        setSubmitted(true);
        setDeliveryResult({
          recipientEmail: res.delivery?.recipientEmail || activeInstitute?.adminEmail || 'admin@punjabcollege.edu',
          recipientName: res.delivery?.recipientName || activeInstitute?.adminName || 'Main Admin',
          instituteName: res.delivery?.instituteName || activeInstitute?.name || 'Punjab College',
          ticketId: res.ticketId,
          forwardedAt: res.delivery?.forwardedAt || new Date().toISOString()
        });

        addToast({
          type: 'success',
          title: 'Delivered to Main Admin',
          message: res.message
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Academic Support & Grievance Desk
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Submit complaints, feedback, or book inquiries. Every message is automatically forwarded directly to the official email address of your institution's Main Admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-blue-400 font-bold text-sm">
              <Mail className="w-5 h-5" />
              <span>Direct Admin Forwarding</span>
            </div>
            <p className="text-xs text-slate-300">
              {activeInstitute?.adminEmail || 'admin@punjabcollege.edu'}
            </p>
            <p className="text-[11px] text-slate-500">
              Main Admin of {activeInstitute?.name || 'Punjab College'}.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-emerald-400 font-bold text-sm">
              <Building2 className="w-5 h-5" />
              <span>Campus Routing</span>
            </div>
            <p className="text-xs text-slate-300">
              {activeInstitute ? `${activeInstitute.name} (${activeInstitute.code})` : 'Punjab College (PUNJAB)'}
            </p>
            <p className="text-[11px] text-slate-500">
              {activeInstitute?.address || 'Main Academic Campus'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-purple-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Verified Delivery</span>
            </div>
            <p className="text-xs text-slate-300">Automated Audit & Inbox Dispatch</p>
            <p className="text-[11px] text-slate-500">
              Inquiries trigger immediate priority administrative notifications.
            </p>
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {submitted && deliveryResult ? (
            <div className="py-8 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Message Forwarded to Main Admin!
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Your complaint or inquiry has been automatically dispatched to the official email inbox of the institution's administrator.
                </p>
              </div>

              {/* Verified Routing Receipt Box */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-left max-w-md mx-auto space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Official Delivery Receipt
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Delivered
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Target Institution:</span>
                    <strong className="text-white text-sm flex items-center space-x-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{deliveryResult.instituteName}</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">Forwarded to Main Admin's Email:</span>
                    <strong className="text-emerald-400 font-mono text-sm block mt-0.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {deliveryResult.recipientEmail}
                    </strong>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Recipient: <strong>{deliveryResult.recipientName}</strong>
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                    <span>Ticket Ref: <strong className="text-slate-200 font-mono">{deliveryResult.ticketId}</strong></span>
                    <span>{new Date(deliveryResult.forwardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setSubject('');
                    setMessage('');
                    setDeliveryResult(null);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <h2 className="text-base font-bold text-white">Send a Message or Student Complaint</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your message will be automatically forwarded to the selected institution's Main Admin.
                </p>
              </div>

              {/* Institution Selection */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <label className="block text-slate-200 font-bold text-xs flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Select Institution / College</span>
                </label>

                <select
                  value={selectedInstituteId}
                  onChange={(e) => setSelectedInstituteId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500 text-xs"
                >
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>

                {/* Live Routing Preview Card */}
                {activeInstitute && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start space-x-2 text-[11px]">
                    <UserCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-slate-200">
                        Main Admin: <strong className="text-white">{activeInstitute.adminName}</strong>
                      </p>
                      <p className="text-blue-300 font-mono">
                        Target Email: <strong>{activeInstitute.adminEmail}</strong>
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Submissions are automatically delivered to this admin's official inbox.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Jawad Hassan"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Your Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@punjabcollege.edu"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Classification / Nature of Inquiry</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="complaint">⚠️ Student Complaint / Grievance (Priority)</option>
                  <option value="academic_problem">Report Academic / Course Problem</option>
                  <option value="book_request">Request New Textbook / Paper</option>
                  <option value="support">Technical Support (Meetings / Whiteboard)</option>
                  <option value="contact">General Academic Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Complaint regarding library catalog access or lecture schedule"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Detailed Message / Complaint</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or complaint in detail. This message will be automatically forwarded to the institution Main Admin's email..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Forwarding to Main Admin...'
                    : `Submit & Forward to Main Admin (${activeInstitute?.adminEmail || 'Punjab College'})`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


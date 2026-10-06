import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Search,
  Building2,
  Users,
  BookOpen,
  Video,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Globe,
  MapPin,
  Mail,
  Edit2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Eye,
  ExternalLink,
  SlidersHorizontal,
  X,
  Sparkles,
  Lock,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Institute } from '../../types/index.js';

export const InstituteManagement: React.FC = () => {
  const { addToast, selectedInstituteId, setSelectedInstituteId, refreshInstitutes } = useApp();
  const { isSuperAdmin, user } = useAuth();

  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingInst, setEditingInst] = useState<Institute | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dedicated Announcement Modal State (Option 1 vs Option 2)
  const [announcementModalInst, setAnnouncementModalInst] = useState<Institute | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementVisibility, setAnnouncementVisibility] = useState<'institute' | 'global'>('institute');
  const [announcementAudience, setAnnouncementAudience] = useState<'students' | 'all' | 'teachers'>('students');
  const [dispatchingAnnouncement, setDispatchingAnnouncement] = useState(false);

  // New Institute Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    slug: '',
    description: '',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
    adminName: '',
    adminEmail: '',
    adminPassword: 'password123',
    address: '',
    website: '',
    allowRegistration: true
  });

  const loadInstitutes = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminInstitutes();
      if (res.success && Array.isArray(res.institutes)) {
        setInstitutes(res.institutes);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to load institutes list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutes();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.adminName.trim() || !formData.adminEmail.trim()) {
      addToast({ type: 'error', message: 'Please fill in all required institutional and admin fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createInstitute(formData);
      if (res.success) {
        // Save to Firestore database for persistent storage
        if (res.institute) {
          firestoreService.saveInstitute(res.institute).catch(err => {
            console.warn("Firestore institute save non-fatal:", err);
          });
        }

        addToast({
          type: 'success',
          title: 'Institute Provisioned & Saved to Database',
          message: res.message || `Successfully created ${formData.name} and saved to database.`
        });
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          code: '',
          slug: '',
          description: '',
          logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
          adminName: '',
          adminEmail: '',
          adminPassword: 'password123',
          address: '',
          website: '',
          allowRegistration: true
        });
        await loadInstitutes();
        await refreshInstitutes();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Error creating new institute.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;

    setSubmitting(true);
    try {
      const res = await api.updateInstitute(editingInst.id, editingInst);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Institute Updated',
          message: res.message || `Updated ${editingInst.name}.`
        });
        setIsEditModalOpen(false);
        setEditingInst(null);
        await loadInstitutes();
        await refreshInstitutes();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Error updating institute.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (inst: Institute) => {
    const nextStatus = inst.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.updateInstitute(inst.id, { status: nextStatus });
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Status Updated',
          message: `${inst.name} is now ${nextStatus}.`
        });
        await loadInstitutes();
        await refreshInstitutes();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Could not update status.' });
    }
  };

  const handleDelete = async (inst: Institute) => {
    if (inst.id === 'inst_dotx') {
      addToast({ type: 'warning', message: 'Primary central university cannot be deleted.' });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${inst.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.deleteInstitute(inst.id);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Institute Deleted',
          message: res.message || `${inst.name} has been removed.`
        });
        if (selectedInstituteId === inst.id) {
          setSelectedInstituteId('inst_dotx');
        }
        await loadInstitutes();
        await refreshInstitutes();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to delete institute.' });
    }
  };

  const handleDispatchAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementModalInst) return;
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      addToast({ type: 'error', message: 'Please provide both title and message for the announcement.' });
      return;
    }
    setDispatchingAnnouncement(true);
    try {
      const isGlobal = announcementVisibility === 'global';
      const payload = {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        type: 'announcement',
        targetAudience: announcementAudience,
        targetGroup: announcementAudience,
        visibility: announcementVisibility,
        scope: announcementVisibility,
        isGlobal,
        instituteId: announcementModalInst.id,
        instituteName: announcementModalInst.name
      };

      const res = await api.broadcastNotification(payload);
      if (res.success) {
        firestoreService.saveAnnouncement({
          ...payload,
          id: res.notification?.id || `notif_${Date.now()}`,
          createdAt: new Date().toISOString()
        }).catch(err => console.warn("Firestore announcement save fallback:", err));

        addToast({
          type: 'success',
          title: isGlobal ? 'Global Broadcast Dispatched' : 'Institute Broadcast Dispatched',
          message: isGlobal
            ? `Option 2: Announcement broadcasted globally to all students across every institute!`
            : `Option 1: Announcement routed strictly to students enrolled in ${announcementModalInst.name}.`
        });
        setAnnouncementModalInst(null);
        setAnnouncementTitle('');
        setAnnouncementMessage('');
        setAnnouncementVisibility('institute');
        await loadInstitutes();
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to dispatch announcement.' });
    } finally {
      setDispatchingAnnouncement(false);
    }
  };

  // Filtered institutes list
  const filtered = institutes.filter(inst => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.address && inst.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (user?.role === 'subadmin') {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Access Restricted: Institutes & Organizations</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sub-Admins have limited operational permissions and do not have access to institution settings or management.
          Per system policy, Sub-Admins may only manage books, create announcements, and create meetings.
        </p>
        <p className="text-[11px] text-slate-500">
          Institution configuration and administration are restricted to Main Admins and the Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Landmark className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Institutes & Organizations Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                Multi-Tenant Architecture
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Super Admin can provision autonomous partner universities, polytechnics, and campuses.
              Each institute maintains an isolated catalog of books, dedicated student cohorts, live classrooms, and private announcements.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={loadInstitutes}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Institute</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Scope Quick Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400">Current Header Global Scope:</span>
            <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>{selectedInstituteId === 'all' ? 'All Institutes (Global Aggregate)' : (institutes.find(i => i.id === selectedInstituteId)?.name || 'Dot X Central')}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
            <span>Total Campuses: <strong className="text-white">{institutes.length}</strong></span>
            <span>Active: <strong className="text-emerald-400">{institutes.filter(i => i.status === 'active').length}</strong></span>
            <span>Suspended: <strong className="text-rose-400">{institutes.filter(i => i.status === 'suspended').length}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institute name, code, or administrator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {(['all', 'active', 'suspended'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Institutes Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading multi-tenant campus directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Institutes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? `No institutes matching "${searchQuery}". Try clearing search.` : 'No institutes configured yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(inst => {
            const isCurrentlySelected = selectedInstituteId === inst.id;
            return (
              <div
                key={inst.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all relative overflow-hidden group ${
                  isCurrentlySelected
                    ? 'border-amber-500/80 ring-2 ring-amber-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Active Scope Accent Badge */}
                {isCurrentlySelected && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg shadow-sm flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Global Scope</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start space-x-3.5 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {inst.logo ? (
                        <img src={inst.logo} alt={inst.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-amber-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px] rounded border border-blue-500/30">
                          {inst.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          inst.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1 leading-snug truncate" title={inst.name}>
                        {inst.name}
                      </h3>
                      {inst.address && (
                        <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{inst.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {inst.description}
                  </p>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">Students</div>
                      <div className="font-bold text-white text-xs mt-0.5">{inst.studentCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Books</div>
                      <div className="font-bold text-amber-400 text-xs mt-0.5">{inst.bookCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Classes</div>
                      <div className="font-bold text-sky-400 text-xs mt-0.5">{inst.meetingCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Notices</div>
                      <div className="font-bold text-indigo-400 text-xs mt-0.5">{inst.announcementCount ?? 0}</div>
                    </div>
                  </div>

                  {/* Admin in charge */}
                  <div className="text-[11px] bg-slate-850 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-medium flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Dedicated Admin:</span>
                      </span>
                      <strong className="text-white truncate max-w-[130px]">{inst.adminName}</strong>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>Email:</span>
                      </span>
                      <span className="text-slate-300 font-mono text-[10px] truncate max-w-[140px]">{inst.adminEmail}</span>
                    </div>
                    {inst.website && (
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>Portal:</span>
                        </span>
                        <a
                          href={inst.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline text-[10px] truncate max-w-[140px]"
                        >
                          {inst.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {/* Scope Switch Button */}
                  <button
                    onClick={() => setSelectedInstituteId(inst.id)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      isCurrentlySelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30'
                    }`}
                    title="Switch global application context to this institute's scope"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCurrentlySelected ? 'Current Scope' : 'Switch Scope'}</span>
                  </button>

                  {/* Post Announcement Button */}
                  <button
                    onClick={() => {
                      setAnnouncementModalInst(inst);
                      setAnnouncementVisibility('institute');
                      setAnnouncementTitle('');
                      setAnnouncementMessage('');
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title={`Broadcast Notice for ${inst.name} (Option 1: Institute-only or Option 2: Global)`}
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-400 hover:text-white" />
                  </button>

                  {/* Edit action */}
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setEditingInst({ ...inst });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Edit Institute Parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(inst)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          inst.status === 'active'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={inst.status === 'active' ? 'Suspend Institute' : 'Activate Institute'}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>

                      {inst.id !== 'inst_dotx' && (
                        <button
                          onClick={() => handleDelete(inst)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                          title="Delete Institute"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE INSTITUTE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Add Partner Institute / Organization</h3>
                  <p className="text-[11px] text-slate-400">Creates isolated dataset, dedicated admin, catalog, and bulletin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Institute Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford Academic Campus"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Institutional Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STAN or MIT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description / Academic Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="Primary academic campus, polytechnic or research specialization..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Dedicated Administrator Assignment */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dedicated Institute Administrator Account</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Admin Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dean Marcus Vance"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Admin Work Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@campus.edu"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Initial Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="password123"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default password is 'password123'. Admin can change it after login.</p>
                </div>
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Campus Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 450 Serra Mall, Stanford, CA"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Official Website / Portal</label>
                  <input
                    type="url"
                    placeholder="https://stanford.edu"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Logo & Student Registration Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Campus Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-4 sm:pt-0">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={formData.allowRegistration}
                    onChange={(e) => setFormData({ ...formData, allowRegistration: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                  />
                  <label htmlFor="allowRegistration" className="text-xs font-medium text-slate-200 cursor-pointer">
                    Allow Student Self-Registration under this institute
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Provision Institute & Dataset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSTITUTE MODAL */}
      {isEditModalOpen && editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Edit Institute: {editingInst.name}</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Institute Name</label>
                <input
                  type="text"
                  required
                  value={editingInst.name}
                  onChange={(e) => setEditingInst({ ...editingInst, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Institutional Code</label>
                  <input
                    type="text"
                    required
                    value={editingInst.code}
                    onChange={(e) => setEditingInst({ ...editingInst, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={editingInst.status}
                    onChange={(e) => setEditingInst({ ...editingInst, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingInst.description}
                  onChange={(e) => setEditingInst({ ...editingInst, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editingInst.address || ''}
                  onChange={(e) => setEditingInst({ ...editingInst, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Website URL</label>
                <input
                  type="url"
                  value={editingInst.website || ''}
                  onChange={(e) => setEditingInst({ ...editingInst, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="editAllowRegistration"
                  checked={editingInst.allowRegistration}
                  onChange={(e) => setEditingInst({ ...editingInst, allowRegistration: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="editAllowRegistration" className="text-xs font-medium text-slate-200 cursor-pointer">
                  Allow Student Self-Registration under this institute
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED INSTITUTE ANNOUNCEMENT MODAL (Option 1 vs Option 2) */}
      {announcementModalInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Broadcast Announcement for {announcementModalInst.name}</h3>
                  <p className="text-[11px] text-slate-400">Choose Option 1 (Institute Students Only) or Option 2 (Show Global)</p>
                </div>
              </div>
              <button
                onClick={() => setAnnouncementModalInst(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchAnnouncement} className="p-5 space-y-4 overflow-y-auto">
              {/* Option 1 vs Option 2 Selector */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
                  <span>Announcement Visibility & Target Scope *</span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Required</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Only show on institute students */}
                  <div
                    onClick={() => setAnnouncementVisibility('institute')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      announcementVisibility === 'institute'
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10 text-white'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        announcementVisibility === 'institute' ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                      }`}>
                        {announcementVisibility === 'institute' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Option 1: Only show on institute students</span>
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 pl-6">
                      🔒 Only students enrolled in <strong>{announcementModalInst.name}</strong> will receive and view this announcement.
                    </p>
                  </div>

                  {/* Option 2: Show global */}
                  <div
                    onClick={() => setAnnouncementVisibility('global')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      announcementVisibility === 'global'
                        ? 'bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-500/10 text-white'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        announcementVisibility === 'global' ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-600'
                      }`}>
                        {announcementVisibility === 'global' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Option 2: Show global</span>
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 pl-6">
                      🌐 Broadcast to <strong>all students across the entire platform</strong> globally, badged with {announcementModalInst.name}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Registration Opens / Mid-Term Exams Schedule"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Recipient Role
                </label>
                <select
                  value={announcementAudience}
                  onChange={(e) => setAnnouncementAudience(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="students">Students Only</option>
                  <option value="all">Everyone (Students & Teachers)</option>
                  <option value="teachers">Faculty / Teachers Only</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Announcement Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write detailed bulletin instructions and notices for students..."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalInst(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchingAnnouncement}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center space-x-1.5 transition-all disabled:opacity-50 ${
                    announcementVisibility === 'global'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  {dispatchingAnnouncement ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {dispatchingAnnouncement
                      ? 'Dispatching...'
                      : announcementVisibility === 'global'
                        ? 'Dispatch Option 2 (Show Global)'
                        : 'Dispatch Option 1 (Only Show on Institute Students)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

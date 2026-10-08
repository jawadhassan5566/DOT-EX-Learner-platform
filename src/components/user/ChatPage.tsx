import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCheck,
  Check,
  Paperclip,
  Smile,
  Shield,
  Clock,
  Sparkles,
  Plus,
  Briefcase,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  firestoreService,
  DirectConversation,
  DirectMessage,
  DirectParticipant,
  getConversationId
} from '../../services/firestoreService.js';
import { CAMPUS_JOBS } from '../../data/mockJobs.js';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast, navigateTo } = useApp();

  const currentUserId = user?.id || 'demo_student_01';
  const currentSender: DirectParticipant = {
    id: currentUserId,
    name: user?.name || 'Dot X Scholar',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: user?.role || 'student',
    email: user?.email || 'scholar@dotx.edu'
  };

  // State
  const [firestoreConversations, setFirestoreConversations] = useState<DirectConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [searchContact, setSearchContact] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 1. Subscribe to Real-Time Firestore Conversations
  useEffect(() => {
    let isSubscribed = true;

    // Load initial mock / backend conversations as baseline fallback
    async function loadFallbackConversations() {
      try {
        const res = await api.getConversations();
        if (res.success && Array.isArray(res.conversations)) {
          // Adapt API conversations to DirectConversation format
          const adapted: DirectConversation[] = res.conversations.map((c: any) => ({
            id: c.id,
            participantIds: c.participantIds || [currentUserId, (c.participantDetails?.[0]?.id || 'partner')],
            participants: (c.participantDetails || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              role: p.role,
              email: `${p.name ? p.name.toLowerCase().replace(/\s+/g, '.') : 'user'}@dotx.edu`
            })),
            lastMessage: c.lastMessage || 'Hello!',
            lastMessageTime: c.lastMessageTime || 'Just now',
            lastMessageTimestamp: Date.now() - 3600000,
            lastSenderId: c.participantDetails?.[0]?.id || ''
          }));

          if (isSubscribed && adapted.length > 0) {
            setFirestoreConversations(prev => {
              // Merge without duplicates
              const existingIds = new Set(prev.map(p => p.id));
              const toAdd = adapted.filter(a => !existingIds.has(a.id));
              return [...prev, ...toAdd];
            });
          }
        }
      } catch (err) {
        console.warn('API conversations load notice:', err);
      }
    }

    loadFallbackConversations();

    // Subscribe to Firestore 'conversations' collection in real-time
    const unsubscribe = firestoreService.subscribeToUserConversations(currentUserId, (convs) => {
      if (!isSubscribed) return;
      setLoading(false);

      if (convs && convs.length > 0) {
        setFirestoreConversations(prev => {
          // Merge Firestore live conversations on top
          const liveMap = new Map<string, DirectConversation>();
          prev.forEach(p => liveMap.set(p.id, p));
          convs.forEach(c => liveMap.set(c.id, c));
          const merged = Array.from(liveMap.values());
          merged.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
          return merged;
        });

        // If no active chat selected yet, select first
        setActiveConvId(current => current || convs[0].id);
      } else {
        // If user has no conversations yet, create an introductory welcome conversation with Dr. Elena Vance (Job Owner)
        const jobOwner = CAMPUS_JOBS[0].owner;
        firestoreService.getOrCreateConversation(
          currentSender,
          {
            id: jobOwner.id,
            name: jobOwner.name,
            avatar: jobOwner.avatar,
            role: jobOwner.role,
            email: jobOwner.email
          },
          {
            jobId: CAMPUS_JOBS[0].id,
            jobTitle: CAMPUS_JOBS[0].title,
            companyOrInstitute: CAMPUS_JOBS[0].institute
          }
        ).catch(() => {});
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUserId]);

  // 2. Subscribe to Real-Time Messages in Firestore
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;

    // Check if it's a Firestore conversation (or starts with 'conv_')
    const unsubscribe = firestoreService.subscribeToConversationMessages(activeConvId, (liveMsgs) => {
      if (!isSubscribed) return;
      if (liveMsgs && liveMsgs.length > 0) {
        setMessages(liveMsgs);
      } else {
        // Fallback: check if API has initial messages
        api.getChatMessages(activeConvId).then(apiRes => {
          if (isSubscribed && apiRes.success && apiRes.messages.length > 0) {
            const adapted: DirectMessage[] = apiRes.messages.map(m => ({
              id: m.id,
              conversationId: activeConvId,
              senderId: m.senderId,
              senderName: m.senderId === currentUserId ? currentSender.name : 'Participant',
              receiverId: currentUserId,
              text: m.text,
              timestamp: new Date(m.createdAt).getTime(),
              createdAt: m.createdAt,
              read: true
            }));
            setMessages(adapted);
          }
        }).catch(() => {});
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [activeConvId, currentUserId]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    const activeConv = firestoreConversations.find(c => c.id === activeConvId);
    const otherParticipant = activeConv?.participants?.find(p => p.id !== currentUserId) || {
      id: 'job_owner_demo',
      name: 'Campus Job Owner',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'faculty',
      email: 'owner@dotx.edu'
    };

    try {
      // 1. Send directly via Firestore service (saves to collection 'messages' and updates 'conversations')
      await firestoreService.sendDirectMessage({
        conversationId: activeConvId,
        sender: currentSender,
        receiver: otherParticipant,
        text: textToSend,
        jobContext: activeConv?.jobContext
      });

      // 2. Update local state optimistically
      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setFirestoreConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                lastMessage: textToSend,
                lastMessageTime: nowFormatted,
                lastMessageTimestamp: Date.now(),
                lastSenderId: currentUserId
              }
            : c
        )
      );

      // Also notify backend API if old conversation exists
      api.sendChatMessage(activeConvId, textToSend).catch(() => {});
    } catch (err: any) {
      console.error('Send message error:', err);
      addToast({ type: 'error', message: err.message || 'Failed to send message.' });
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleStartChatWithJobOwner = async (job: typeof CAMPUS_JOBS[0]) => {
    const owner = job.owner;
    const conv = await firestoreService.getOrCreateConversation(
      currentSender,
      {
        id: owner.id,
        name: owner.name,
        avatar: owner.avatar,
        role: owner.role,
        email: owner.email
      },
      {
        jobId: job.id,
        jobTitle: job.title,
        companyOrInstitute: job.institute
      }
    );

    setActiveConvId(conv.id);
    setShowNewChatModal(false);
    addToast({
      type: 'success',
      message: `Conversation active with ${owner.name}.`
    });
  };

  const activeConv = firestoreConversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.participants?.find(p => p.id !== currentUserId) || activeConv?.participants?.[0];

  const filteredConversations = firestoreConversations.filter(c => {
    const other = c.participants?.find(p => p.id !== currentUserId) || c.participants?.[0];
    if (!other) return true;
    return (
      other.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      (other.role && other.role.toLowerCase().includes(searchContact.toLowerCase())) ||
      (c.jobContext?.jobTitle && c.jobContext.jobTitle.toLowerCase().includes(searchContact.toLowerCase()))
    );
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[620px] flex rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* 1. Left Contact List Pane */}
      <div className="w-80 sm:w-88 border-r border-slate-800 flex flex-col bg-slate-950/70">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-sm text-white tracking-tight leading-tight">
                  Private Messages
                </h2>
                <p className="text-[10px] text-emerald-400 font-mono font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Real-Time</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-sm"
              title="Start new chat with job owner or faculty"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats, owners, jobs..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
          {loading && firestoreConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading private chats...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No chats found.</p>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Chat with Job Owner
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = conv.participants?.find(p => p.id !== currentUserId) || conv.participants?.[0] || {
                id: 'unknown',
                name: 'Job Owner',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                role: 'faculty'
              };
              const isActive = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer flex items-center space-x-3 transition-colors ${
                    isActive ? 'bg-blue-600/15 border-l-4 border-blue-500' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={partner.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt={partner.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white truncate">{partner.name}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {conv.lastMessageTime || 'Recently'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] text-blue-400 capitalize font-medium truncate">
                        {partner.role === 'faculty' ? 'Job Owner / Faculty' : partner.role || 'Member'}
                      </span>
                      {conv.jobContext?.jobTitle && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 truncate max-w-[110px]">
                          {conv.jobContext.jobTitle}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-1">
                      {conv.lastSenderId === currentUserId ? 'You: ' : ''}{conv.lastMessage || 'Started conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Link to Job Profiles Page */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => navigateTo('job-profile')}
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer w-full text-left"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="truncate">View Campus Job Profiles</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-500" />
          </button>
        </div>
      </div>

      {/* 2. Right Chat Conversation Area */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {activeConv && otherUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={otherUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40 bg-slate-800"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-sm text-white truncate">{otherUser.name}</h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium">
                    <span className="capitalize">{otherUser.role === 'faculty' ? 'Job Owner / Faculty Chair' : otherUser.role}</span>
                    <span>•</span>
                    <span>Online & Verified</span>
                  </p>
                </div>
              </div>

              {/* Context Actions */}
              <div className="flex items-center space-x-2">
                {activeConv.jobContext?.jobId && (
                  <button
                    type="button"
                    onClick={() => navigateTo('job-profile', { jobId: activeConv.jobContext?.jobId })}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">View Job Profile</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                  {activeConv.id}
                </span>
              </div>
            </div>

            {/* Job Context Strip if chatting about a position */}
            {activeConv.jobContext?.jobTitle && (
              <div className="px-4 py-2 bg-blue-950/60 border-b border-blue-900/50 flex items-center justify-between text-xs text-blue-200">
                <div className="flex items-center space-x-2 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-semibold text-xs truncate">
                    Subject: {activeConv.jobContext.jobTitle}
                  </span>
                  {activeConv.jobContext.companyOrInstitute && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      ({activeConv.jobContext.companyOrInstitute})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('job-profile', { jobId: activeConv.jobContext?.jobId })}
                  className="text-[11px] text-blue-400 hover:underline font-bold shrink-0 ml-2 cursor-pointer flex items-center space-x-1"
                >
                  <span>Open Job</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#080d19] scrollbar-thin">
              {messages.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Start your private conversation</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Direct messages are stored privately in Firebase Firestore between you and {otherUser.name}.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMe = m.senderId === currentUserId;
                  const timeFormatted = m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Now';

                  return (
                    <div
                      key={m.id || index}
                      className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                    >
                      {!isMe && (
                        <img
                          src={otherUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={otherUser.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-slate-700 bg-slate-800"
                        />
                      )}

                      <div className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-800 border border-slate-700/70 text-slate-100 rounded-bl-xs'
                      }`}>
                        <p className="break-words select-text">{m.text}</p>
                        <div className={`flex items-center justify-end space-x-1 text-[10px] mt-1.5 ${
                          isMe ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          <span>{timeFormatted}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Input */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Send private message to ${otherUser.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <MessageSquare className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-300">Select a private chat or job owner</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              Choose from the list on the left, or visit the Job Profile page to message a faculty job owner.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('job-profile')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow"
            >
              Browse Job Profiles
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal Dialog */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Message a Campus Job Owner</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select any active job posting below to start a private real-time chat with the hiring owner:
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {CAMPUS_JOBS.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleStartChatWithJobOwner(job)}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500 hover:bg-blue-950/30 transition-all cursor-pointer flex items-center space-x-3"
                >
                  <img
                    src={job.owner.avatar}
                    alt={job.owner.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{job.owner.name}</h4>
                    <p className="text-[11px] text-blue-400 truncate">{job.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{job.stipend}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;

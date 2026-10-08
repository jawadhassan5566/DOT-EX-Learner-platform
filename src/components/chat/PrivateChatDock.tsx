import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Maximize2,
  Send,
  User,
  Check,
  CheckCheck,
  Briefcase,
  Sparkles,
  Smile,
  ShieldCheck,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  firestoreService,
  DirectMessage,
  getConversationId,
  DirectParticipant
} from '../../services/firestoreService.js';

export const PrivateChatDock: React.FC = () => {
  const { activePrivateChat, closePrivateChat, navigateTo } = useApp();
  const { user } = useAuth();

  const [minimized, setMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derive sender participant info
  const currentSender: DirectParticipant = {
    id: user?.id || 'demo_student_01',
    name: user?.name || 'Dot X Scholar',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: user?.role || 'student',
    email: user?.email || 'student@dotx.edu'
  };

  const recipient = activePrivateChat?.recipient;

  useEffect(() => {
    if (!recipient) return;

    const convId = getConversationId(currentSender.id, recipient.id);
    setConversationId(convId);
    setMinimized(false);

    // Initialize or get conversation record in Firestore
    firestoreService.getOrCreateConversation(
      currentSender,
      recipient,
      activePrivateChat.jobContext
    ).catch(err => console.warn('Could not ensure conversation:', err));

    // Subscribe to real-time messages in Firestore collection 'messages'
    const unsubscribe = firestoreService.subscribeToConversationMessages(convId, (msgs) => {
      setMessages(msgs);
      setIsLiveConnected(true);
    });

    // If an initial message was passed (e.g. from Job Profile), prefill the input
    if (activePrivateChat.initialMessage) {
      setInputText(activePrivateChat.initialMessage);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      unsubscribe();
    };
  }, [recipient?.id, currentSender.id]);

  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);

  if (!activePrivateChat || !recipient) {
    return null;
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || !conversationId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await firestoreService.sendDirectMessage({
        conversationId,
        sender: currentSender,
        receiver: recipient,
        text: textToSend,
        jobContext: activePrivateChat.jobContext
      });
    } catch (err) {
      console.error('Failed to send private message:', err);
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const quickPrompts = [
    activePrivateChat.jobContext?.jobTitle
      ? `Hello Dr. ${recipient.name.split(' ').pop() || ''}, I am interested in the ${activePrivateChat.jobContext.jobTitle} position!`
      : 'Hello! I would like to ask a quick question.',
    'Is this role open to hybrid/remote students?',
    'What are the core prerequisites for this application?'
  ];

  // Minimized Floating Bubble View (Facebook Style)
  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="group relative flex items-center bg-slate-900/95 hover:bg-slate-800 border-2 border-blue-500/80 rounded-full shadow-2xl p-2 pr-4 transition-all duration-200 cursor-pointer text-left"
          title={`Open chat with ${recipient.name}`}
        >
          <div className="relative">
            <img
              src={recipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={recipient.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-800"
            />
            <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full absolute bottom-0 right-0 shadow" />
          </div>
          <div className="ml-2.5 max-w-[140px] truncate">
            <p className="text-xs font-bold text-white truncate">{recipient.name}</p>
            <p className="text-[10px] text-blue-400 flex items-center space-x-1">
              <MessageSquare className="w-2.5 h-2.5 inline mr-1" />
              <span>Click to chat</span>
            </p>
          </div>
          {messages.length > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow">
              {messages.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={closePrivateChat}
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 shadow cursor-pointer"
          title="Close chat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded Facebook-Style Floating Dock Window
  return (
    <div
      className="fixed bottom-0 right-4 sm:right-6 z-50 w-[95vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-slate-950 border border-slate-700/90 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom-6 duration-200"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
    >
      {/* Dock Window Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 border-b border-slate-800 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={recipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={recipient.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/20 bg-slate-800"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 absolute bottom-0 right-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
                {recipient.name}
              </h4>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            </div>
            <p className="text-[11px] text-blue-200 truncate font-medium">
              {recipient.role === 'faculty' ? 'Faculty / Job Owner' : recipient.role || 'Member'} • <span className="text-emerald-300">Active Now</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 shrink-0 text-white/80">
          <button
            type="button"
            onClick={() => {
              navigateTo('chat');
              closePrivateChat();
            }}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Open in full Chat page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={closePrivateChat}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Context Badge if Chatting About a Specific Job */}
      {activePrivateChat.jobContext && (
        <div className="px-3.5 py-1.5 bg-blue-950/80 border-b border-blue-900/50 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-1.5 min-w-0">
            <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate font-semibold text-[11px]">
              Re: {activePrivateChat.jobContext.jobTitle || 'Job Inquiries'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
            Job Owner
          </span>
        </div>
      )}

      {/* Real-time Status Notice */}
      <div className="px-3 py-1 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400 font-bold">Firestore Real-Time Live</span>
        </span>
        <span className="font-mono text-slate-500 text-[9px] truncate max-w-[140px]">
          {conversationId}
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#0a0f1d] scrollbar-thin">
        {messages.length === 0 ? (
          <div className="py-8 px-2 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Private direct chat with {recipient.name}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                Messages are private, encrypted, and synced in real-time to Firebase Firestore.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="w-full pt-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Quick questions to ask:
              </span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(prompt)}
                  className="w-full text-left text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white p-2 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentSender.id;
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now';

            return (
              <div
                key={msg.id || index}
                className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                {!isMe && (
                  <img
                    src={recipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={recipient.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 border border-slate-700"
                  />
                )}

                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                  isMe
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-xs'
                }`}>
                  <p className="break-words select-text">{msg.text}</p>
                  <div className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                    isMe ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-blue-200 inline" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${recipient.name}...`}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-8"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow cursor-pointer shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

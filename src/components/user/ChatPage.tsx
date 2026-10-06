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
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { ChatConversation, ChatMessage } from '../../types/index.js';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await api.getConversations();
        if (res.success) {
          setConversations(res.conversations);
          if (res.conversations.length > 0) {
            setActiveConvId(res.conversations[0].id);
          }
        }
      } catch (err) {
        console.error("Chat conversations load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConvId) return;
      try {
        const res = await api.getChatMessages(activeConvId);
        if (res.success) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error("Chat messages load error:", err);
      }
    }
    loadMessages();
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId) return;

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      const res = await api.sendChatMessage(activeConvId, textToSend);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        // Update last message in conversation list
        setConversations(prev =>
          prev.map(c => (c.id === activeConvId ? { ...c, lastMessage: textToSend, lastMessageTime: 'Just now' } : c))
        );
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to send message.' });
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.participantDetails.find(p => p.id !== user?.id);

  const filteredConversations = conversations.filter(c => {
    const other = c.participantDetails.find(p => p.id !== user?.id);
    if (!other) return true;
    return other.name.toLowerCase().includes(searchContact.toLowerCase()) ||
           other.role.toLowerCase().includes(searchContact.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] flex rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl pb-0">
      {/* 1. Left Contact List Pane */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-base text-white tracking-tight flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Academic Inbox</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
              Secure
            </span>
          </div>

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty or peers..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredConversations.map((conv) => {
            const partner = conv.participantDetails.find(p => p.id !== user?.id) || conv.participantDetails[0];
            const isActive = conv.id === activeConvId;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3.5 cursor-pointer flex items-center space-x-3 transition-colors ${
                  isActive ? 'bg-blue-600/15 border-l-4 border-blue-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="relative">
                  <img
                    src={partner.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={partner.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white truncate">{partner.name}</h4>
                    <span className="text-[10px] text-slate-500">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-[10px] text-blue-400 capitalize">{partner.role}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right Chat Conversation Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {activeConv && otherUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-blue-500/40"
                />
                <div>
                  <h3 className="font-bold text-sm text-white">{otherUser.name}</h3>
                  <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="capitalize">{otherUser.role} • Online</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.map((m) => {
                const isMe = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                    }`}>
                      <p>{m.text}</p>
                      <div className="flex items-center justify-end space-x-1 text-[10px] opacity-60 mt-1">
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-sky-200" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${otherUser.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <MessageSquare className="w-10 h-10 mb-2 text-slate-600" />
            <p>Select a faculty member or student to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

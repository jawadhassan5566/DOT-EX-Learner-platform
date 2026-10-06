import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Users,
  Video,
  Radio,
  QrCode
} from 'lucide-react';
import { Meeting } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';

interface ShareMeetingModalProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareMeetingModal: React.FC<ShareMeetingModalProps> = ({
  meeting,
  isOpen,
  onClose
}) => {
  const { addToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${base}/?meetingId=${meeting.id}&meetCode=${meeting.meetCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Classroom meeting link copied to clipboard.'
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(meeting.meetCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    addToast({
      type: 'info',
      title: 'Code Copied',
      message: `Meeting room code ${meeting.meetCode} copied to clipboard.`
    });
  };

  const shareViaNavigator = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dot X Library - ${meeting.title}`,
          text: `Join our academic meeting on Dot X Library: ${meeting.title} (Code: ${meeting.meetCode})`,
          url: shareLink
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Share Meeting Link</h3>
              <p className="text-xs text-slate-400">Invite peers and students to join</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting Brief */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-blue-400 font-semibold">{meeting.category}</span>
            <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
              meeting.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {meeting.status}
            </span>
          </div>
          <h4 className="font-bold text-sm text-white">{meeting.title}</h4>
          <p className="text-xs text-slate-400">Host: {meeting.hostName} • {meeting.scheduledDate} {meeting.startTime}</p>
        </div>

        {/* Room Code Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Classroom Code</span>
            <p className="text-lg font-mono font-extrabold text-emerald-400 tracking-wider mt-0.5">{meeting.meetCode}</p>
          </div>
          <button
            onClick={copyCode}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Direct Invitation URL</label>
          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs text-blue-400 font-mono truncate select-all pl-1">{shareLink}</span>
            <button
              onClick={copyLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                copiedLink ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={shareViaNavigator}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-700"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share via Device Apps</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

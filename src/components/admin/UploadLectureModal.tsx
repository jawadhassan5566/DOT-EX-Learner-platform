import React, { useState } from 'react';
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  Lock,
  Globe,
  Tag,
  Clock,
  BookOpen,
  Layers,
  Sparkles,
  Shield,
  FileVideo,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { LectureMedia } from '../../types/index.js';

interface UploadLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLecture: LectureMedia) => void;
}

export const UploadLectureModal: React.FC<UploadLectureModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'picture'>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'global'>('global');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [courseLevel, setCourseLevel] = useState('Undergraduate');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const subjects = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Engineering',
    'Biology & Medicine',
    'Chemistry',
    'English & Literature',
    'Business & Economics',
    'General Academic'
  ];

  // Quick preset samples for fast testing
  const samplePresets = [
    {
      title: 'Operating Systems: Thread Scheduling & Deadlock Prevention',
      type: 'video' as const,
      subject: 'Computer Science',
      topic: 'Deadlock & Concurrency',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
      desc: 'In-depth video analysis on Peterson’s algorithm, semaphore synchronization, priority inversion, and Banker’s safety states.',
      level: 'Undergraduate',
      duration: 35,
      tags: 'OperatingSystems, Threads, Concurrency'
    },
    {
      title: 'Neural Networks & Backpropagation Architecture (Infographic Map)',
      type: 'picture' as const,
      subject: 'Computer Science',
      topic: 'Deep Learning & Gradient Descent',
      url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop',
      thumb: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop',
      desc: 'High-res visual study diagram of chain rule derivations, matrix forward-pass tensors, and Adam optimizer equations.',
      level: 'Advanced',
      duration: 0,
      tags: 'AI, NeuralNetworks, DeepLearning'
    }
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setTitle(preset.title);
    setMediaType(preset.type);
    setSubject(preset.subject);
    setTopic(preset.topic);
    setMediaUrl(preset.url);
    setThumbnailUrl(preset.thumb);
    setDescription(preset.desc);
    setCourseLevel(preset.level);
    setDurationMinutes(preset.duration);
    setTagsInput(preset.tags);
    setFilePreview(preset.url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 25MB for preview)
    if (file.size > 25 * 1024 * 1024) {
      addToast({
        type: 'error',
        message: 'File size exceeds 25MB limit. Please provide a direct video/image URL instead.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setMediaUrl(dataUrl);
      setFilePreview(dataUrl);
      if (mediaType === 'picture') {
        setThumbnailUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast({ type: 'error', message: 'Please enter a lecture title.' });
      return;
    }

    if (!description.trim()) {
      addToast({ type: 'error', message: 'Please enter a description for the study material.' });
      return;
    }

    if (!mediaUrl.trim()) {
      addToast({ type: 'error', message: 'Please provide a media URL or upload a file.' });
      return;
    }

    setUploading(true);
    try {
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const res = await api.createLecture({
        title: title.trim(),
        description: description.trim(),
        mediaType,
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        visibility,
        subject,
        topic: topic.trim() || undefined,
        courseLevel,
        durationMinutes: mediaType === 'video' ? Number(durationMinutes) || undefined : undefined,
        tags: tagsArray,
        instituteId: user?.instituteId || undefined
      });

      if (res.success && res.lecture) {
        addToast({
          type: 'success',
          title: 'Lecture Published!',
          message: res.message
        });

        // Sync with Firestore if active
        firestoreService.syncLectureMedia(res.lecture).catch(() => {});

        onSuccess(res.lecture);
        onClose();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to upload lecture media.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Upload Study Lecture / Media</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Admin Privilege</span>
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Uploaded by Admin: <strong className="text-blue-300">{user?.name}</strong> • {user?.instituteName || 'Institute'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Quick Preset Selector */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Fill with sample academic lecture preset:</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleApplyPreset(samplePresets[0])}
                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
              >
                Sample Video
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(samplePresets[1])}
                className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
              >
                Sample Infographic
              </button>
            </div>
          </div>

          {/* Media Type & Visibility Scope (CRITICAL REQUIREMENTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Media Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. Media Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all font-semibold text-xs ${
                    mediaType === 'video'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Lecture Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('picture')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all font-semibold text-xs ${
                    mediaType === 'picture'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Study Picture</span>
                </button>
              </div>
            </div>

            {/* Visibility Option (PRIVATE vs GLOBAL - CRITICAL REQUIREMENT) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Visibility Access:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all text-xs ${
                    visibility === 'private'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Shown only to students, users, admins and staff of this institute"
                >
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private</span>
                  </div>
                  <span className="text-[10px] opacity-75">Institute Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('global')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all text-xs ${
                    visibility === 'global'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Shown to everyone all over the platform"
                >
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Global</span>
                  </div>
                  <span className="text-[10px] opacity-75">Everyone, All Over</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visibility Info Callout */}
          <div className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
            visibility === 'private'
              ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
          }`}>
            {visibility === 'private' ? (
              <>
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Private Access:</strong> Only students, teachers, and admins belonging to <strong>{user?.instituteName || 'your institute'}</strong> can view, react to, and comment on this lecture.
                </span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Global Access:</strong> Published to all students and educators across every institute globally on Dot X Library.
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">
              Lecture Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Asymptotic Complexity & Dynamic Programming Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Academic Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Chapter / Topic (Minor Info)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Binary Trees & Heaps"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Media URL / Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
              <span>{mediaType === 'video' ? 'Video Source URL or File' : 'Study Picture URL or File'} *</span>
              <span className="text-[10px] text-slate-400 font-normal">Supports MP4, WebM, Direct Link, or Image Upload</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={mediaType === 'video' ? 'Enter video URL (e.g. https://.../lecture.mp4)' : 'Enter picture URL (e.g. https://.../diagram.jpg)'}
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  setFilePreview(e.target.value);
                  if (mediaType === 'picture') setThumbnailUrl(e.target.value);
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />

              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer flex items-center space-x-1.5 text-xs font-medium transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Thumbnail URL for videos */}
            {mediaType === 'video' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Video Thumbnail Poster URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... (optional cover poster image)"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}

            {/* Media Preview Box */}
            {filePreview && (
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 mt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Media Preview</span>
                </div>
                {mediaType === 'video' ? (
                  <video
                    src={filePreview}
                    controls
                    className="w-full max-h-48 rounded-lg bg-black object-contain"
                  />
                ) : (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full max-h-48 rounded-lg bg-black object-contain"
                  />
                )}
              </div>
            )}
          </div>

          {/* Description (Required) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">
              Study Description & Learning Objectives *
            </label>
            <textarea
              rows={3}
              placeholder="Provide a comprehensive academic breakdown, key concepts covered, formulas, and guidance for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Minor Information: Course Level, Duration, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Course Level
              </label>
              <select
                value={courseLevel}
                onChange={(e) => setCourseLevel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Beginner">Beginner / Freshman</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Advanced">Advanced / Master</option>
                <option value="High School">High School / Prep</option>
                <option value="Research">Academic Research</option>
              </select>
            </div>

            {mediaType === 'video' ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="600"
                    placeholder="e.g. 45"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Media Classification
                </label>
                <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 text-xs flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Diagram / Infographic</span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Study Tags (comma separated)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Algorithms, Midterm, Notes"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Admin Attributing Info Note */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              This study lecture will display: <strong>Uploaded by Admin: {user?.name} ({user?.role})</strong> from <strong>{user?.instituteName || 'Institute'}</strong>.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  <span>Publishing Lecture...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish Lecture to Students</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

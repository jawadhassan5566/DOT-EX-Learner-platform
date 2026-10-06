import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Link,
  Sparkles,
  RotateCcw,
  Check,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

export interface ProfileAvatarEditorProps {
  currentAvatar: string;
  onChange: (avatarUrl: string) => void;
  userName?: string;
}

// Curated high quality avatars suitable for academic & student profiles
export const PRESET_AVATARS = [
  {
    category: 'Scholars & Students',
    items: [
      { id: 'scholar-1', label: 'Tech Student', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-2', label: 'Engineering', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-3', label: 'Medical Research', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-4', label: 'Computer Science', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-5', label: 'Data Science', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-6', label: 'Social Sciences', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-7', label: 'Physics Scholar', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80' },
      { id: 'scholar-8', label: 'Literature & Arts', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80' },
    ]
  },
  {
    category: '3D & Illustrated Characters',
    items: [
      { id: 'notion-1', label: 'Scholar Felix', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix' },
      { id: 'notion-2', label: 'Scholar Aria', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aria' },
      { id: 'notion-3', label: 'Scholar Oliver', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver' },
      { id: 'notion-4', label: 'Scholar Luna', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Luna' },
      { id: 'bot-1', label: 'AI Cyber Scholar', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DotXScholar' },
      { id: 'adv-1', label: 'Explorer Aneka', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
      { id: 'adv-2', label: 'Explorer Brian', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Brian' },
      { id: 'mic-1', label: 'Creative Harper', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Harper' },
    ]
  }
];

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80';

/**
 * Resizes and compresses image on client-side to prevent network overhead
 */
function compressImageToDataUrl(file: File, maxSize: number = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read selected file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file format'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Make square crop centered
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        const targetDim = Math.min(minDim, maxSize);
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileAvatarEditor: React.FC<ProfileAvatarEditorProps> = ({
  currentAvatar,
  onChange,
  userName = 'Student'
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size is too large (maximum 8MB)');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 320);
      onChange(compressedDataUrl);
      setImageLoadError(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter an image URL');
      return;
    }

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://') && !urlInput.startsWith('data:image/')) {
      setUrlError('URL must start with https:// or http://');
      return;
    }

    setUrlError('');
    setImageLoadError(false);
    onChange(urlInput.trim());
  };

  const handleGenerateRandom = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const styles = ['notionists', 'adventurer', 'bottts', 'micah', 'lorelei'];
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    const generatedUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${randomSeed}`;
    setImageLoadError(false);
    onChange(generatedUrl);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-white">Change Profile Picture</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerateRandom}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
          title="Generate a unique avatar"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Randomize Avatar</span>
        </button>
      </div>

      {/* Main Avatar Preview & Control Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
        <div className="relative group">
          <img
            src={currentAvatar}
            alt={userName}
            onError={() => setImageLoadError(true)}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md bg-slate-800"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-semibold"
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span>Upload</span>
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <span className="text-xs font-bold text-slate-200">Current Selected Picture</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/20">
              Live Preview
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Choose from gallery presets, upload an image from your device, or paste a web URL.
          </p>
          {imageLoadError && (
            <p className="text-[11px] text-rose-400 flex items-center justify-center sm:justify-start space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Could not load image at that address. Fallback in place.</span>
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              onChange(DEFAULT_AVATAR);
              setImageLoadError(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 border border-slate-700 transition-colors"
            title="Reset to default portrait"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Default</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'presets'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Preset Avatars</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload From Device</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>Image Web URL</span>
        </button>
      </div>

      {/* Tab 1: Presets Gallery */}
      {activeTab === 'presets' && (
        <div className="space-y-4 pt-1">
          {PRESET_AVATARS.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {cat.category}
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {cat.items.map((preset) => {
                  const isSelected = currentAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onChange(preset.url);
                        setImageLoadError(false);
                      }}
                      className={`relative group rounded-xl p-1 transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-blue-500 bg-blue-500/20 scale-105'
                          : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-950"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Upload From Device */}
      {activeTab === 'upload' && (
        <div className="space-y-3 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all space-y-2"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Click or tap to upload a photo</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports JPG, PNG, WebP or GIF up to 8MB. Automatically cropped to portrait format.
              </p>
            </div>
            <button
              type="button"
              disabled={uploadLoading}
              className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              {uploadLoading ? 'Processing Image...' : 'Choose File From Device'}
            </button>
          </div>

          {uploadError && (
            <p className="text-xs text-rose-400 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Direct Web Image URL */}
      {activeTab === 'url' && (
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-medium text-slate-300">
            Paste Direct Image URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError('');
              }}
              placeholder="https://example.com/avatar.jpg"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              Apply Photo URL
            </button>
          </div>

          {urlError && (
            <p className="text-xs text-rose-400 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </p>
          )}

          <p className="text-[11px] text-slate-400">
            Tip: You can use links from Unsplash, Gravatar, GitHub, or any public image URL.
          </p>
        </div>
      )}
    </div>
  );
};

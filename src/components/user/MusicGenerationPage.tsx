import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  Clock,
  Disc,
  Sliders,
  History,
  Info,
  Flame,
  Radio,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService, FirestoreGeneratedMusic } from '../../services/firestoreService.js';

interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  mode: 'clip' | 'pro';
  audioUrl: string;
  duration: string;
  lyrics?: string;
  createdAt: string;
}

export const MusicGenerationPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'clip' | 'pro'>('clip');
  const [selectedPresetGenre, setSelectedPresetGenre] = useState('Lo-Fi Focus');
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recentTracks, setRecentTracks] = useState<MusicTrack[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const studyPresets = [
    {
      name: 'Lo-Fi Focus',
      description: 'Chilled beats, warm Rhodes piano, gentle vinyl crackle (80 BPM)',
      prompt: 'Lo-Fi chillhop study beat with warm Fender Rhodes chords, soft drum breaks, vinyl surface noise, and ambient library undertones.',
      mode: 'clip' as const
    },
    {
      name: 'Cinematic Orchestral',
      description: 'Soaring strings and cellos for deep cognitive immersion',
      prompt: 'Dramatic cinematic orchestral soundtrack with emotional cello solo, gentle harp arpeggios, and sweeping brass crescendo for deep focus.',
      mode: 'pro' as const
    },
    {
      name: 'Ambient Synthwave',
      description: 'Dreamy analog synthesizers and lush celestial pads',
      prompt: 'Retro ambient synthwave study music with lush polyphonic synthesizer pads, soft pulse bassline, and celestial reverb.',
      mode: 'clip' as const
    },
    {
      name: 'Classical Baroque Study',
      description: 'Bach-inspired counterpoint harpsichord and violin duo',
      prompt: 'Academic classical chamber ensemble with intricate violin counterpoint, gentle cello basso continuo, and scholarly baroque phrasing.',
      mode: 'pro' as const
    },
    {
      name: 'Binaural Alpha Waves',
      description: 'Calm ambient drones engineered for concentration',
      prompt: 'Deep meditation ambient soundscape with soothing 10Hz alpha wave frequencies, warm brown noise, and meditative acoustic textures.',
      mode: 'clip' as const
    }
  ];

  // Load saved music from Firestore on mount
  useEffect(() => {
    async function loadSavedMusic() {
      if (!user?.id) return;
      setHistoryLoading(true);
      try {
        const saved = await firestoreService.getUserGeneratedMusic(user.id);
        if (saved && saved.length > 0) {
          const mapped: MusicTrack[] = saved.map((s, idx) => ({
            id: s.id || `track_${idx}`,
            title: s.prompt.slice(0, 45) + (s.prompt.length > 45 ? '...' : ''),
            genre: s.mode === 'pro' ? 'Full-Length Symphony' : '30s Focus Clip',
            model: (s.modelUsed as any) || (s.mode === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'),
            mode: s.mode,
            audioUrl: s.audioBase64
              ? `data:${s.mimeType || 'audio/wav'};base64,${s.audioBase64}`
              : '',
            duration: s.mode === 'pro' ? 'Full Track' : '30s',
            lyrics: s.lyrics,
            createdAt: s.createdAt ? new Date().toLocaleDateString() : 'Recent'
          }));
          setRecentTracks(mapped);
          if (mapped[0]?.audioUrl) {
            setCurrentTrack(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Error fetching saved music:', err);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadSavedMusic();
  }, [user?.id]);

  const handleGenerateMusic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPrompt = prompt.trim();
    if (!finalPrompt || loading) return;

    setLoading(true);
    try {
      const res = await api.generateMusic({
        prompt: finalPrompt,
        mode,
        durationSeconds: mode === 'clip' ? 30 : 90
      });

      if (res.success && res.audioBase64) {
        const audioUrl = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
        const newTrack: MusicTrack = {
          id: 'track_' + Date.now(),
          title: finalPrompt.slice(0, 40) + (finalPrompt.length > 40 ? '...' : ''),
          genre: selectedPresetGenre,
          model: res.modelUsed as any,
          mode: res.mode as any,
          audioUrl,
          duration: res.mode === 'pro' ? 'Full Track' : '30s',
          lyrics: res.lyrics,
          createdAt: 'Just now'
        };

        setCurrentTrack(newTrack);
        setRecentTracks(prev => [newTrack, ...prev]);

        addToast({
          type: 'success',
          title: `Music Generated (${res.modelUsed})`,
          message: res.fallbackGenerated
            ? 'Harmonic study tone generated and ready to stream.'
            : 'Track synthesized from Lyria streaming audio!'
        });

        // Persist track to Firestore
        if (user?.id) {
          firestoreService.saveGeneratedMusic({
            userId: user.id,
            prompt: finalPrompt,
            mode: res.mode as any,
            modelUsed: res.modelUsed,
            audioBase64: res.audioBase64,
            mimeType: res.mimeType || 'audio/wav',
            lyrics: res.lyrics
          }).catch(() => {});
        }

        // Auto-play newly generated track
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }, 300);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Could not generate music.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof studyPresets[0]) => {
    setSelectedPresetGenre(preset.name);
    setPrompt(preset.prompt);
    setMode(preset.mode);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Lyria Music Engine • lyria-3-clip-preview & lyria-3-pro-preview</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Academic Focus & Study Music Generation
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
            Generate custom acoustic soundscapes, binaural study tones, orchestral themes, and lo-fi focus beats tailored for deep reading, study sessions, and university lectures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generator Form & Mode Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Generate Study Track</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMode('clip')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'clip'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Short Clip (30s)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pro')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'pro'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Full-Length Track
                </button>
              </div>
            </div>

            {/* Model Badge */}
            <div className="flex items-center space-x-2 text-xs bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                Using model: <strong className="text-white font-mono">{mode === 'clip' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview'}</strong>
                {mode === 'clip' ? ' (Optimized for rapid 30s concentration clips)' : ' (Full-length immersive symphonic progression)'}
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Curated Academic Focus Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {studyPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedPresetGenre === p.name
                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-purple-300">{p.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{p.mode}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <form onSubmit={handleGenerateMusic} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Music Description / Instruments / Tempo:
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 80 BPM calm Lo-Fi piano study beat with light rain sound effects and acoustic guitar..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Encoded WAV playback • Instant streaming synthesis
                </span>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Synthesizing with Lyria...' : `Generate ${mode === 'clip' ? '30s Clip' : 'Full Track'}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Playing Audio Deck */}
          {currentTrack && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/60 border border-purple-800/40 p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className={`w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 relative ${isPlaying ? 'animate-pulse' : ''}`}>
                    <Disc className={`w-7 h-7 ${isPlaying ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                      {currentTrack.model} • {currentTrack.duration}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentTrack.genre}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 transition-transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {currentTrack.audioUrl && (
                    <a
                      href={currentTrack.audioUrl}
                      download={`dotx_study_${Date.now()}.wav`}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Download Track (.wav)"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {currentTrack.lyrics && (
                <div className="mt-4 pt-3 border-t border-purple-800/30 text-xs text-purple-200/90 whitespace-pre-wrap font-mono bg-purple-950/30 p-3 rounded-xl">
                  {currentTrack.lyrics}
                </div>
              )}

              {/* Hidden audio element for browser playback */}
              <audio
                ref={audioRef}
                src={currentTrack.audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Track History & Information */}
        <div className="space-y-6">
          {/* Track History */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Recent Generations</h3>
              </div>
              <span className="text-xs text-slate-400">
                {recentTracks.length} Saved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {recentTracks.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {historyLoading ? 'Loading tracks...' : 'No tracks generated yet. Pick a preset or enter a prompt above!'}
                </div>
              ) : (
                recentTracks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTrack(t);
                      setTimeout(() => {
                        if (audioRef.current) {
                          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                        }
                      }, 200);
                    }}
                    className={`cursor-pointer p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      currentTrack?.id === t.id
                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-white truncate">{t.title}</div>
                      <div className="text-[10px] text-purple-400 font-mono mt-0.5">{t.model} • {t.duration}</div>
                    </div>
                    <button
                      className="p-1.5 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
                      title="Play"
                    >
                      <Play className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Model Capabilities Info Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Lyria Architecture</span>
            </div>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Google Lyria models synthesize coherent, high-fidelity polyphonic music streams from textual semantics:
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">lyria-3-clip-preview:</strong> Low latency, focused 30-second loops ideal for focus timers and quick study background.</li>
              <li><strong className="text-white">lyria-3-pro-preview:</strong> High-definition full-length symphonies with multi-movement transitions and dynamic arrangement.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

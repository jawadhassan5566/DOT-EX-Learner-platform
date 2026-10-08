import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  Disc,
  Sliders,
  History,
  Info,
  Piano,
  AudioWaveform,
  Waves,
  Layers,
  RefreshCw,
  Square
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import {
  LETTER_NOTES,
  DIGIT_NOTES,
  getCharacterNote,
  getWordMelody,
  getComposition,
  playSingleLetterNote,
  playWordMelody,
  playTextComposition,
  stopCurrentMelody,
  generateCompositionWavBase64,
  NoteInfo,
  WordMelody
} from '../../services/melodyService.js';

interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | 'dotx-melodic-synthesizer';
  mode: 'clip' | 'pro';
  audioUrl: string;
  duration: string;
  lyrics?: string;
  createdAt: string;
}

export const MusicGenerationPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [prompt, setPrompt] = useState('Dot X Learner Study Focus');
  const [mode, setMode] = useState<'clip' | 'pro'>('clip');
  const [selectedPresetGenre, setSelectedPresetGenre] = useState('Lo-Fi Focus');
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recentTracks, setRecentTracks] = useState<MusicTrack[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Melodic synthesis states
  const [activeTab, setActiveTab] = useState<'melodic-engine' | 'letter-matrix' | 'presets'>('melodic-engine');
  const [soundOnType, setSoundOnType] = useState<boolean>(true);
  const [isMelodyPlaying, setIsMelodyPlaying] = useState(false);
  const [activePlayingWord, setActivePlayingWord] = useState<string | null>(null);
  const [activePlayingWordIdx, setActivePlayingWordIdx] = useState<number | null>(null);
  const [activePlayingLetter, setActivePlayingLetter] = useState<string | null>(null);
  const [lastPlayedLetterInfo, setLastPlayedLetterInfo] = useState<{ letter: string; note: string; freq: number; desc?: string } | null>(null);

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

  // Quick word test suggestions
  const sampleWords = [
    'LEARN',
    'STUDY',
    'HARMONY',
    'DOT X',
    'KNOWLEDGE',
    'FOCUS',
    'CREATIVITY',
    'SERENITY'
  ];

  // Derive composition breakdown from current prompt
  const composition = useMemo(() => {
    return getComposition(prompt.trim() || 'DOT X LEARNER');
  }, [prompt]);

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

    return () => {
      stopCurrentMelody();
    };
  }, [user?.id]);

  // Handle typing inside prompt text area
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const prevVal = prompt;
    setPrompt(val);

    // If typing a character, play its unique sound
    if (soundOnType && val.length > prevVal.length) {
      const addedChar = val.charAt(val.length - 1);
      if (addedChar.trim()) {
        const noteInfo = getCharacterNote(addedChar);
        playSingleLetterNote(addedChar, 0.6);
        setLastPlayedLetterInfo({
          letter: noteInfo.letter,
          note: noteInfo.note,
          freq: noteInfo.freq,
          desc: LETTER_NOTES[noteInfo.letter]?.description
        });
      }
    }
  };

  // Play a single letter note from matrix
  const handlePlayLetter = (letter: string) => {
    playSingleLetterNote(letter, 0.7);
    const info = getCharacterNote(letter);
    setLastPlayedLetterInfo({
      letter: info.letter,
      note: info.note,
      freq: info.freq,
      desc: LETTER_NOTES[info.letter]?.description
    });
  };

  // Play a specific word's unique melody
  const handlePlayWord = (word: string) => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setActivePlayingWord(word);
    setIsMelodyPlaying(true);
    playWordMelody(word, (note) => {
      setActivePlayingLetter(note.letter);
    });
    // Reset status after word melody duration
    const melody = getWordMelody(word);
    setTimeout(() => {
      setActivePlayingWord(null);
      setActivePlayingLetter(null);
      setIsMelodyPlaying(false);
    }, (melody.durationSeconds + 0.3) * 1000);
  };

  // Play the full combined melody of all words typed together
  const handlePlayCombinedMelody = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    const textToPlay = prompt.trim() || 'DOT X LEARNER';
    setIsMelodyPlaying(true);
    playTextComposition(
      textToPlay,
      (word, idx) => {
        setActivePlayingWord(word);
        setActivePlayingWordIdx(idx);
      },
      (note) => {
        setActivePlayingLetter(note.letter);
      },
      () => {
        setIsMelodyPlaying(false);
        setActivePlayingWord(null);
        setActivePlayingWordIdx(null);
        setActivePlayingLetter(null);
        addToast({
          type: 'success',
          title: 'Melody Complete',
          message: 'Finished playing multi-word harmonic composition!'
        });
      }
    );
  };

  const handleStopMelody = () => {
    stopCurrentMelody();
    setIsMelodyPlaying(false);
    setActivePlayingWord(null);
    setActivePlayingWordIdx(null);
    setActivePlayingLetter(null);
  };

  // Immediate synthesis to Audio Deck using Web Audio WAV generation
  const handleRenderToAudioDeck = () => {
    const text = prompt.trim() || 'Dot X Learner';
    try {
      const { audioBase64, durationSeconds, composition: comp } = generateCompositionWavBase64(text, mode === 'pro' ? 2.5 : 1.2);
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const chordsList = Array.from(new Set(comp.words.map(w => w.chordName))).join(', ');
      
      const newTrack: MusicTrack = {
        id: 'melodic_' + Date.now(),
        title: text.slice(0, 45) + (text.length > 45 ? '...' : ''),
        genre: `Harmonic: ${chordsList}`,
        model: 'dotx-melodic-synthesizer',
        mode,
        audioUrl,
        duration: `${Math.round(durationSeconds)}s`,
        lyrics: `[Multi-Word Acoustic Melody - Dot X Synthesizer]\nText: "${text}"\nChords: ${chordsList}\nTotal Unique Notes: ${comp.totalNotes} notes`,
        createdAt: 'Just now'
      };

      setCurrentTrack(newTrack);
      setRecentTracks(prev => [newTrack, ...prev]);

      // Save to Firestore
      if (user?.id) {
        firestoreService.saveGeneratedMusic({
          userId: user.id,
          prompt: text,
          mode,
          modelUsed: 'dotx-melodic-synthesizer',
          audioBase64,
          mimeType: 'audio/wav',
          lyrics: newTrack.lyrics
        }).catch(() => {});
      }

      addToast({
        type: 'success',
        title: 'Melody Synthesized!',
        message: `Generated custom ${Math.round(durationSeconds)}s track with distinct word harmonies!`
      });

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 300);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Synthesis Error',
        message: err.message || 'Could not synthesize melody'
      });
    }
  };

  // Server generation via Lyria API
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
            ? 'Word-by-word melodic harmonics synthesized and ready to play!'
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
    <div className="space-y-6 pb-14 text-slate-100">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Dot X Melodic Engine • Every Letter & Word Has Its Own Unique Musical Sound</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Melodic & Academic Focus Music Studio
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
            Type any word or sentence to hear each letter play its own distinct pitch. When multiple words are typed together, they combine into a rich, pleasant multi-part melody with chords, bass, and rhythmic harmony tailored for deep study.
          </p>
        </div>
      </div>

      {/* Mode / Feature Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('melodic-engine')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'melodic-engine'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <AudioWaveform className="w-4 h-4 text-purple-300" />
          <span>Letter & Word Melodic Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('letter-matrix')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'letter-matrix'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Piano className="w-4 h-4 text-purple-300" />
          <span>Interactive Letter Matrix (A-Z)</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'presets'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-300" />
          <span>Curated Lyria AI Presets</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tab 1: Melodic Synthesis Engine */}
          {activeTab === 'melodic-engine' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Waves className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Type Words To Compose Melodies</h2>
                    <p className="text-xs text-slate-400">Each letter has its own pitch; words harmonize into a pleasant tune</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSoundOnType(!soundOnType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                      soundOnType
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title="Toggle real-time note sound when typing letters"
                  >
                    {soundOnType ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Sound on Typing: {soundOnType ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Quick sample words */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Try sample words with distinct tunes:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {sampleWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setPrompt(word);
                        handlePlayWord(word);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-200 text-xs font-mono font-medium border border-slate-700/60 hover:border-purple-500/40 transition-all flex items-center space-x-1"
                    >
                      <Play className="w-2.5 h-2.5 text-purple-400" />
                      <span>{word}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Type words, phrases, or academic topics:
                  </label>
                  {lastPlayedLetterInfo && (
                    <span className="text-[11px] text-purple-300 font-mono bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 animate-fade-in">
                      Last note: {lastPlayedLetterInfo.letter} = {lastPlayedLetterInfo.note} ({Math.round(lastPlayedLetterInfo.freq)} Hz)
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="e.g. Artificial Intelligence and Cognitive Harmony..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-sans"
                />
              </div>

              {/* Melodic Playback Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  {isMelodyPlaying ? (
                    <button
                      type="button"
                      onClick={handleStopMelody}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Melody</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePlayCombinedMelody}
                      disabled={!prompt.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play Combined Melody</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRenderToAudioDeck}
                    disabled={!prompt.trim()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-purple-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
                    title="Render entire melody to downloadable WAV"
                  >
                    <Disc className="w-4 h-4 text-purple-400" />
                    <span>Render into Audio Deck</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleGenerateMusic}
                    disabled={loading || !prompt.trim()}
                    className="px-4 py-2.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 disabled:opacity-40 text-purple-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{loading ? 'Synthesizing...' : 'Lyria AI Engine'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Word-by-Word Melody Breakdown */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-white">Word-by-Word Melodic Breakdown</span>
                  </div>
                  <span>{composition.words.length} words • {composition.totalNotes} notes total</span>
                </div>

                {composition.words.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Type any words above to see and hear their individual melodic signatures.</p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {composition.words.map((wm, wIdx) => {
                      const isWordActive = activePlayingWord === wm.word || activePlayingWordIdx === wIdx;
                      return (
                        <div
                          key={wIdx}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isWordActive
                              ? 'bg-purple-900/30 border-purple-500 text-white shadow-md shadow-purple-600/20'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-white tracking-wide">{wm.word}</span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300">
                                Chord: {wm.chordName}
                              </span>
                            </div>

                            {/* Letter note badges */}
                            <div className="flex flex-wrap gap-1">
                              {wm.notes.map((n, nIdx) => {
                                const isNoteActive = isWordActive && activePlayingLetter === n.letter;
                                return (
                                  <span
                                    key={nIdx}
                                    style={{ borderColor: n.color }}
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                                      isNoteActive
                                        ? 'bg-purple-500 text-white font-bold scale-110 shadow'
                                        : 'bg-slate-950 text-slate-300'
                                    }`}
                                  >
                                    {n.letter}: {n.note}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePlayWord(wm.word)}
                            className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold border border-purple-500/40 transition-colors flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Play Word</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Tab 2: Interactive Letter Sound Matrix (A to Z) */}
          {activeTab === 'letter-matrix' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Piano className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Musical Note Matrix (A to Z)</h2>
                    <p className="text-xs text-slate-400">Click any letter to hear its distinct note and frequency</p>
                  </div>
                </div>
              </div>

              {/* A-Z Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                {Object.entries(LETTER_NOTES).map(([letter, def]) => {
                  const isActive = activePlayingLetter === letter || lastPlayedLetterInfo?.letter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handlePlayLetter(letter)}
                      style={{
                        borderColor: isActive ? def.color : 'rgba(51, 65, 85, 0.4)',
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all hover:scale-105 active:scale-95 ${
                        isActive
                          ? 'bg-purple-600/30 text-white shadow-lg'
                          : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{letter}</span>
                        <span
                          style={{ backgroundColor: def.color }}
                          className="w-2.5 h-2.5 rounded-full"
                        />
                      </div>
                      <div className="mt-1 text-xs font-mono font-bold text-purple-300">{def.note}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{Math.round(def.freq)} Hz</div>
                    </button>
                  );
                })}
              </div>

              {/* Numbers 0-9 */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Supportive Harmonic Digits (0 - 9):</span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Object.entries(DIGIT_NOTES).map(([digit, def]) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePlayLetter(digit)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center hover:bg-slate-800 transition-all text-xs"
                    >
                      <div className="font-bold text-white">{digit}</div>
                      <div className="text-[10px] text-purple-400 font-mono">{def.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {lastPlayedLetterInfo && (
                <div className="rounded-xl bg-purple-950/30 border border-purple-800/40 p-3 text-xs text-purple-200">
                  <span className="font-bold text-white">Active Note:</span> Letter <strong className="text-purple-300">{lastPlayedLetterInfo.letter}</strong> sounds at frequency <strong>{lastPlayedLetterInfo.freq} Hz ({lastPlayedLetterInfo.note})</strong>
                  {lastPlayedLetterInfo.desc && <span> — {lastPlayedLetterInfo.desc}</span>}
                </div>
              )}
            </div>
          )}

          {/* Active Tab 3: Presets & Lyria Settings */}
          {activeTab === 'presets' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">Curated Focus Presets</h2>
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
                    Full Symphony
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studyPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
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

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">Loads selected preset into prompt for immediate synthesis</span>
                <button
                  type="button"
                  onClick={handleGenerateMusic}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow transition-all"
                >
                  {loading ? 'Synthesizing...' : 'Synthesize Preset Track'}
                </button>
              </div>
            </div>
          )}

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
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
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

              {/* Audio element for browser playback */}
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

        {/* Right Column: Track History & Info */}
        <div className="space-y-6">
          {/* Track History */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Saved Music History</h3>
              </div>
              <span className="text-xs text-slate-400">
                {recentTracks.length} Saved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentTracks.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {historyLoading ? 'Loading tracks...' : 'No tracks generated yet. Type words above to compose!'}
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
                      <Play className="w-3 h-3 ml-0.5 fill-current" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* How Letter & Word Melodies Work */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>How Melodic Synthesis Works</span>
            </div>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Every typed character is mapped to an acoustic musical note with its own overtone spectrum:
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Unique Letter Notes:</strong> A is C4 (261Hz), B is D4 (293Hz), C is E4 (329Hz)... each letter has a distinct frequency.</li>
              <li><strong className="text-white">Word Chords:</strong> Each word calculates an acoustic harmonic root triad (C Maj9, D min7, F Maj7, etc.) giving each word its signature feel.</li>
              <li><strong className="text-white">Multi-Word Fusion:</strong> Sentences weave the words into a melodic progression accompanied by ambient pads and acoustic bass.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

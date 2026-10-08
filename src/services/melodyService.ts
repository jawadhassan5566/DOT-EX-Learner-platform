/**
 * Dot X Learner Platform - AI Melodic Synthesis Engine
 * Maps every single letter and word to its own distinct musical note and harmonic structure.
 * Synthesizes unique, pleasant, multi-track melodies for any typed text.
 */

export interface NoteInfo {
  letter: string;
  note: string;
  freq: number;
  octave: number;
  color: string;
  duration: number; // in beats / seconds
}

export interface WordMelody {
  word: string;
  notes: NoteInfo[];
  chordRootFreq: number;
  chordName: string;
  durationSeconds: number;
}

export interface Composition {
  text: string;
  words: WordMelody[];
  totalNotes: number;
  key: string;
  tempoBPM: number;
  totalDurationSeconds: number;
}

// 26 Unique Notes for A to Z across musical octaves (3, 4, 5, 6)
// Every single letter has a distinct frequency and musical pitch!
export const LETTER_NOTES: Record<string, { note: string; freq: number; octave: number; color: string; description: string }> = {
  A: { note: 'C4',  freq: 261.63, octave: 4, color: '#3B82F6', description: 'Middle C - Grounded & Pure' },
  B: { note: 'D4',  freq: 293.66, octave: 4, color: '#6366F1', description: 'D Natural - Uplifting Warmth' },
  C: { note: 'E4',  freq: 329.63, octave: 4, color: '#8B5CF6', description: 'E Natural - Radiant & Bright' },
  D: { note: 'F4',  freq: 349.23, octave: 4, color: '#A855F7', description: 'F Natural - Soft & Contemplative' },
  E: { note: 'G4',  freq: 392.00, octave: 4, color: '#EC4899', description: 'G Natural - Resonant Harmony' },
  F: { note: 'A4',  freq: 440.00, octave: 4, color: '#F43F5E', description: 'Concert A - Pure Reference Tone' },
  G: { note: 'B4',  freq: 493.88, octave: 4, color: '#EF4444', description: 'B Natural - Soaring Vibrance' },
  H: { note: 'C5',  freq: 523.25, octave: 5, color: '#F97316', description: 'High C - Crisp & Sparkling' },
  I: { note: 'D5',  freq: 587.33, octave: 5, color: '#F59E0B', description: 'High D - Clear & Inspiring' },
  J: { note: 'E5',  freq: 659.25, octave: 5, color: '#EAB308', description: 'High E - Luminous Bell' },
  K: { note: 'F5',  freq: 698.46, octave: 5, color: '#84CC16', description: 'High F - Expressive Flow' },
  L: { note: 'G5',  freq: 783.99, octave: 5, color: '#22C55E', description: 'High G - Shimmering Celesta' },
  M: { note: 'A5',  freq: 880.00, octave: 5, color: '#10B981', description: 'Upper A - Glinting Chime' },
  N: { note: 'B5',  freq: 987.77, octave: 5, color: '#14B8A6', description: 'Upper B - Crystalline Bell' },
  O: { note: 'C6',  freq: 1046.50, octave: 6, color: '#06B6D4', description: 'Peak C - Heavenly Sparkle' },
  P: { note: 'D6',  freq: 1174.66, octave: 6, color: '#0EA5E9', description: 'Peak D - Silver Flute' },
  Q: { note: 'E6',  freq: 1318.51, octave: 6, color: '#38BDF8', description: 'Peak E - Celestial Harp' },
  R: { note: 'A3',  freq: 220.00, octave: 3, color: '#2563EB', description: 'Deep A - Warm Cello Bass' },
  S: { note: 'B3',  freq: 246.94, octave: 3, color: '#4F46E5', description: 'Deep B - Rich Acoustic Foundation' },
  T: { note: 'D3',  freq: 146.83, octave: 3, color: '#7C3AED', description: 'Low D - Resonant Contrabass' },
  U: { note: 'E3',  freq: 164.81, octave: 3, color: '#9333EA', description: 'Low E - Deep Oceanic Pulse' },
  V: { note: 'G3',  freq: 196.00, octave: 3, color: '#C026D3', description: 'Low G - Earthy Anchor' },
  W: { note: 'F#4', freq: 369.99, octave: 4, color: '#DB2777', description: 'F Sharp - Mystical Lydian' },
  X: { note: 'G#4', freq: 415.30, octave: 4, color: '#E11D48', description: 'G Sharp - Romantic Minor Third' },
  Y: { note: 'C#5', freq: 554.37, octave: 5, color: '#D97706', description: 'C Sharp - Bright Radiant Lift' },
  Z: { note: 'F#5', freq: 739.99, octave: 5, color: '#059669', description: 'High F# - Exotic Harmonic Overtone' },
};

// Digits 0 to 9 mapped to supportive melodic bass & mid harmonics
export const DIGIT_NOTES: Record<string, { note: string; freq: number; octave: number; color: string }> = {
  '0': { note: 'C3', freq: 130.81, octave: 3, color: '#64748B' },
  '1': { note: 'D3', freq: 146.83, octave: 3, color: '#64748B' },
  '2': { note: 'E3', freq: 164.81, octave: 3, color: '#64748B' },
  '3': { note: 'G3', freq: 196.00, octave: 3, color: '#64748B' },
  '4': { note: 'A3', freq: 220.00, octave: 3, color: '#64748B' },
  '5': { note: 'C4', freq: 261.63, octave: 4, color: '#64748B' },
  '6': { note: 'D4', freq: 293.66, octave: 4, color: '#64748B' },
  '7': { note: 'E4', freq: 329.63, octave: 4, color: '#64748B' },
  '8': { note: 'G4', freq: 392.00, octave: 4, color: '#64748B' },
  '9': { note: 'A4', freq: 440.00, octave: 4, color: '#64748B' },
};

// Shared audio context singleton
let sharedAudioCtx: AudioContext | null = null;
let currentPlaybackTimers: number[] = [];

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Returns note info for any character (case-insensitive)
 */
export function getCharacterNote(char: string): NoteInfo {
  const upper = char.toUpperCase();
  if (LETTER_NOTES[upper]) {
    const def = LETTER_NOTES[upper];
    return {
      letter: upper,
      note: def.note,
      freq: def.freq,
      octave: def.octave,
      color: def.color,
      duration: isVowel(upper) ? 0.38 : 0.26
    };
  }
  if (DIGIT_NOTES[upper]) {
    const def = DIGIT_NOTES[upper];
    return {
      letter: upper,
      note: def.note,
      freq: def.freq,
      octave: def.octave,
      color: def.color,
      duration: 0.3
    };
  }
  // Fallback for special characters
  return {
    letter: char,
    note: 'G4',
    freq: 392.00,
    octave: 4,
    color: '#94A3B8',
    duration: 0.2
  };
}

function isVowel(ch: string): boolean {
  return ['A', 'E', 'I', 'O', 'U', 'Y'].includes(ch);
}

/**
 * Derives a musical harmony chord name and root frequency for a word
 */
export function getWordHarmonicRoot(word: string): { chordRootFreq: number; chordName: string } {
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return { chordRootFreq: 261.63, chordName: 'C Major' };

  let charSum = 0;
  for (let i = 0; i < clean.length; i++) {
    charSum += clean.charCodeAt(i);
  }

  // Harmonic chord palette (consonant and pleasant study modes)
  const harmonicRoots = [
    { freq: 261.63, name: 'C Maj9' },
    { freq: 293.66, name: 'D min7' },
    { freq: 329.63, name: 'E min7' },
    { freq: 349.23, name: 'F Maj7' },
    { freq: 392.00, name: 'G 9' },
    { freq: 440.00, name: 'A min9' },
    { freq: 196.00, name: 'G Maj' },
    { freq: 220.00, name: 'A min' },
  ];

  const selected = harmonicRoots[charSum % harmonicRoots.length];
  return { chordRootFreq: selected.freq, chordName: selected.name };
}

/**
 * Deconstructs a word into its unique melodic phrase
 */
export function getWordMelody(word: string): WordMelody {
  const chars = word.split('');
  const notes: NoteInfo[] = [];

  for (const c of chars) {
    if (c.trim()) {
      notes.push(getCharacterNote(c));
    }
  }

  const { chordRootFreq, chordName } = getWordHarmonicRoot(word);
  const totalNotesDuration = notes.reduce((acc, n) => acc + n.duration, 0);

  return {
    word,
    notes,
    chordRootFreq,
    chordName,
    durationSeconds: Math.max(0.8, totalNotesDuration + 0.3)
  };
}

/**
 * Builds a full musical composition from multiple words
 */
export function getComposition(text: string): Composition {
  const rawWords = text.trim().split(/\s+/).filter(w => w.length > 0);
  const words = rawWords.map(w => getWordMelody(w));

  const totalNotes = words.reduce((acc, w) => acc + w.notes.length, 0);
  const totalDurationSeconds = words.reduce((acc, w) => acc + w.durationSeconds, 0);

  return {
    text,
    words,
    totalNotes,
    key: words[0]?.chordName || 'C Major Pentatonic',
    tempoBPM: 92,
    totalDurationSeconds: Math.max(1.2, totalDurationSeconds)
  };
}

/**
 * Synthesizes a warm, organic musical note (fundamental + 2nd & 3rd harmonics + gentle reverb)
 * using Web Audio API in real time.
 */
export function playSingleLetterNote(letter: string, volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const info = getCharacterNote(letter);
    const now = ctx.currentTime;
    const dur = info.duration * 1.5;

    // Master Note Gain
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noteGain.connect(ctx.destination);

    // 1. Fundamental Oscillator (Warm sine / soft triangle)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(info.freq, now);
    // Subtle vibrato
    osc1.frequency.exponentialRampToValueAtTime(info.freq * 1.002, now + dur * 0.5);

    // 2. Harmonic Overtone 1 (Rich octave bell resonance)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(info.freq * 2, now);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.22, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.7);
    osc2.connect(gain2);
    gain2.connect(noteGain);

    // 3. Subtle Warmth (3rd harmonic)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(info.freq * 3, now);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.4);
    osc3.connect(gain3);
    gain3.connect(noteGain);

    osc1.connect(noteGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + dur);
    osc2.stop(now + dur);
    osc3.stop(now + dur);
  } catch (err) {
    console.warn('Real-time letter note synthesis error:', err);
  }
}

/**
 * Plays a single word's unique tune:
 * Arpeggiates the word's letters while playing a warm background harmonic pad
 */
export function playWordMelody(word: string, onNote?: (note: NoteInfo, idx: number) => void): void {
  stopCurrentMelody();
  const melody = getWordMelody(word);
  if (melody.notes.length === 0) return;

  const ctx = getAudioContext();
  const startTime = ctx.currentTime;

  // Warm background chord for the word
  playHarmonicPad(ctx, melody.chordRootFreq, melody.durationSeconds, 0.18);

  // Play each letter sequentially
  let currentDelay = 0;
  melody.notes.forEach((note, idx) => {
    const timer = window.setTimeout(() => {
      playSingleLetterNote(note.letter, 0.6);
      if (onNote) onNote(note, idx);
    }, currentDelay * 1000);

    currentPlaybackTimers.push(timer);
    currentDelay += note.duration;
  });
}

/**
 * Plays the full sentence/text combining all word melodies into a cohesive pleasant tune!
 */
export function playTextComposition(
  text: string,
  onWordChange?: (word: string, wordIdx: number) => void,
  onNoteChange?: (note: NoteInfo, noteIdx: number) => void,
  onComplete?: () => void
): void {
  stopCurrentMelody();
  const comp = getComposition(text);
  if (comp.words.length === 0) return;

  const ctx = getAudioContext();
  let accumulatedTime = 0;

  comp.words.forEach((wordMelody, wordIdx) => {
    // 1. Schedule word start & harmonic chord
    const wordTimer = window.setTimeout(() => {
      if (onWordChange) onWordChange(wordMelody.word, wordIdx);
      // Play warm harmonic pad chord and gentle root bass for this word
      playHarmonicPad(ctx, wordMelody.chordRootFreq, wordMelody.durationSeconds, 0.2);
      playAcousticBass(ctx, wordMelody.chordRootFreq * 0.5, wordMelody.durationSeconds, 0.25);
    }, accumulatedTime * 1000);

    currentPlaybackTimers.push(wordTimer);

    // 2. Schedule each letter note inside the word
    let letterDelay = 0;
    wordMelody.notes.forEach((note, noteIdx) => {
      const noteTimer = window.setTimeout(() => {
        playSingleLetterNote(note.letter, 0.65);
        if (onNoteChange) onNoteChange(note, noteIdx);
      }, (accumulatedTime + letterDelay) * 1000);

      currentPlaybackTimers.push(noteTimer);
      letterDelay += note.duration;
    });

    // Advance by the word's duration plus a breath pause
    accumulatedTime += wordMelody.durationSeconds + 0.15;
  });

  // Schedule completion callback
  const finishTimer = window.setTimeout(() => {
    if (onComplete) onComplete();
  }, (accumulatedTime + 0.5) * 1000);
  currentPlaybackTimers.push(finishTimer);
}

/**
 * Stop any active playback immediately
 */
export function stopCurrentMelody(): void {
  currentPlaybackTimers.forEach(id => clearTimeout(id));
  currentPlaybackTimers = [];
}

// Background Pad chord helper (Root + Major/Minor Third + Fifth)
function playHarmonicPad(ctx: AudioContext, rootFreq: number, duration: number, gainVal: number): void {
  try {
    const now = ctx.currentTime;
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.linearRampToValueAtTime(gainVal, now + 0.15);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    padGain.connect(ctx.destination);

    // Triad frequencies
    const freqs = [rootFreq, rootFreq * 1.25, rootFreq * 1.5]; // Root, 3rd, 5th
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(padGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (e) {
    // Audio context may be suspended
  }
}

// Acoustic Bass note helper
function playAcousticBass(ctx: AudioContext, bassFreq: number, duration: number, gainVal: number): void {
  try {
    const now = ctx.currentTime;
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(gainVal, now + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);
    bassGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bassFreq, now);
    osc.connect(bassGain);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    // Audio context may be suspended
  }
}

/**
 * Synthesizes a valid, downloadable 16-bit PCM WAV base64 buffer for any text
 * with distinct notes for every letter and harmonious chords for every word!
 */
export function generateCompositionWavBase64(text: string, durationSecondsMultiplier: number = 1.0): {
  audioBase64: string;
  durationSeconds: number;
  composition: Composition;
} {
  const comp = getComposition(text);
  const sampleRate = 22050;

  // Calculate total seconds
  const totalSeconds = Math.max(3.5, Math.min(60, comp.totalDurationSeconds * durationSecondsMultiplier));
  const numSamples = Math.floor(sampleRate * totalSeconds);
  const pcmBuffer = new Float32Array(numSamples);

  // Render each word into the float buffer
  let wordSampleOffset = 0;

  comp.words.forEach(wordMelody => {
    const wordSamplesCount = Math.floor(wordMelody.durationSeconds * sampleRate);

    // 1. Add background pad chords for this word
    const chordFreqs = [
      wordMelody.chordRootFreq,
      wordMelody.chordRootFreq * 1.25, // major 3rd
      wordMelody.chordRootFreq * 1.5   // perfect 5th
    ];

    for (let i = 0; i < wordSamplesCount && (wordSampleOffset + i) < numSamples; i++) {
      const t = i / sampleRate;
      const padEnvelope = Math.sin(Math.min(1, t / 0.2) * Math.PI / 2) * Math.exp(-t * 0.6);

      let chordVal = 0;
      for (const cf of chordFreqs) {
        chordVal += 0.08 * Math.sin(2 * Math.PI * cf * t);
      }
      // Add root bass note
      const bassVal = 0.12 * Math.sin(2 * Math.PI * (wordMelody.chordRootFreq * 0.5) * t);

      pcmBuffer[wordSampleOffset + i] += (chordVal + bassVal) * padEnvelope;
    }

    // 2. Add each letter's unique note inside the word
    let letterSampleOffset = wordSampleOffset;
    wordMelody.notes.forEach(note => {
      const noteSamples = Math.floor(note.duration * 1.4 * sampleRate);

      for (let j = 0; j < noteSamples && (letterSampleOffset + j) < numSamples; j++) {
        const t = j / sampleRate;
        const attack = Math.min(1, t / 0.015);
        const decay = Math.exp(-t * (isVowel(note.letter) ? 2.5 : 4.0));
        const envelope = attack * decay;

        // Rich harmonics for a pleasant Rhodes/Kalimba tone
        const fundamental = Math.sin(2 * Math.PI * note.freq * t);
        const harmonic2 = 0.35 * Math.sin(4 * Math.PI * note.freq * t);
        const harmonic3 = 0.15 * Math.sin(6 * Math.PI * note.freq * t);
        const noteSample = (fundamental + harmonic2 + harmonic3) * envelope * 0.35;

        pcmBuffer[letterSampleOffset + j] += noteSample;
      }

      letterSampleOffset += Math.floor(note.duration * sampleRate);
    });

    // Advance offset
    wordSampleOffset += wordSamplesCount + Math.floor(0.12 * sampleRate);
  });

  // Normalize and convert to 16-bit PCM WAV
  const wavBytes = encodeWav(pcmBuffer, sampleRate);
  const base64 = uint8ArrayToBase64(wavBytes);

  return {
    audioBase64: base64,
    durationSeconds: totalSeconds,
    composition: comp
  };
}

// Convert Float32Array to 16-bit PCM WAV format
function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // Subchunk1Size
  view.setUint16(20, 1, true);           // AudioFormat (PCM)
  view.setUint16(22, 1, true);           // Channels (1 = Mono)
  view.setUint32(24, sampleRate, true);  // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);           // BlockAlign
  view.setUint16(34, 16, true);          // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Find max amplitude for peak normalization
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  const normFactor = maxAmp > 0.85 ? 0.85 / maxAmp : 1.0;

  // Write audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * normFactor));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

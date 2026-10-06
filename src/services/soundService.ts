/**
 * Dot X Library - Notification Sound Synthesis Service
 * Provides 12 distinct, high-fidelity notification tunes synthesized via Web Audio API.
 * 100% offline, zero external audio asset dependency, zero network delay.
 */

export interface NotificationTune {
  id: string;
  name: string;
  category: 'Modern' | 'Acoustic' | 'Ambient' | 'Retro' | 'Classic' | 'Nature';
  description: string;
  icon: string;
  pitch: string;
  tempo: string;
}

export const NOTIFICATION_TUNES: NotificationTune[] = [
  {
    id: 'chime',
    name: 'Crystal Chime',
    category: 'Modern',
    description: 'Crisp dual harmonic bell chime with bright sparkle decay',
    icon: '✨',
    pitch: 'E5 → B5 → E6',
    tempo: 'Fast'
  },
  {
    id: 'marimba',
    name: 'Warm Marimba',
    category: 'Acoustic',
    description: 'Organic wooden melodic doublet with warm acoustic presence',
    icon: '🪵',
    pitch: 'A4 → C#5 → E5',
    tempo: 'Brisk'
  },
  {
    id: 'pulse',
    name: 'Digital Pulse',
    category: 'Modern',
    description: 'Snappy electronic double-blip for clean modern interfaces',
    icon: '⚡',
    pitch: 'D5 → A5',
    tempo: 'Ultra-fast'
  },
  {
    id: 'crystal',
    name: 'Glass Shimmer',
    category: 'Ambient',
    description: 'Cascading glass arpeggio with shimmering harmonic overtone',
    icon: '💎',
    pitch: 'C6 → E6 → G6 → C7',
    tempo: 'Ascending'
  },
  {
    id: 'harp',
    name: 'Celestial Harp',
    category: 'Acoustic',
    description: 'Flowing five-note harp flourish with soothing relaxation decay',
    icon: '🪕',
    pitch: 'C5 → E5 → G5 → B5 → D6',
    tempo: 'Flowing'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Ambient',
    category: 'Ambient',
    description: 'Deep spatial frequency swell with resonant sci-fi sheen',
    icon: '🌌',
    pitch: 'F#4 → C#5 → F#5',
    tempo: 'Swell'
  },
  {
    id: 'bell',
    name: 'Temple Brass Bell',
    category: 'Classic',
    description: 'Resonant bronze bell chime with deep sustain and rich undertone',
    icon: '🔔',
    pitch: 'G4 sustain + G5',
    tempo: 'Sustained'
  },
  {
    id: 'arcade',
    name: 'Retro 8-Bit Coin',
    category: 'Retro',
    description: 'Nostalgic chiptune coin pickup melody with bright square waves',
    icon: '🎮',
    pitch: 'B5 → E6',
    tempo: 'Chiptune'
  },
  {
    id: 'zen',
    name: 'Zen Singing Bowl',
    category: 'Ambient',
    description: 'Harmonic Tibetan singing bowl pulse for calm study environments',
    icon: '🧘',
    pitch: 'A4 fundamental (440Hz)',
    tempo: 'Calm'
  },
  {
    id: 'bubble',
    name: 'Water Drop',
    category: 'Nature',
    description: 'Playful water droplet pop with upward pitch bend',
    icon: '💧',
    pitch: 'F5 bend to C6',
    tempo: 'Quick Pop'
  },
  {
    id: 'whistle',
    name: 'Melodic Whistle',
    category: 'Acoustic',
    description: 'Friendly bird-like twin whistle chirp with airy flutter',
    icon: '🐦',
    pitch: 'D6 → F#6',
    tempo: 'Breezy'
  },
  {
    id: 'sunrise',
    name: 'Morning Sunrise',
    category: 'Modern',
    description: 'Uplifting major triad unison chord for inspiring achievements',
    icon: '🌅',
    pitch: 'C5 + E5 + G5 + C6',
    tempo: 'Harmonic Chime'
  }
];

// Audio Context Singleton
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Synthesizes and plays the specified notification tune via Web Audio API.
 */
export function playNotificationTune(tuneId: string = 'chime', volume: number = 0.35): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.connect(ctx.destination);

  switch (tuneId) {
    case 'chime': {
      // Crystal Chime (E5 -> B5 -> E6)
      const notes = [659.25, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(0.6, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
      break;
    }

    case 'marimba': {
      // Warm Marimba (A4 -> C#5 -> E5)
      const freqs = [440, 554.37, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        noteGain.gain.setValueAtTime(0, now + idx * 0.09);
        noteGain.gain.linearRampToValueAtTime(0.8, now + idx * 0.09 + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
      break;
    }

    case 'pulse': {
      // Modern Crisp Pulse (D5 -> A5)
      const pNotes = [587.33, 880.0];
      pNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        noteGain.gain.setValueAtTime(0.7, now + idx * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
      break;
    }

    case 'crystal': {
      // Glass Shimmer (C6 -> E6 -> G6 -> C7)
      const cNotes = [1046.5, 1318.51, 1567.98, 2093.0];
      cNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        noteGain.gain.setValueAtTime(0.01, now + idx * 0.05);
        noteGain.gain.linearRampToValueAtTime(0.5, now + idx * 0.05 + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.55);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.6);
      });
      break;
    }

    case 'harp': {
      // Celestial Harp (C5 -> E5 -> G5 -> B5 -> D6)
      const hNotes = [523.25, 659.25, 783.99, 987.77, 1174.66];
      hNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        noteGain.gain.setValueAtTime(0, now + idx * 0.07);
        noteGain.gain.linearRampToValueAtTime(0.5, now + idx * 0.07 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.7);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.75);
      });
      break;
    }

    case 'cosmic': {
      // Cosmic Ambient Swell (F#4 -> C#5 -> F#5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const cosmicGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(369.99, now); // F#4
      osc1.frequency.exponentialRampToValueAtTime(739.99, now + 0.35); // F#5

      osc2.frequency.setValueAtTime(554.37, now); // C#5
      osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.35);

      cosmicGain.gain.setValueAtTime(0.01, now);
      cosmicGain.gain.linearRampToValueAtTime(0.6, now + 0.12);
      cosmicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.connect(cosmicGain);
      osc2.connect(cosmicGain);
      cosmicGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
      break;
    }

    case 'bell': {
      // Temple Brass Bell (G4 sustain with metallic harmonics)
      const f0 = 392.0; // G4
      [1, 2.76, 5.4].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f0 * mult, now);

        const peak = i === 0 ? 0.7 : 0.25 / (i + 1);
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(peak, now + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.15);
      });
      break;
    }

    case 'arcade': {
      // Retro 8-bit Coin (B5 -> E6)
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      noteGain.gain.setValueAtTime(0.25, now);
      noteGain.gain.setValueAtTime(0.25, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }

    case 'zen': {
      // Zen Singing Bowl (A4 440Hz + 880Hz overtone)
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const zenGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(884, now); // Slight beat frequency

      zenGain.gain.setValueAtTime(0.001, now);
      zenGain.gain.linearRampToValueAtTime(0.7, now + 0.04);
      zenGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc.connect(zenGain);
      oscSub.connect(zenGain);
      zenGain.connect(masterGain);

      osc.start(now);
      oscSub.start(now);
      osc.stop(now + 1.35);
      oscSub.stop(now + 1.35);
      break;
    }

    case 'bubble': {
      // Water Drop (F5 pitch bend to C6)
      const osc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

      dropGain.gain.setValueAtTime(0, now);
      dropGain.gain.linearRampToValueAtTime(0.7, now + 0.03);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(dropGain);
      dropGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }

    case 'whistle': {
      // Melodic Whistle (D6 -> F#6)
      const wNotes = [1174.66, 1479.98];
      wNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);

        noteGain.gain.setValueAtTime(0, now + idx * 0.11);
        noteGain.gain.linearRampToValueAtTime(0.45, now + idx * 0.11 + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.3);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.35);
      });
      break;
    }

    case 'sunrise': {
      // Morning Sunrise (C5 + E5 + G5 + C6 Chord Chime)
      const triad = [523.25, 659.25, 783.99, 1046.5];
      triad.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        noteGain.gain.setValueAtTime(0, now + i * 0.04);
        noteGain.gain.linearRampToValueAtTime(0.4, now + i * 0.04 + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.9);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.95);
      });
      break;
    }

    default: {
      // Fallback: standard gentle chime
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.1);
      g.gain.setValueAtTime(0.5, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.55);
      break;
    }
  }
}

/**
 * Gets the user's active notification tune from localStorage or fallback.
 */
export function getActiveNotificationTune(): string {
  if (typeof window === 'undefined') return 'chime';
  try {
    return localStorage.getItem('dotx_notification_tune') || 'chime';
  } catch {
    return 'chime';
  }
}

/**
 * Sets the active notification tune in localStorage and dispatches event.
 */
export function setActiveNotificationTune(tuneId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dotx_notification_tune', tuneId);
    window.dispatchEvent(new CustomEvent('dotx_tune_changed', { detail: { tuneId } }));
  } catch {}
}

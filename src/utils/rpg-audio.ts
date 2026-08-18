// Original synthesized chiptune SFX for the RPG battle arena.
// No audio files, no copyrighted material - pure WebAudio oscillators/noise.
// AudioContext is created lazily inside play* calls, which always originate
// from user gestures (click/keydown), satisfying autoplay policies.

const STORAGE_KEY = 'rpg-sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) !== 'on';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on');
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startMs: number, durMs: number, type: OscillatorType = 'square', peak = 1) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + startMs / 1000;
  const t1 = t0 + durMs / 1000;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t1);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

function noise(startMs: number, durMs: number, filterFreq: number, peak = 1) {
  const c = ensureCtx();
  if (!c || !master) return;
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + startMs / 1000;
  const t1 = t0 + durMs / 1000;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(peak, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t1);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
  src.stop(t1 + 0.02);
}

function guard(fn: () => void) {
  if (isMuted()) return;
  try {
    fn();
  } catch {
    // never let audio break the game
  }
}

export const playCursor = () => guard(() => tone(1100, 0, 40, 'square', 0.6));
export const playConfirm = () => guard(() => { tone(880, 0, 50); tone(1320, 55, 70); });
export const playCancel = () => guard(() => { tone(660, 0, 50); tone(440, 55, 80); });
export const playBuzzer = () => guard(() => tone(160, 0, 160, 'sawtooth', 0.7));
export const playHit = () => guard(() => { noise(0, 90, 2200); tone(220, 0, 60, 'square', 0.5); });
export const playHurt = () => guard(() => { noise(0, 130, 900); tone(150, 0, 140, 'triangle', 0.9); });
export const playHeal = () => guard(() => { tone(523, 0, 90, 'triangle'); tone(659, 95, 90, 'triangle'); tone(784, 190, 140, 'triangle'); });
export const playLimit = () => guard(() => {
  [440, 554, 659, 880, 1109].forEach((f, i) => tone(f, i * 60, 70, 'square', 0.8));
});
export const playVictory = () => guard(() => {
  // Original I-IV-V-flavored fanfare motif
  const notes: Array<[number, number, number]> = [
    [523, 0, 110], [523, 120, 110], [523, 240, 110], [523, 360, 220],
    [415, 600, 220], [466, 840, 220], [523, 1080, 180], [466, 1280, 90], [523, 1380, 420],
  ];
  notes.forEach(([f, s, d]) => tone(f, s, d, 'square', 0.7));
});
export const playDefeat = () => guard(() => {
  [392, 370, 349, 330].forEach((f, i) => tone(f, i * 220, 240, 'triangle', 0.8));
});

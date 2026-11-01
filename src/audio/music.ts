import { audioContext } from './sfx';

// MUSIQUE D'AMBIANCE PROCÉDURALE (WebAudio) : nappes sombres en mineur et cloches éparses, plus une
// pulsation grave en combat. Aucun fichier audio : fonctionne hors ligne, ne pèse rien.

type Mode = 'menu' | 'battle';
let enabled = true;
let volume = 0.35;
let mode: Mode | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextChordAt = 0;
let nextBellAt = 0;
let nextPulseAt = 0;
let chordIdx = 0;

// Ré mineur — Si♭ — Fa — Do (fréquences des voix)
const CHORDS = [[146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [174.6, 220.0, 261.6], [130.8, 164.8, 196.0]];
const SCALE = [293.7, 349.2, 392.0, 440.0, 523.3, 587.3, 698.5];

function ensureGraph(ctx: AudioContext) {
  if (master) return;
  master = ctx.createGain();
  master.gain.value = 0;
  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(master).connect(ctx.destination);
}

function voice(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number, dest: AudioNode) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = (Math.random() - 0.5) * 12;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + Math.min(2, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function schedule() {
  const ctx = audioContext();
  if (!ctx || !master || !filter || !mode) return;
  const now = ctx.currentTime;
  const ahead = now + 0.6;
  const chordLen = mode === 'battle' ? 4 : 7;
  while (nextChordAt < ahead) {
    for (const f of CHORDS[chordIdx % CHORDS.length]) {
      voice(ctx, f, nextChordAt, chordLen + 1.5, 'sawtooth', 0.035, filter);
      voice(ctx, f / 2, nextChordAt, chordLen + 1.5, 'triangle', 0.05, filter);
    }
    chordIdx++;
    nextChordAt += chordLen;
  }
  while (nextBellAt < ahead) {
    if (Math.random() < 0.55) voice(ctx, SCALE[Math.floor(Math.random() * SCALE.length)], nextBellAt, 2.4, 'sine', 0.05, master);
    nextBellAt += mode === 'battle' ? 0.75 : 1.6;
  }
  if (mode === 'battle') {
    while (nextPulseAt < ahead) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(90, nextPulseAt);
      o.frequency.exponentialRampToValueAtTime(40, nextPulseAt + 0.25);
      g.gain.setValueAtTime(0.18, nextPulseAt);
      g.gain.exponentialRampToValueAtTime(0.0001, nextPulseAt + 0.3);
      o.connect(g).connect(master);
      o.start(nextPulseAt); o.stop(nextPulseAt + 0.35);
      nextPulseAt += 0.5;
    }
  }
}

function applyVolume() {
  const ctx = audioContext();
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(enabled && mode ? volume * 0.6 : 0, ctx.currentTime, 0.4);
}

export function configureMusic(opts: { enabled: boolean; volume: number }) {
  enabled = opts.enabled;
  volume = opts.volume;
  if (!enabled) stopMusic(); else if (mode) applyVolume();
}

export function playMusic(m: Mode) {
  const ctx = audioContext();
  if (!ctx || !enabled) { mode = m; return; }
  ensureGraph(ctx);
  if (mode !== m || !timer) {
    mode = m;
    filter!.frequency.setTargetAtTime(m === 'battle' ? 1400 : 900, ctx.currentTime, 0.5);
    const t = ctx.currentTime + 0.1;
    nextChordAt = Math.max(nextChordAt, t);
    nextBellAt = Math.max(nextBellAt, t + 1);
    nextPulseAt = Math.max(nextPulseAt, t);
    if (!timer) timer = setInterval(schedule, 250);
  }
  applyVolume();
}

export function stopMusic() {
  if (timer) { clearInterval(timer); timer = null; }
  applyVolume();
}

export function currentMusicMode() { return mode; }

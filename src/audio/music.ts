import { audioContext } from './sfx';

// MUSIQUE PROCÉDURALE (WebAudio) — un petit compositeur plutôt qu'une boucle : chaque morceau a sa tonalité,
// sa grille d'accords, son tempo, ses instruments et une mélodie (un motif fixe par morceau, varié au fil
// des sections). Réverbération par convolution pour l'espace. Aucun fichier audio : fonctionne hors ligne.
//
// Morceaux : Accueil (harpe, nappe, flûte), Invocation (cloches de verre, chœur), Combat (une couleur par
// région : ostinato, tambours, cuivres) et Boss (plus rapide, plus lourd).

export type MusicMode = 'menu' | 'summon' | 'battle' | 'boss';
type Lead = 'flute' | 'brass' | 'square' | 'choir';

interface Theme {
  tempo: number;
  root: number; // note MIDI de la tonique
  scale: number[]; // intervalles
  prog: number[]; // degrés (0 = I) d'un accord par mesure
  lead: Lead;
  drums: 'none' | 'battle' | 'boss';
  arp: 'harp' | 'bells' | 'pulse' | 'none';
  cutoff: number;
}

const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const HARMONIC = [0, 2, 3, 5, 7, 8, 11];
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];

const MENU: Theme = { tempo: 68, root: 62, scale: AEOLIAN, prog: [0, 5, 2, 6], lead: 'flute', drums: 'none', arp: 'harp', cutoff: 1500 };
const SUMMON: Theme = { tempo: 60, root: 64, scale: LYDIAN, prog: [0, 1, 0, 4], lead: 'choir', drums: 'none', arp: 'bells', cutoff: 2600 };
// Combat : une couleur par région (tonalité, mode, grille, timbre de la mélodie).
const REGION: Record<string, Partial<Theme>> = {
  valcrest: { root: 57, scale: AEOLIAN, prog: [0, 5, 2, 6], lead: 'brass' },
  sylvaran: { root: 52, scale: DORIAN, prog: [0, 3, 0, 6], lead: 'flute' },
  prism: { root: 61, scale: AEOLIAN, prog: [0, 5, 6, 4], lead: 'square', arp: 'pulse' },
  akkar: { root: 52, scale: HIJAZ, prog: [0, 1, 0, 6], lead: 'brass' },
  ash: { root: 48, scale: HARMONIC, prog: [0, 5, 4, 0], lead: 'brass' },
  astral: { root: 53, scale: LYDIAN, prog: [0, 1, 5, 4], lead: 'choir', arp: 'bells' },
  heart: { root: 57, scale: HARMONIC, prog: [0, 5, 2, 4], lead: 'choir' },
  seams: { root: 59, scale: DORIAN, prog: [0, 6, 3, 4], lead: 'square' },
  abyss: { root: 55, scale: AEOLIAN, prog: [0, 5, 3, 4], lead: 'choir', tempo: 104 },
};
function battleTheme(region: string | undefined, boss: boolean): Theme {
  const r = REGION[region ?? ''] ?? REGION.valcrest;
  const base: Theme = { tempo: 118, root: 57, scale: AEOLIAN, prog: [0, 5, 2, 6], lead: 'brass', drums: 'battle', arp: 'none', cutoff: 2200, ...r };
  return boss ? { ...base, tempo: base.tempo + 14, drums: 'boss', lead: base.lead === 'flute' ? 'brass' : base.lead } : base;
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
/** Note de la gamme (degré, décalage d'octave). */
const deg = (t: Theme, d: number, oct = 0) => t.root + 12 * (oct + Math.floor(d / t.scale.length)) + t.scale[((d % t.scale.length) + t.scale.length) % t.scale.length];

// ─── État ───
let enabled = true;
let volume = 0.35;
let mode: MusicMode | null = null;
let theme: Theme = MENU;
let themeKey = '';
let motif: (number | null)[] = [];
let master: GainNode | null = null;
let dry: GainNode | null = null;
let wet: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextAt = 0;

function seeded(seed: number) {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; };
}
const hashStr = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Motif de 16 croches (2 mesures) : degrés de la gamme, ou silence. Fixe pour un morceau donné. */
function makeMotif(key: string): (number | null)[] {
  const r = seeded(hashStr(key));
  const out: (number | null)[] = [];
  let d = [0, 2, 4][Math.floor(r() * 3)];
  for (let i = 0; i < 16; i++) {
    if (i % 8 === 7 || (i % 2 === 1 && r() < 0.45)) { out.push(null); continue; }
    const move = r();
    d += move < 0.35 ? 1 : move < 0.7 ? -1 : move < 0.85 ? 2 : -2;
    d = Math.max(-1, Math.min(7, d));
    out.push(i % 8 === 6 ? [0, 2, 4][Math.floor(r() * 3)] : d);
  }
  return out;
}

function ensureGraph(ctx: AudioContext) {
  if (master) return;
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(master);
  // Réverbération : réponse impulsionnelle générée (bruit qui décroît en 2,8 s, stéréo).
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.8);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  conv.buffer = ir;
  wet = ctx.createGain(); wet.gain.value = 0.32;
  wet.connect(conv).connect(master);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}

/** Sortie d'un instrument : sec + envoi vers la réverbération. */
function out(ctx: AudioContext, send: number): GainNode {
  const g = ctx.createGain();
  g.connect(dry!);
  if (send > 0) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(wet!); }
  return g;
}

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function osc(ctx: AudioContext, type: OscillatorType, f: number, t: number, dur: number, dest: AudioNode, detune = 0) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
  o.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return o;
}

// ─── Instruments ───
function pad(ctx: AudioContext, notes: number[], t: number, dur: number, cutoff: number, choir = false) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = choir ? 1400 : cutoff * 0.55; lp.Q.value = choir ? 4 : 0.7;
  const g = out(ctx, 0.6); lp.connect(g);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(choir ? 0.05 : 0.04, t + 1.2);
  g.gain.setValueAtTime(choir ? 0.05 : 0.04, t + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.4);
  for (const n of notes) { osc(ctx, 'sawtooth', mtof(n), t, dur + 1.5, lp, -7); osc(ctx, 'sawtooth', mtof(n), t, dur + 1.5, lp, 7); }
}
function pluck(ctx: AudioContext, n: number, t: number, gain = 0.07) {
  const g = out(ctx, 0.45); env(g, t, 0.005, gain, 0.9);
  osc(ctx, 'triangle', mtof(n), t, 1, g); osc(ctx, 'sine', mtof(n + 12), t, 0.4, g);
}
function bell(ctx: AudioContext, n: number, t: number, gain = 0.045) {
  const g = out(ctx, 0.7); env(g, t, 0.004, gain, 2.2);
  osc(ctx, 'sine', mtof(n), t, 2.3, g); osc(ctx, 'sine', mtof(n) * 2.76, t, 1.2, g);
}
function pulse(ctx: AudioContext, n: number, t: number) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.15);
  const g = out(ctx, 0.25); lp.connect(g); env(g, t, 0.003, 0.035, 0.16);
  osc(ctx, 'square', mtof(n), t, 0.2, lp);
}
function lead(ctx: AudioContext, kind: Lead, n: number, t: number, dur: number) {
  const f = mtof(n);
  const g = out(ctx, kind === 'flute' ? 0.55 : 0.4);
  if (kind === 'flute') {
    env(g, t, 0.06, 0.06, dur + 0.25);
    const o = osc(ctx, 'sine', f, t, dur + 0.35, g);
    const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.006;
    lfo.connect(lg).connect(o.frequency); lfo.start(t + 0.12); lfo.stop(t + dur + 0.4);
    osc(ctx, 'triangle', f * 2, t, dur + 0.2, g).detune.value = 3;
  } else if (kind === 'choir') {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.4; bp.connect(g);
    env(g, t, 0.18, 0.12, dur + 0.5);
    osc(ctx, 'sawtooth', f, t, dur + 0.7, bp, -6); osc(ctx, 'sawtooth', f, t, dur + 0.7, bp, 6);
  } else {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(kind === 'square' ? 1800 : 600, t); lp.frequency.exponentialRampToValueAtTime(kind === 'square' ? 2600 : 2200, t + 0.08); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    lp.connect(g); env(g, t, 0.025, kind === 'square' ? 0.035 : 0.05, dur + 0.15);
    osc(ctx, kind === 'square' ? 'square' : 'sawtooth', f, t, dur + 0.2, lp, -4); osc(ctx, 'sawtooth', f / 2, t, dur + 0.2, lp, 4);
  }
}
function bass(ctx: AudioContext, n: number, t: number, dur: number, gain = 0.09) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(220, t + dur);
  const g = out(ctx, 0.05); lp.connect(g); env(g, t, 0.006, gain, dur);
  osc(ctx, 'sawtooth', mtof(n), t, dur + 0.05, lp);
}
function drum(ctx: AudioContext, kind: 'kick' | 'taiko' | 'snare' | 'hat', t: number, gain = 1) {
  if (kind === 'kick' || kind === 'taiko') {
    const g = out(ctx, kind === 'taiko' ? 0.35 : 0.1); env(g, t, 0.003, 0.28 * gain, kind === 'taiko' ? 0.5 : 0.28);
    const o = osc(ctx, 'sine', kind === 'taiko' ? 82 : 110, t, 0.55, g); o.frequency.exponentialRampToValueAtTime(kind === 'taiko' ? 46 : 40, t + 0.3);
    if (kind === 'taiko') noiseHit(ctx, t, 'lowpass', 420, 0.12 * gain, 0.18, 0.3);
  } else if (kind === 'snare') {
    noiseHit(ctx, t, 'bandpass', 1900, 0.09 * gain, 0.16, 0.3);
    const g = out(ctx, 0.2); env(g, t, 0.002, 0.05 * gain, 0.1); osc(ctx, 'triangle', 190, t, 0.12, g);
  } else noiseHit(ctx, t, 'highpass', 7500, 0.025 * gain, 0.045, 0.05);
}
function noiseHit(ctx: AudioContext, t: number, type: BiquadFilterType, freq: number, gain: number, dur: number, send: number) {
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = out(ctx, send); env(g, t, 0.002, gain, dur);
  src.connect(f).connect(g); src.start(t); src.stop(t + dur + 0.05);
}

// ─── Séquenceur (doubles croches) ───
const BAR = 16;
function chordAt(bar: number) { const d = theme.prog[bar % theme.prog.length]; return [deg(theme, d), deg(theme, d + 2), deg(theme, d + 4)]; }

function playStep(ctx: AudioContext, s: number, t: number) {
  const sd = 60 / theme.tempo / 4;
  const bar = Math.floor(s / BAR), i = s % BAR;
  const section = Math.floor(bar / 8) % 4; // 0 : base · 1 : mélodie · 2 : contre-chant · 3 : mélodie variée
  const chord = chordAt(bar);
  const d0 = theme.prog[bar % theme.prog.length];
  if (i === 0) pad(ctx, theme.drums === 'none' ? chord : chord.map((n) => n - 12), t, sd * BAR, theme.cutoff, theme.lead === 'choir' && theme.drums !== 'none');

  // Arpèges
  if (theme.arp === 'harp' && i % 2 === 0) { const up = [0, 1, 2, 3, 2, 1, 2, 3][i / 2]; pluck(ctx, up === 3 ? chord[0] + 12 : chord[up], t); }
  if (theme.arp === 'bells' && i % 4 === 0 && (theme.drums === 'none' || section !== 0)) bell(ctx, [chord[0], chord[2], chord[1] + 12, chord[2] + 12][i / 4] + 12, t);
  if (theme.arp === 'pulse' && i % 2 === 0) pulse(ctx, chord[(i / 2) % 3] + 12, t);

  // Basse et tambours (combat)
  if (theme.drums !== 'none') {
    const pat = theme.drums === 'boss' ? [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1] : [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0];
    if (pat[i]) bass(ctx, deg(theme, d0, -2) + (i % 8 === 6 ? 12 : 0), t, sd * 0.9);
    const kicks = theme.drums === 'boss' ? [0, 3, 6, 8, 10, 14] : [0, 6, 8, 11];
    if (kicks.includes(i)) drum(ctx, 'taiko', t, i === 0 ? 1.1 : 0.8);
    if (i === 4 || i === 12) drum(ctx, 'snare', t, section === 0 ? 0.6 : 1);
    if (theme.drums === 'boss' ? true : i % 2 === 0) drum(ctx, 'hat', t, i % 4 === 0 ? 1 : 0.6);
    if (i === 0 && section !== 0) lead(ctx, 'brass', chord[0] - 12, t, sd * 2); // accent de cuivres
  } else if (i === 0) bass(ctx, chord[0] - 24, t, sd * BAR * 0.9, 0.05);

  // Mélodie : motif de 2 mesures, aux sections 1 et 3 (variée), contre-chant en cloches à la section 2.
  if (section === 1 || section === 3) {
    const k = (s % (BAR * 2)) / 2;
    if (s % 2 === 0) {
      const m = motif[k];
      if (m != null) {
        const len = motif[k + 1] == null ? sd * 4 : sd * 2;
        const lift = section === 3 && bar % 4 >= 2 ? 2 : 0; // réponse un peu plus haute
        lead(ctx, theme.lead, deg(theme, d0 + m + lift, theme.drums === 'none' ? 1 : 0), t, len * 0.95);
      }
    }
  } else if (section === 2 && theme.drums !== 'none' && i % 8 === 0) bell(ctx, chord[(i / 8) % 3] + 24, t, 0.03);
  else if (section === 0 && theme.drums === 'none' && i === 8 && bar % 2 === 1) bell(ctx, chord[2] + 24, t, 0.025);
}

function schedule() {
  const ctx = audioContext();
  if (!ctx || !master || !mode) return;
  const ahead = ctx.currentTime + 0.3;
  const sd = 60 / theme.tempo / 4;
  while (nextAt < ahead) { playStep(ctx, step, nextAt); step++; nextAt += sd; }
}

function applyVolume() {
  const ctx = audioContext();
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(enabled && mode && timer ? volume * 1.3 : 0, ctx.currentTime, 0.4);
}

export function configureMusic(opts: { enabled: boolean; volume: number }) {
  enabled = opts.enabled;
  volume = opts.volume;
  if (!enabled) stopMusic(); else if (mode) applyVolume();
}

let lastRegion: string | undefined;
/** Joue un morceau (combat : la région choisit sa couleur). Rejouer le même morceau ne le recommence pas. */
export function playMusic(m: MusicMode, region?: string) {
  const key = m === 'battle' || m === 'boss' ? `${m}:${region ?? 'valcrest'}` : m;
  lastRegion = region;
  const ctx = audioContext();
  if (!ctx || !enabled) { mode = m; return; }
  ensureGraph(ctx);
  if (key !== themeKey) {
    themeKey = key;
    theme = m === 'menu' ? MENU : m === 'summon' ? SUMMON : battleTheme(region, m === 'boss');
    motif = makeMotif(key);
    // Nouveau morceau : on repart du début, après un court silence (fondu du précédent par la réverbération).
    step = 0;
    nextAt = ctx.currentTime + 0.35;
  } else if (!timer) nextAt = Math.max(nextAt, ctx.currentTime + 0.1);
  mode = m;
  if (!timer) timer = setInterval(schedule, 90);
  applyVolume();
}

/** Reprend le dernier morceau (retour au premier plan). */
export function resumeMusic() { if (mode) playMusic(mode, lastRegion); }

export function stopMusic() {
  if (timer) { clearInterval(timer); timer = null; }
  applyVolume();
}

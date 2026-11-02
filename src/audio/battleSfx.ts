import { sfxOut } from './sfx';
import type { SkillFx, FxElement, FxWeapon } from '../ui/fx/skillFx';
import type { StatusId } from '../data/types';

// BRUITAGES DE COMBAT — entièrement synthétisés (WebAudio) : aucun fichier, fonctionne hors ligne.
// Chaque compétence joue un son de LANCEMENT (geste ou matière) puis un son d'IMPACT
// (arme + élément). Les effets d'état ont leur propre signature.

let master: { ctx: AudioContext; node: GainNode } | null = null;
let noiseBuf: AudioBuffer | null = null;

function out() {
  const o = sfxOut();
  if (!o) return null;
  if (!master || master.ctx !== o.ctx) {
    const comp = o.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    const g = o.ctx.createGain();
    g.connect(comp).connect(o.ctx.destination);
    master = { ctx: o.ctx, node: g };
    noiseBuf = null;
  }
  master.node.gain.value = o.volume;
  if (!noiseBuf) {
    noiseBuf = o.ctx.createBuffer(1, o.ctx.sampleRate * 2, o.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return { ctx: o.ctx, dest: master.node, noise: noiseBuf };
}

type Env = { at?: number; dur: number; gain: number; attack?: number };

function osc(type: OscillatorType, f0: number, f1: number | null, e: Env, detune = 0) {
  const o = out(); if (!o) return;
  const t = o.ctx.currentTime + (e.at ?? 0);
  const n = o.ctx.createOscillator(); const g = o.ctx.createGain();
  n.type = type; n.detune.value = detune;
  n.frequency.setValueAtTime(f0, t);
  if (f1) n.frequency.exponentialRampToValueAtTime(f1, t + e.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(e.gain, t + (e.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + e.dur);
  n.connect(g).connect(o.dest);
  n.start(t); n.stop(t + e.dur + 0.05);
}

function noise(filter: BiquadFilterType, f0: number, f1: number | null, e: Env, q = 1) {
  const o = out(); if (!o) return;
  const t = o.ctx.currentTime + (e.at ?? 0);
  const src = o.ctx.createBufferSource(); src.buffer = o.noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = o.ctx.createBiquadFilter(); f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + e.dur);
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(e.gain, t + (e.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + e.dur);
  src.connect(f).connect(g).connect(o.dest);
  src.start(t, Math.random()); src.stop(t + e.dur + 0.05);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ─── Briques sonores ───
const whoosh = (lo: number, hi: number, dur: number, gain = 0.35, at = 0) => noise('bandpass', lo, hi, { at, dur, gain, attack: dur * 0.6 }, 1.4);
const thump = (gain = 0.7, at = 0) => { osc('sine', 150, 42, { at, dur: 0.26, gain }); noise('lowpass', 700, 200, { at, dur: 0.12, gain: gain * 0.5 }); };
const shing = (at = 0) => { osc('triangle', rnd(2400, 2900), null, { at, dur: 0.18, gain: 0.16 }); osc('triangle', rnd(3600, 4200), null, { at, dur: 0.12, gain: 0.08 }); noise('highpass', 5000, null, { at, dur: 0.06, gain: 0.25 }); };
const thunk = (at = 0) => { noise('bandpass', 1800, 900, { at, dur: 0.06, gain: 0.45 }, 2); osc('triangle', 320, 140, { at, dur: 0.06, gain: 0.25 }); };
const rip = (at = 0) => { noise('bandpass', 2600, 1200, { at, dur: 0.09, gain: 0.4 }, 2); noise('bandpass', 2200, 1000, { at: at + 0.07, dur: 0.09, gain: 0.35 }, 2); };
const crack = (at = 0) => noise('highpass', 3500, null, { at, dur: 0.035, gain: 0.7 });
const crackle = (n: number, span: number, at = 0) => { for (let i = 0; i < n; i++) noise('highpass', rnd(2500, 6000), null, { at: at + rnd(0, span), dur: 0.02, gain: rnd(0.15, 0.35) }); };
const chimes = (freqs: number[], step: number, dur: number, gain = 0.14, at = 0) => freqs.forEach((f, i) => osc('sine', f, null, { at: at + i * step, dur, gain }));
const bubbles = (n: number, at = 0) => { for (let i = 0; i < n; i++) { const f = rnd(260, 520); osc('sine', f, f * 2.2, { at: at + i * rnd(0.04, 0.08), dur: 0.06, gain: 0.18 }); } };
const zap = (at = 0, dur = 0.18) => { osc('sawtooth', 2200, 90, { at, dur, gain: 0.18 }); osc('square', 1300, 160, { at, dur: dur * 0.8, gain: 0.08 }, 30); crackle(6, dur, at); };
const pew = (at = 0) => { osc('square', 1700, 260, { at, dur: 0.14, gain: 0.12 }); osc('sine', 900, 200, { at, dur: 0.14, gain: 0.12 }); };
const gong = (at = 0, gain = 0.22) => { [98, 196 * 1.01, 98 * 2.76, 98 * 5.4].forEach((f, i) => osc('sine', f, null, { at, dur: 1.4 - i * 0.25, gain: gain / (i + 1), attack: 0.01 })); };
const swell = (at = 0, dur = 0.4) => { noise('lowpass', 200, 1600, { at, dur, gain: 0.35, attack: dur * 0.85 }); osc('sine', 60, 40, { at, dur: dur + 0.2, gain: 0.3, attack: dur * 0.7 }); };
const implode = (at = 0) => { osc('sine', 240, 50, { at, dur: 0.32, gain: 0.4 }); noise('lowpass', 1400, 150, { at, dur: 0.3, gain: 0.3 }); };
const clank = (at = 0) => { [1800, 2650, 3400].forEach((f) => osc('triangle', f * rnd(0.97, 1.03), null, { at: at + rnd(0, 0.03), dur: 0.16, gain: 0.08 })); noise('bandpass', 3000, null, { at, dur: 0.05, gain: 0.25 }, 3); };
const snap = (at = 0) => { osc('triangle', 150, 80, { at, dur: 0.1, gain: 0.3 }); noise('bandpass', 1300, 600, { at, dur: 0.08, gain: 0.35 }, 2); };
const sparkle = (n: number, at = 0) => { for (let i = 0; i < n; i++) osc('sine', rnd(2600, 5200), null, { at: at + i * 0.05, dur: 0.18, gain: 0.07 }); };
const sandHiss = (at = 0, dur = 0.4) => noise('bandpass', 900, 1700, { at, dur, gain: 0.3, attack: dur * 0.4 }, 0.7);

// ─── Lancement ───
const WEAPON_CAST: Record<FxWeapon, () => void> = {
  blade: () => whoosh(900, 3800, 0.2),
  blunt: () => whoosh(250, 900, 0.26, 0.45),
  claw: () => { whoosh(1200, 3000, 0.12, 0.3); whoosh(1200, 3000, 0.12, 0.3, 0.09); },
  whip: () => { whoosh(700, 2600, 0.16, 0.3); crack(0.15); },
  pierce: () => { osc('triangle', 420, 240, { dur: 0.1, gain: 0.25 }); noise('highpass', 3000, null, { dur: 0.05, gain: 0.2 }); },
  none: () => {},
};
const ELEMENT_CAST: Partial<Record<FxElement, () => void>> = {
  fire: () => noise('lowpass', 300, 2200, { dur: 0.32, gain: 0.4, attack: 0.2 }),
  ice: () => { osc('sine', 1700, 2600, { dur: 0.25, gain: 0.1 }); noise('highpass', 6000, null, { dur: 0.25, gain: 0.08, attack: 0.15 }); },
  lightning: () => zap(0, 0.12),
  tech: () => pew(),
  void: () => swell(0, 0.32),
  holy: () => chimes([784, 988, 1175], 0.05, 0.4, 0.09),
  star: () => sparkle(5),
  sand: () => sandHiss(0, 0.3),
  sound: () => gong(0, 0.18),
  poison: () => bubbles(3),
  nature: () => snap(),
  chain: () => clank(),
};

export function playCast(fx: SkillFx) {
  if (!out()) return;
  if (fx.motion === 'support') { chimes([523, 659, 784, 1046], 0.06, 0.5, 0.08); return; }
  if (fx.motion === 'self') { chimes([392, 523, 659], 0.07, 0.4, 0.09); ELEMENT_CAST[fx.element]?.(); return; }
  if (fx.weapon !== 'none' && fx.motion !== 'rain') WEAPON_CAST[fx.weapon]();
  else ELEMENT_CAST[fx.element]?.();
  if (fx.motion === 'aoe' || fx.motion === 'rain') whoosh(200, 1200, 0.45, 0.25);
}

// ─── Impact ───
const WEAPON_HIT: Record<FxWeapon, (at: number) => void> = {
  blade: shing, blunt: (at) => thump(0.7, at), pierce: thunk, claw: rip, whip: crack, none: () => {},
};
const ELEMENT_HIT: Record<FxElement, (at: number) => void> = {
  fire: (at) => { crackle(10, 0.35, at); noise('lowpass', 500, 180, { at, dur: 0.4, gain: 0.35 }); },
  ice: (at) => { chimes([2637, 3322, 4186], 0.035, 0.3, 0.09, at); noise('highpass', 6000, null, { at, dur: 0.12, gain: 0.3 }); },
  poison: (at) => bubbles(4, at),
  lightning: (at) => zap(at),
  tech: (at) => { osc('square', 900, 120, { at, dur: 0.1, gain: 0.12 }); noise('bandpass', 3200, null, { at, dur: 0.06, gain: 0.3 }, 4); },
  void: (at) => implode(at),
  holy: (at) => chimes([1046, 1318, 1568], 0.03, 0.5, 0.1, at),
  nature: (at) => { snap(at); noise('bandpass', 2200, 900, { at: at + 0.04, dur: 0.22, gain: 0.15 }, 0.8); },
  star: (at) => { sparkle(6, at); osc('sine', 200, 70, { at, dur: 0.25, gain: 0.25 }); },
  sand: (at) => sandHiss(at, 0.35),
  sound: (at) => gong(at, 0.2),
  chain: (at) => clank(at),
  steel: () => {},
};

export function playImpact(fx: SkillFx, opts: { crit?: boolean; many?: boolean } = {}) {
  if (!out()) return;
  if (fx.weapon !== 'none') WEAPON_HIT[fx.weapon](0);
  else if (fx.element === 'steel') thump(0.5);
  ELEMENT_HIT[fx.element](fx.weapon !== 'none' ? 0.02 : 0);
  if (opts.many) { thump(0.35, 0.05); ELEMENT_HIT[fx.element](0.12); }
  if (opts.crit) { osc('sine', 110, 38, { dur: 0.35, gain: 0.6 }); noise('lowpass', 1200, 200, { dur: 0.2, gain: 0.35 }); }
}

// ─── Soins, boucliers, états ───
export function playHeal() { if (out()) { chimes([659, 880, 1175], 0.07, 0.6, 0.08); noise('highpass', 7000, null, { dur: 0.4, gain: 0.04, attack: 0.2 }); } }
export function playShield() { if (out()) { osc('sine', 660, 880, { dur: 0.35, gain: 0.12, attack: 0.05 }); osc('sine', 1320, null, { dur: 0.3, gain: 0.05 }); } }
export function playDeath() { if (out()) { thump(0.6); osc('sawtooth', 220, 55, { dur: 0.6, gain: 0.08 }); } }
export function playRevive() { if (out()) { chimes([523, 659, 784, 1046, 1318], 0.08, 0.7, 0.1); } }

const STATUS_SOUND: Partial<Record<StatusId, () => void>> = {
  freeze: () => { chimes([3136, 2637], 0.04, 0.25, 0.08); noise('highpass', 4000, null, { dur: 0.15, gain: 0.25 }); },
  stun: () => { osc('triangle', 1200, 1600, { dur: 0.08, gain: 0.12 }); osc('triangle', 1500, 1900, { at: 0.1, dur: 0.08, gain: 0.1 }); },
  poison: () => bubbles(3),
  burn: () => noise('lowpass', 400, 1600, { dur: 0.25, gain: 0.3, attack: 0.15 }),
  taunt: () => osc('sawtooth', 110, 90, { dur: 0.3, gain: 0.12 }),
};

/** Effet d'état posé. Un seul son par type d'effet et par action (appelé par le combat). */
export function playStatus(status: StatusId, debuff: boolean) {
  if (!out()) return;
  const f = STATUS_SOUND[status];
  if (f) f();
  else if (debuff) chimes([440, 349, 294], 0.06, 0.25, 0.07);
  else chimes([392, 494, 587], 0.06, 0.3, 0.07);
}

/** Dégâts sur la durée en début de tour. */
export function playDot(status: StatusId) {
  if (!out()) return;
  if (status === 'poison') bubbles(2); else crackle(5, 0.2);
}

// ─── Invocation : l'éclat se charge, se brise, la faille s'ouvre, l'Héritier en sort ───
/** Éclat qui vibre et se fissure (≈ 1,1 s). */
export function playShardCharge() {
  if (!out()) return;
  osc('sine', 220, 440, { dur: 1.1, gain: 0.12, attack: 0.9 });
  osc('triangle', 660, 1320, { dur: 1.1, gain: 0.05, attack: 0.9 }, 7);
  [0.25, 0.5, 0.7, 0.85, 0.95].forEach((t) => noise('highpass', rnd(3500, 6500), null, { at: t, dur: 0.04, gain: 0.25 }));
}
/** Éclat qui vole en morceaux. */
export function playShatter() {
  if (!out()) return;
  noise('highpass', 7000, 2500, { dur: 0.5, gain: 0.45 });
  chimes([3520, 2960, 4186, 2637, 3951], 0.03, 0.4, 0.08);
  osc('sine', 120, 35, { dur: 0.6, gain: 0.55 });
}
/** La faille se déchire ; plus la rareté est haute, plus l'accord monte et dure. */
export function playRiftOpen(order: number) {
  if (!out()) return;
  noise('bandpass', 300, 3000, { dur: 0.9, gain: 0.35, attack: 0.5 }, 0.8);
  osc('sawtooth', 55, 45, { dur: 1.2, gain: 0.08, attack: 0.3 });
  const chord = order >= 6 ? [220, 277, 330, 440, 554] : order >= 5 ? [262, 330, 392, 523, 659] : order >= 4 ? [233, 294, 349, 466] : [196, 247, 294];
  chord.forEach((f, i) => osc('sine', f, null, { at: 0.35 + i * 0.07, dur: 1.4 + order * 0.15, gain: 0.07 + order * 0.008, attack: 0.15 }));
  if (order >= 5) { gong(0.3, 0.25); sparkle(10, 0.5); }
}
/** L'Héritier franchit la faille. */
export function playEmerge(order: number) {
  if (!out()) return;
  whoosh(300, 1800, 0.45, 0.3);
  chimes(order >= 5 ? [784, 988, 1175, 1568] : [659, 784, 988], 0.07, 0.6, 0.09, 0.2);
}
/** Une carte sort de la faille (invocation ×10). */
export function playCardOut(order: number) {
  if (!out()) return;
  whoosh(800, 2400, 0.12, 0.18);
  if (order >= 4) osc('sine', order >= 5 ? 1046 : 880, null, { at: 0.05, dur: 0.3, gain: 0.08 });
}

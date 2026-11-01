// Effets sonores synthétisés (WebAudio) : aucun fichier à charger, fonctionne hors ligne.
// iOS exige un geste utilisateur pour activer l'audio : unlock() est appelé au premier toucher.

type Sfx = 'tap' | 'back' | 'claim' | 'open' | 'error' | 'rare';
let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.6;

export function audioContext(): AudioContext | null { return ctx; }

export function configureAudio(opts: { enabled: boolean; volume: number }) {
  enabled = opts.enabled;
  volume = opts.volume;
}

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  } catch { ctx = null; }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, at = 0, slideTo?: number) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * volume, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function play(s: Sfx) {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  switch (s) {
    case 'tap': tone(880, 0.06, 'triangle', 0.12); break;
    case 'back': tone(520, 0.07, 'triangle', 0.1, 0, 380); break;
    case 'open': tone(440, 0.12, 'sine', 0.12, 0, 660); break;
    case 'error': tone(180, 0.18, 'square', 0.06); break;
    case 'claim': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.07)); break;
    case 'rare': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'sine', 0.12, i * 0.09)); break;
  }
}

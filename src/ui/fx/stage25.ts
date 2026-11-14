// MISE EN SCÈNE 2,5D (v1.81.0) — couche de particules du combat, dessinée sur un canvas posé sur le terrain.
// Étincelles d'impact, traînées d'arme, poussière des Effacés qui se dissolvent, lueurs de soin, et une
// poussière d'ambiance qui monte doucement. Coordonnées en pixels CSS, relatives au conteneur du combat.

export interface Pt { x: number; y: number }

interface Particle { x: number; y: number; vx: number; vy: number; g: number; drag: number; r: number; life: number; max: number; col: string; alpha: number; amb: boolean; sw?: number }
/** Ambiance d'une région (v1.97.0) : braises qui montent, spores qui flottent, sable qui file, bulles... */
export interface AmbientCfg { vx: [number, number]; vy: [number, number]; r: [number, number]; sway?: number; alpha?: [number, number] }
const DEFAULT_AMB: AmbientCfg = { vx: [-0.008, 0.008], vy: [-0.03, -0.008], r: [0.6, 1.8] };
interface Trace { kind: 'slash' | 'ring'; x: number; y: number; ang: number; r: number; col: string; t: number; dur: number }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
// Halo pré-dessiné par couleur (v1.99.0) : une particule = un seul drawImage, au lieu de deux tracés de cercle.
const SPRITES = new Map<string, HTMLCanvasElement>();
function sprite(col: string): HTMLCanvasElement {
  const key = col;
  let c = SPRITES.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = col; const hex = /^#[0-9a-f]{6}$/i.test(String(g.fillStyle)) ? String(g.fillStyle) : '#ffffff'; // couleur normalisée en #rrggbb
  col = hex;
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.16, col); grd.addColorStop(0.32, col);
  grd.addColorStop(0.36, `${col}40`); grd.addColorStop(1, `${col}00`);
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  SPRITES.set(key, c);
  return c;
}
const TAU = Math.PI * 2;

export class Stage25 {
  private ctx: CanvasRenderingContext2D | null;
  private parts: Particle[] = [];
  private traces: Trace[] = [];
  private raf = 0;
  private last = 0;
  private ambient = 0;
  private w = 0;
  private h = 0;
  private readonly onResize = () => this.resize();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly speed: () => number, private readonly ambientColors: string[], private readonly ambientCount = 22, private readonly amb: AmbientCfg = DEFAULT_AMB) {
    this.ctx = canvas.getContext('2d');
  }

  start() {
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.last = performance.now();
    const loop = (now: number) => { this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.parts = []; this.traces = [];
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1); // les particules n'ont pas besoin de la pleine définition
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Gerbe d'étincelles (impact). */
  burst(p: Pt, col: string, n = 18, spd = 0.32) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), s = rnd(0.06, spd);
      this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.05, g: 0.0007, drag: 0.97, r: rnd(1, 2.4), life: rnd(260, 620), max: 620, col, alpha: 1, amb: false });
    }
  }

  /** Lueurs qui montent (soin, dissolution, apparition). */
  motes(p: Pt, col: string, n = 24, spread = 34, up = 0.06) {
    for (let i = 0; i < n; i++) {
      this.parts.push({ x: p.x + rnd(-spread, spread), y: p.y + rnd(-spread, spread * 0.6), vx: rnd(-0.015, 0.015), vy: -rnd(up * 0.4, up), g: 0, drag: 1, r: rnd(1.2, 3), life: rnd(600, 1400), max: 1400, col, alpha: 1, amb: false });
    }
  }

  /** Tourbillon : des lueurs naissent sur un cercle et sont aspirées vers le centre en spirale (invocation). */
  vortex(c: Pt, col: string, n = 10, radius = 150) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), d = rnd(radius * 0.6, radius), life = rnd(520, 760);
      const sp = d / life; // arrive au centre en fin de vie
      const tx = -Math.sin(a), ty = Math.cos(a); // composante tangentielle : spirale
      this.parts.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, vx: -Math.cos(a) * sp + tx * sp * 0.45, vy: -Math.sin(a) * sp + ty * sp * 0.45, g: 0, drag: 1, r: rnd(0.7, 1.7), life, max: life, col, alpha: 0.9, amb: false });
    }
  }

  /** Braises qui montent d'une zone (faille ouverte, aura d'un héros). */
  embers(c: Pt, col: string, n = 6, w = 60, h = 20) {
    for (let i = 0; i < n; i++) {
      this.parts.push({ x: c.x + rnd(-w, w), y: c.y + rnd(-h, h), vx: rnd(-0.02, 0.02), vy: -rnd(0.04, 0.12), g: 0, drag: 0.999, r: rnd(0.8, 2.2), life: rnd(900, 1800), max: 1800, col, alpha: rnd(0.6, 1), amb: false });
    }
  }

  /** Traînée d'arme en arc, centrée sur la cible. */
  slash(p: Pt, col: string, ang = -0.7, r = 44) {
    this.traces.push({ kind: 'slash', x: p.x - Math.cos(ang) * r, y: p.y - Math.sin(ang) * r, ang, r, col, t: 0, dur: 300 });
  }

  /** Onde au sol (ellipse aplatie). */
  ring(p: Pt, col: string, r = 80, dur = 520) {
    this.traces.push({ kind: 'ring', x: p.x, y: p.y, ang: 0, r, col, t: 0, dur });
  }

  private frame(now: number) {
    const ctx = this.ctx; if (!ctx) return;
    const raw = Math.min(50, now - this.last); this.last = now;
    const dt = raw * Math.max(1, this.speed());
    ctx.clearRect(0, 0, this.w, this.h);
    while (this.ambient < this.ambientCount && this.w > 0) {
      const col = this.ambientColors[Math.floor(Math.random() * this.ambientColors.length)] ?? '#b98cff';
      const m = this.amb, al = m.alpha ?? [0.25, 0.55];
      this.parts.push({ x: rnd(0, this.w), y: rnd(this.h * 0.05, this.h * 1.05), vx: rnd(m.vx[0], m.vx[1]), vy: rnd(m.vy[0], m.vy[1]), g: 0, drag: 1, r: rnd(m.r[0], m.r[1]), life: rnd(3000, 8000), max: 8000, col, alpha: rnd(al[0], al[1]), amb: true, sw: m.sway ? rnd(0.5, 1) * m.sway : 0 });
      this.ambient++;
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      const st = p.amb ? raw : dt; // l'ambiance garde son rythme, même en accéléré
      p.life -= st;
      if (p.life <= 0) { this.parts.splice(i, 1); if (p.amb) this.ambient--; continue; }
      p.vy += p.g * st; p.x += p.vx * st + (p.sw ? Math.sin(p.life / 520) * p.sw * st : 0); p.y += p.vy * st; p.vx *= p.drag; p.vy *= p.drag;
      const a = Math.min(1, (p.life / p.max) * 2) * p.alpha;
      const R = p.r * 3.2;
      ctx.globalAlpha = a; ctx.drawImage(sprite(p.col), p.x - R, p.y - R, R * 2, R * 2);
    }
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const f = this.traces[i]; f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      ctx.lineCap = 'round';
      if (f.kind === 'slash') {
        const e = 1 - Math.pow(1 - Math.min(1, k * 1.7), 3), a0 = f.ang - 1, a1 = a0 + 2 * e;
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 13 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, a0, a1); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * (1 - k) + 0.5;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, Math.max(a0, a1 - 0.9), a1); ctx.stroke();
      } else {
        const r = f.r * (1 - Math.pow(1 - k, 3));
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 7 * (1 - k) + 1;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.36, 0, 0, TAU); ctx.stroke();
      }
      if (f.t >= f.dur) this.traces.splice(i, 1);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}

import { dayKey } from '../core/time';

// STATISTIQUES DE JEU ANONYMES (v1.101.0) — pour savoir où les joueurs bloquent et équilibrer le jeu.
// Ce qui est compté, pour la journée de jeu : combats gagnés/perdus par mode, défaites par niveau de campagne
// et par étage de Tour, invocations, sessions, minutes de jeu, niveau de compte et progression atteinte.
// Ce qui ne l'est JAMAIS : nom, e-mail, compte, héros possédés, sauvegarde. L'identifiant est tiré au hasard
// chaque jour : deux journées d'un même joueur ne peuvent pas être reliées. Désactivable dans les Paramètres.

export interface DayStats {
  day: string;
  /** Identifiant aléatoire du jour (12 caractères). */
  id: string;
  v: string;
  lvl: number;
  /** Progression : dernier niveau de campagne normal gagné (chapitre × 100 + niveau). */
  ch: number;
  tower: number;
  /** Combats : `${mode}_w` / `${mode}_l` → nombre. */
  bat: Record<string, number>;
  /** Défaites : `c3-4` (campagne normal), `t70` (Tour) → nombre. 40 entrées au plus. */
  def: Record<string, number>;
  sum: number;
  ses: number;
  min: number;
}

export const STATS_DEF_MAX = 40;
const KEY = 'aeonfall.stats';
const rid = () => Array.from({ length: 12 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
const clampInt = (n: number, max = 100000) => Math.max(0, Math.min(max, Math.round(n)));

export function emptyDay(day: string, v: string): DayStats {
  return { day, id: rid(), v, lvl: 0, ch: 0, tower: 0, bat: {}, def: {}, sum: 0, ses: 0, min: 0 };
}

/** Journée en cours (une nouvelle, avec un nouvel identifiant, dès que le jour de jeu change). */
export function currentDay(prev: DayStats | null, now: number, v: string): DayStats {
  const day = dayKey(now);
  return prev && prev.day === day ? prev : emptyDay(day, v);
}

export type StatEvent =
  | { kind: 'battle'; mode: string; won: boolean; stage?: string; floor?: number }
  | { kind: 'summon'; n: number }
  | { kind: 'session' }
  | { kind: 'minute' }
  | { kind: 'progress'; lvl: number; ch: number; tower: number };

/** Ajoute un événement à la journée (fonction pure, testée). */
export function addEvent(d: DayStats, e: StatEvent): DayStats {
  const x: DayStats = { ...d, bat: { ...d.bat }, def: { ...d.def } };
  if (e.kind === 'battle') {
    const k = `${e.mode.replace(/[^a-z]/gi, '').slice(0, 12)}_${e.won ? 'w' : 'l'}`;
    x.bat[k] = clampInt((x.bat[k] ?? 0) + 1);
    if (!e.won) {
      const dk = e.mode === 'campaign' && e.stage ? `c${e.stage}` : e.mode === 'tower' && e.floor ? `t${e.floor}` : null;
      if (dk && (dk in x.def || Object.keys(x.def).length < STATS_DEF_MAX)) x.def[dk] = clampInt((x.def[dk] ?? 0) + 1);
    }
  } else if (e.kind === 'summon') x.sum = clampInt(x.sum + e.n);
  else if (e.kind === 'session') x.ses = clampInt(x.ses + 1, 500);
  else if (e.kind === 'minute') x.min = clampInt(x.min + 1, 1440);
  else { x.lvl = clampInt(e.lvl, 1000); x.ch = clampInt(e.ch, 10000); x.tower = clampInt(e.tower, 1000); }
  return x;
}

// ─── Stockage sur l'appareil (hors sauvegarde : rien n'est synchronisé avec le compte) ───
export function loadDay(): DayStats | null { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) as DayStats : null; } catch { return null; } }
export function storeDay(d: DayStats) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* */ } }

// ─── Lecture (modérateurs) : synthèse de plusieurs journées ───
export interface StatsSummary {
  days: number;
  minutesAvg: number;
  sessionsAvg: number;
  summons: number;
  modes: { mode: string; won: number; lost: number }[];
  stuck: { where: string; count: number }[];
  levels: { lvl: string; count: number }[];
}
export function summarize(list: Pick<DayStats, 'bat' | 'def' | 'sum' | 'ses' | 'min' | 'lvl'>[]): StatsSummary {
  const modes = new Map<string, { won: number; lost: number }>();
  const stuck = new Map<string, number>();
  const lv = new Map<string, number>();
  let min = 0, ses = 0, sum = 0;
  for (const d of list) {
    min += d.min ?? 0; ses += d.ses ?? 0; sum += d.sum ?? 0;
    for (const [k, n] of Object.entries(d.bat ?? {})) { const [m, r] = k.split('_'); const o = modes.get(m) ?? { won: 0, lost: 0 }; if (r === 'w') o.won += n; else o.lost += n; modes.set(m, o); }
    for (const [k, n] of Object.entries(d.def ?? {})) stuck.set(k, (stuck.get(k) ?? 0) + n);
    const b = d.lvl >= 60 ? '60+' : d.lvl >= 40 ? '40-59' : d.lvl >= 20 ? '20-39' : d.lvl >= 10 ? '10-19' : '1-9';
    lv.set(b, (lv.get(b) ?? 0) + 1);
  }
  const n = Math.max(1, list.length);
  return {
    days: list.length, minutesAvg: Math.round(min / n), sessionsAvg: Math.round((ses / n) * 10) / 10, summons: sum,
    modes: [...modes.entries()].map(([mode, o]) => ({ mode, ...o })).sort((a, b) => b.won + b.lost - a.won - a.lost),
    stuck: [...stuck.entries()].map(([k, count]) => ({ where: k.startsWith('c') ? `Campagne ${k.slice(1)}` : `Tour ${k.slice(1)}`, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    levels: ['1-9', '10-19', '20-39', '40-59', '60+'].map((l) => ({ lvl: l, count: lv.get(l) ?? 0 })),
  };
}

import { MINE, TRAINING } from '../data/buildings';
import type { SaveData } from '../save/schema';
import { addHeroXp, heroXpToNext } from './progression';
import { maxLevelForRank } from './stats';

const HOUR = 3600_000;

// ─── Mine ───
export const mineRate = (s: SaveData) => MINE.rate[Math.min(MINE.maxLevel, Math.max(1, s.buildings.mineLevel))];
export const mineCap = (s: SaveData) => mineRate(s) * MINE.capHours;
/** Diamants prêts à récolter. */
export function mineReady(s: SaveData, now: number): number {
  return Math.min(mineCap(s), Math.floor((Math.max(0, now - s.buildings.mineSince) / HOUR) * mineRate(s)));
}
/** Récolte la Mine (mutation) ; la fraction d'heure entamée est conservée, sauf si la réserve était pleine. */
export function collectMine(s: SaveData, now: number): number {
  const n = mineReady(s, now);
  if (n >= mineCap(s)) s.buildings.mineSince = now;
  else s.buildings.mineSince += (n * HOUR) / mineRate(s);
  s.resources.diamonds = (s.resources.diamonds ?? 0) + n;
  return n;
}
export const mineUpgradeCost = (s: SaveData): number | null => (s.buildings.mineLevel >= MINE.maxLevel ? null : MINE.upgradeCost[s.buildings.mineLevel + 1]);
export function upgradeMine(s: SaveData, now: number): { ok: boolean; reason?: string } {
  const cost = mineUpgradeCost(s);
  if (cost === null) return { ok: false, reason: 'La Mine est déjà au niveau maximum.' };
  collectMine(s, now);
  if ((s.resources.diamonds ?? 0) < cost) return { ok: false, reason: `Il faut ${cost} diamants.` };
  s.resources.diamonds -= cost;
  s.buildings.mineLevel += 1;
  return { ok: true };
}

// ─── Terrain d'entraînement ───
// v1.82.3 : l'expérience est donnée automatiquement aux héros placés, en continu (horloge du jeu) et au retour
// dans le jeu pour le temps passé dehors : plus besoin de passer au Terrain pour la récupérer, et plus de plafond.
/** Expérience accumulée et pas encore donnée pour la place i. */
export function trainPending(s: SaveData, i: number, now: number): number {
  const t = s.buildings.train[i];
  const h = t && s.heroes.find((x) => x.uid === t.uid);
  if (!t || !h || h.level >= maxLevelForRank(h.rank)) return 0;
  const hours = Math.max(0, now - t.since) / HOUR;
  return Math.floor(hours * TRAINING.xpPctPerHour * heroXpToNext(h.level));
}
export const trainXpPerHour = (lv: number) => Math.max(1, Math.round(TRAINING.xpPctPerHour * heroXpToNext(lv)));
/** Au moins une minute entre deux versements, pour ne pas réécrire la sauvegarde à chaque seconde. */
const TRAIN_STEP = 60_000;
/** Vrai si l'un des héros placés a de l'expérience à recevoir. */
export function trainDue(s: SaveData, now: number): boolean {
  return s.buildings.train.some((t, i) => !!t && (!s.heroes.some((h) => h.uid === t.uid) || (now - t.since >= TRAIN_STEP && trainPending(s, i, now) > 0)));
}
/** Donne l'expérience accumulée à chaque héros placé (mutation). La fraction pas encore gagnée est gardée
 *  (le compteur n'avance que du temps « payé »). Les héros retirés de la partie libèrent leur place. */
export function collectTraining(s: SaveData, now: number): { uid: string; xp: number; levels: number }[] {
  const out: { uid: string; xp: number; levels: number }[] = [];
  s.buildings.train = s.buildings.train.map((t) => (t && s.heroes.some((h) => h.uid === t.uid) ? t : null));
  s.buildings.train.forEach((t, i) => {
    if (!t) return;
    const h = s.heroes.find((x) => x.uid === t.uid)!;
    if (h.level >= maxLevelForRank(h.rank)) { t.since = now; return; }
    const xp = trainPending(s, i, now);
    if (xp <= 0) return;
    const perHour = TRAINING.xpPctPerHour * heroXpToNext(h.level);
    t.since = Math.min(now, t.since + (xp / perHour) * HOUR);
    const r = addHeroXp(h, xp);
    out.push({ uid: h.uid, xp, levels: r.gained });
  });
  return out;
}
export function placeTrainee(s: SaveData, i: number, uid: string | null, now: number): { ok: boolean; reason?: string } {
  if (i < 0 || i >= s.buildings.trainSlots) return { ok: false, reason: 'Cette place n’est pas encore ouverte.' };
  if (uid && !s.heroes.some((h) => h.uid === uid)) return { ok: false, reason: 'Héros introuvable.' };
  collectTraining(s, now);
  if (uid) s.buildings.train = s.buildings.train.map((t) => (t?.uid === uid ? null : t));
  s.buildings.train[i] = uid ? { uid, since: now } : null;
  return { ok: true };
}
export const trainSlotCost = (s: SaveData): number | null => (s.buildings.trainSlots >= TRAINING.slots ? null : TRAINING.slotCost[s.buildings.trainSlots]);
export function unlockTrainSlot(s: SaveData): { ok: boolean; reason?: string } {
  const cost = trainSlotCost(s);
  if (cost === null) return { ok: false, reason: 'Toutes les places sont ouvertes.' };
  if ((s.resources.diamonds ?? 0) < cost) return { ok: false, reason: `Il faut ${cost} diamants.` };
  s.resources.diamonds -= cost;
  s.buildings.trainSlots += 1;
  return { ok: true };
}
/** Pastille de l'accueil : la Mine a 8 h de production en réserve. */
export const buildingsDot = (s: SaveData, now: number) => mineReady(s, now) >= mineRate(s) * 8;

import { HERO_BY_ID } from '../data/heroes';
import { HEROES } from '../data/heroes';
import type { HeroInstance, SaveData } from '../save/schema';
import { gearBonus, type GearBonus } from './gear';
import { track } from './missions';

// DOUBLONS — un héros déjà possédé, obtenu par invocation (ou en récompense), devient une copie.
// Chaque copie sert à UNE chose, au choix du joueur :
//  • l'éveil du héros (au Sanctuaire) ;
//  • le lien de sa famille : +1 % PV, ATQ et DÉF pour tous les héros de cette famille ;
//  • le lien de son affinité : +1 % PV, ATQ et DÉF pour tous les héros de cette affinité.

export const BOND_MAX = 10;
export const BOND_PCT = 1;
export type BondKind = 'faction' | 'affinity';

export const copiesOf = (s: SaveData, heroId: string) => s.heroCopies?.[heroId] ?? 0;
export function addCopy(s: SaveData, heroId: string, n = 1) { s.heroCopies[heroId] = copiesOf(s, heroId) + n; }

export const bondKey = (heroId: string, kind: BondKind) => (kind === 'faction' ? HERO_BY_ID[heroId].faction : HERO_BY_ID[heroId].affinity);
export const bondLevel = (s: SaveData, kind: BondKind, key: string) => s.bonds?.[kind]?.[key] ?? 0;
/** Héros (de tout le jeu) concernés par un lien. */
export const bondMembers = (kind: BondKind, key: string) => HEROES.filter((h) => (kind === 'faction' ? h.faction : h.affinity) === key);

/** Bonus en % (PV, ATQ, DÉF) qu'un héros reçoit de ses deux liens. */
export function bondPct(s: SaveData, heroId: string): number {
  const d = HERO_BY_ID[heroId];
  if (!d) return 0;
  return (bondLevel(s, 'faction', d.faction) + bondLevel(s, 'affinity', d.affinity)) * BOND_PCT;
}

export function giveCopyCheck(s: SaveData, heroId: string, kind: BondKind): { ok: boolean; reason?: string } {
  if (copiesOf(s, heroId) < 1) return { ok: false, reason: 'Aucun doublon de ce héros.' };
  if (bondLevel(s, kind, bondKey(heroId, kind)) >= BOND_MAX) return { ok: false, reason: 'Lien au niveau maximal.' };
  return { ok: true };
}
/** Offre une copie à un lien (mutation). */
export function giveCopy(s: SaveData, heroId: string, kind: BondKind): boolean {
  if (!giveCopyCheck(s, heroId, kind).ok) return false;
  s.heroCopies[heroId] -= 1;
  const key = bondKey(heroId, kind);
  s.bonds[kind][key] = bondLevel(s, kind, key) + 1;
  track(s, 'heroUpgrade');
  return true;
}

/** Bonus total d'un héros : équipement + liens. Utilisé partout (fiche, combat, puissance). */
export function heroBonus(s: SaveData, h: HeroInstance): GearBonus {
  const b = gearBonus(s.equipment.filter((g) => g.heroUid === h.uid));
  const p = bondPct(s, h.heroId);
  if (!p) return b;
  return { ...b, pct: { ...b.pct, hp: b.pct.hp + p, atk: b.pct.atk + p, def: b.pct.def + p } };
}

/** Nombre total de copies en attente (pour la pastille « à utiliser »). */
export const pendingCopies = (s: SaveData) => s.heroes.reduce((n, h) => n + (copiesOf(s, h.heroId) > 0 ? 1 : 0), 0);

import { HERO_BY_ID } from '../../data/heroes';
import { FACTION_LIST } from '../../data/factions';
import { RARITIES, RARITY_LIST } from '../../data/rarities';
import { ROLE_LIST } from '../../data/roles';
import { AFFINITIES } from '../../data/affinities';
import { powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';
import type { HeroDef } from '../../data/types';
import type { HeroInstance, SaveData } from '../../save/schema';
import { FactionEmblem } from '../art/FactionEmblem';
import { matches, type FilterGroup, type Filters, type Option } from './ListControls';

// Tri et filtres des héros, partagés par l'écran Héros et le choix d'un héros pour une équipe.
export const HERO_SORTS: Option[] = [
  { id: 'power', label: 'Puissance' },
  { id: 'rarity', label: 'Rareté' },
  { id: 'level', label: 'Niveau' },
  { id: 'name', label: 'Nom (A → Z)' },
];

export const HERO_GROUPS: FilterGroup[] = [
  { id: 'faction', label: 'Faction', options: FACTION_LIST.map((f) => ({ id: f.id, label: f.short, icon: <FactionEmblem id={f.id} size={16} /> })) },
  { id: 'role', label: 'Rôle', options: ROLE_LIST.map((r) => ({ id: r.id, label: r.name })) },
  { id: 'rarity', label: 'Rareté', options: [...RARITY_LIST].reverse().map((r) => ({ id: r.id, label: r.name, color: r.color })) },
  { id: 'affinity', label: 'Affinité', options: Object.values(AFFINITIES).map((a) => ({ id: a.id, label: a.name, color: a.color })) },
];

export const heroMatches = (f: Filters, d: HeroDef) =>
  matches(f, 'faction', d.faction) && matches(f, 'role', d.role) && matches(f, 'rarity', d.rarity) && matches(f, 'affinity', d.affinity);

export function sortHeroes(save: SaveData, list: HeroInstance[], f: Filters, sort: string) {
  const rows = list.map((h) => ({ h, d: HERO_BY_ID[h.heroId], p: powerOf(heroTotalStats(save, h).total) })).filter((x) => heroMatches(f, x.d));
  const by: Record<string, (a: typeof rows[0], b: typeof rows[0]) => number> = {
    rarity: (a, b) => RARITIES[b.d.rarity].order - RARITIES[a.d.rarity].order || b.p - a.p,
    level: (a, b) => b.h.level - a.h.level || b.p - a.p,
    power: (a, b) => b.p - a.p,
    name: (a, b) => a.d.name.localeCompare(b.d.name, 'fr'),
  };
  return rows.sort(by[sort] ?? by.power);
}

import type { SaveData, TeamPreset } from '../save/schema';
import type { UnitSetup } from './battle/types';
import type { Route } from '../state/ui';
import { HERO_BY_ID } from '../data/heroes';
import { ENEMIES } from '../data/enemies';
import { AFFINITIES } from '../data/affinities';
import { SLOTS } from '../data/equipment';
import type { AffinityId } from '../data/types';
import { maxLevelForRank } from './stats';
import { rankUpCheck } from './upgrade';
import { isUnlocked } from './unlocks';

// CONSEILS APRÈS UNE DÉFAITE (v1.90.0, audit UX-6) — trois pistes concrètes, chacune avec un bouton qui y mène.
export interface Tip { text: string; route: Route; label: string }

export function defeatTips(s: SaveData, team: TeamPreset, waves: UnitSetup[][]): Tip[] {
  const tips: Tip[] = [];
  const heroes = team.slots.map((u) => s.heroes.find((h) => h.uid === u)).filter((h): h is NonNullable<typeof h> => !!h);
  if (!heroes.length) return [{ text: 'Ton équipe est vide.', route: { name: 'team' }, label: 'Équipe' }];
  // 1. Affinité : aucun héros avantagé contre les ennemis les plus nombreux.
  const count: Partial<Record<AffinityId, number>> = {};
  for (const w of waves) for (const e of w) { const a = e.kind === 'enemy' ? ENEMIES[e.refId]?.affinity : HERO_BY_ID[e.refId]?.affinity; if (a) count[a] = (count[a] ?? 0) + 1; }
  const main = (Object.entries(count) as [AffinityId, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  const counter = main && (Object.keys(AFFINITIES) as AffinityId[]).find((a) => AFFINITIES[a].strongAgainst === main);
  if (counter && !heroes.some((h) => HERO_BY_ID[h.heroId].affinity === counter))
    tips.push({ text: `Les ennemis sont surtout ${AFFINITIES[main].name}s : ajoute un héros ${AFFINITIES[counter].name} (il frappe 30 % plus fort et brise vite la Fracture des boss).`, route: { name: 'team' }, label: 'Équipe' });
  // 2. Rang : un héros peut monter de rang (et donc de niveau).
  const rankable = heroes.find((h) => rankUpCheck(s, h).ok);
  if (rankable) tips.push({ text: `${HERO_BY_ID[rankable.heroId].name.split(' ')[0]} peut monter de rang : son niveau maximum augmente.`, route: { name: 'sanctuary', uid: rankable.uid, tab: 'rank' }, label: 'Sanctuaire' });
  // 3. Niveau : le héros le plus faible est loin de son maximum.
  const weakest = [...heroes].sort((a, b) => a.level - b.level)[0];
  const cap = maxLevelForRank(weakest.rank);
  // v1.110.0 (test « joueur pressé ») : sans élixir, le bouton mène là où on en gagne (Grotte d'Ambre), pas au Sanctuaire vide.
  const dungeons = isUnlocked(s, 'dungeons');
  if (weakest.level < cap) {
    if (s.resources.xpElixir > 0 || !dungeons) tips.push({ text: `${HERO_BY_ID[weakest.heroId].name.split(' ')[0]} est niveau ${weakest.level}/${cap}.`, route: { name: 'sanctuary', uid: weakest.uid }, label: 'Sanctuaire' });
    else tips.push({ text: `${HERO_BY_ID[weakest.heroId].name.split(' ')[0]} est niveau ${weakest.level}/${cap} et tu n’as plus d’élixir : la Grotte d’Ambre en donne.`, route: { name: 'dungeon', dungeonId: 'amber' }, label: 'Grotte' });
  }
  // 4. Équipement : emplacements vides. Si le sac n'a rien pour les remplir, le bouton mène aux Donjons (source d'équipement).
  const empty = heroes.reduce((a, h) => a + SLOTS.length - s.equipment.filter((g) => g.heroUid === h.uid).length, 0);
  // Un objet libre ne compte que s'il va dans un emplacement vide d'un héros de l'équipe.
  const emptySlots = new Set(heroes.flatMap((h) => SLOTS.filter((sl) => !s.equipment.some((g) => g.heroUid === h.uid && g.slot === sl.id)).map((sl) => sl.id)));
  const spare = s.equipment.some((g) => !g.heroUid && emptySlots.has(g.slot));
  if (empty > 0 && spare) tips.push({ text: `${empty} emplacement${empty > 1 ? 's' : ''} d’équipement vide${empty > 1 ? 's' : ''} dans ton équipe.`, route: { name: 'hero', heroId: weakest.heroId, uid: weakest.uid }, label: 'Équiper' });
  else if (empty > 0 && dungeons) tips.push({ text: `${empty} emplacement${empty > 1 ? 's' : ''} d’équipement vide${empty > 1 ? 's' : ''} et rien dans le sac : les Donjons d’équipement en donnent à chaque victoire.`, route: { name: 'dungeons' }, label: 'Donjons' });
  return tips.slice(0, 3);
}

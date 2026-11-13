import type { FactionId, AffinityId } from './types';
import type { Reward } from './resources';

// LES FAILLES (v1.93.0, audit — mode signature) — une expédition hebdomadaire de 10 salles dans une faille.
// À chaque salle, le joueur choisit sa route : combat, élite (plus dur, une relique), autel (une relique au choix
// parmi trois) ou repos. Les PV de l'équipe sont conservés d'un combat à l'autre ; un héros tombé le reste.
// La 10ᵉ salle abrite le Gardien de la faille. Une tentative par semaine ; les reliques changent la donne.
export const RIFT_ROOMS = 10;
export type RiftNodeKind = 'fight' | 'elite' | 'altar' | 'rest' | 'boss';
export const RIFT_NODE: Record<RiftNodeKind, { name: string; text: string }> = {
  fight: { name: 'Combat', text: 'Des Effacés gardent le passage.' },
  elite: { name: 'Élite', text: 'Plus dangereux : une relique au choix en récompense.' },
  altar: { name: 'Autel d’époque', text: 'Choisis une relique parmi trois.' },
  rest: { name: 'Halte', text: 'L’équipe récupère 35 % de ses PV ; les héros tombés se relèvent avec 20 %.' },
  boss: { name: 'Gardien de la faille', text: 'Le combat final.' },
};

export type RelicEffect =
  | { kind: 'pct'; stat: 'hp' | 'atk' | 'def' | 'spd'; value: number; faction?: FactionId; affinity?: AffinityId }
  | { kind: 'leech'; value: number } | { kind: 'regen'; value: number } | { kind: 'startTm'; value: number };
export interface Relic { id: string; name: string; text: string; effect: RelicEffect }

export const RELICS: Relic[] = [
  { id: 'blade', name: 'Lame d’une autre époque', text: '+15 % d’ATQ pour toute l’équipe.', effect: { kind: 'pct', stat: 'atk', value: 0.15 } },
  { id: 'heart', name: 'Cœur recousu', text: '+20 % de PV pour toute l’équipe.', effect: { kind: 'pct', stat: 'hp', value: 0.2 } },
  { id: 'scales', name: 'Écailles du temps', text: '+20 % de DÉF pour toute l’équipe.', effect: { kind: 'pct', stat: 'def', value: 0.2 } },
  { id: 'hourglass', name: 'Sablier fêlé', text: '+8 % de VIT pour toute l’équipe.', effect: { kind: 'pct', stat: 'spd', value: 0.08 } },
  { id: 'thirst', name: 'Soif d’Aeon', text: 'Chaque coup rend 12 % des dégâts infligés.', effect: { kind: 'leech', value: 0.12 } },
  { id: 'sap', name: 'Sève éternelle', text: 'Chaque héros récupère 4 % de ses PV à chacun de ses tours.', effect: { kind: 'regen', value: 4 } },
  { id: 'dawn', name: 'Aube précoce', text: 'Toute l’équipe commence avec 25 % de jauge de tour.', effect: { kind: 'startTm', value: 25 } },
  { id: 'f_valcrest', name: 'Bannière de Valcrest', text: 'Héros de Valcrest : +30 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.3, faction: 'valcrest' } },
  { id: 'f_prism', name: 'Fragment du Prisme', text: 'Héros du Prisme : +30 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.3, faction: 'prism' } },
  { id: 'f_ash', name: 'Braise de la Fosse', text: 'Héros de Cendre : +30 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.3, faction: 'ash' } },
  { id: 'f_sylvaran', name: 'Graine sylvane', text: 'Héros sylvans : +30 % de PV.', effect: { kind: 'pct', stat: 'hp', value: 0.3, faction: 'sylvaran' } },
  { id: 'f_astral', name: 'Étoile morte', text: 'Héros astraux : +30 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.3, faction: 'astral' } },
  { id: 'f_akkar', name: 'Sable d’Akkar', text: 'Héros d’Akkar : +30 % de DÉF.', effect: { kind: 'pct', stat: 'def', value: 0.3, faction: 'akkar' } },
  { id: 'a_solar', name: 'Éclat solaire', text: 'Héros solaires : +25 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.25, affinity: 'solar' } },
  { id: 'a_lunar', name: 'Larme lunaire', text: 'Héros lunaires : +25 % d’ATQ.', effect: { kind: 'pct', stat: 'atk', value: 0.25, affinity: 'lunar' } },
  { id: 'a_telluric', name: 'Pierre tellurique', text: 'Héros telluriques : +25 % de PV.', effect: { kind: 'pct', stat: 'hp', value: 0.25, affinity: 'telluric' } },
];
export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

/** Récompense d'une salle gagnée (une seule tentative par semaine). */
export function riftReward(kind: RiftNodeKind, room: number): Reward {
  if (kind === 'boss') return { crystals: 200, shardEpic: 1, awakenEssence: 1, gold: 30000 };
  if (kind === 'elite') return { crystals: 40, gold: 6000 + room * 600 };
  return { crystals: 15, gold: 3000 + room * 400 };
}

import { HERO_BY_ID } from '../data/heroes';
import { DUPLICATE_FRAGMENTS } from '../data/summons';
import { createNewSave, SAVE_VERSION, type SaveData } from './schema';

// MIGRATIONS
// Chaque entrée transforme une sauvegarde de la version N vers N+1. On ne supprime jamais une migration :
// une sauvegarde très ancienne passe par toutes les étapes successives.
// Exemple pour la future v2 :  2: (s) => ({ ...s, inventory: { equipment: [] } }),
type Migration = (s: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // v2 (phase 3) : inventaire d'équipement et compteurs d'invocation.
  2: (s) => ({ ...s, equipment: Array.isArray(s.equipment) ? s.equipment : [], summons: s.summons ?? { pity: {}, total: 0, history: [] } }),
  // v3 (phase 4) : missions, arène, boss mondial, événements. Les valeurs par défaut sont complétées ensuite.
  3: (s) => ({ ...s, achievements: Array.isArray(s.achievements) ? s.achievements : [] }),
  // v4 : les fragments de héros deviennent des copies (doublons) ; arrondi au supérieur pour ne rien perdre.
  4: (s) => {
    const copies: Record<string, number> = { ...(s.heroCopies ?? {}) };
    for (const [id, n] of Object.entries((s.heroFragments ?? {}) as Record<string, number>)) {
      const d = HERO_BY_ID[id];
      if (!d || !n || n <= 0) continue;
      copies[id] = (copies[id] ?? 0) + Math.max(1, Math.ceil(n / DUPLICATE_FRAGMENTS[d.rarity]));
    }
    const { heroFragments: _old, ...rest } = s; void _old;
    return { ...rest, heroCopies: copies, bonds: s.bonds ?? { faction: {}, affinity: {} } };
  },
  // v5 : étoiles sur l'équipement ; un ancien objet reçoit autant d'étoiles que son rang de rareté (même puissance qu'avant).
  5: (s) => ({ ...s, equipment: (s.equipment ?? []).map((g: { rarity: string; stars?: number }) => ({ ...g, stars: g.stars ?? ({ common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 } as Record<string, number>)[g.rarity] ?? 1 })) }),
  // v6 : l'invocation primordiale est retirée ; chaque éclat primordial devient 300 cristaux (une invocation épique).
  6: (s) => {
    const r = { ...(s.resources ?? {}) };
    const n = Math.max(0, Number(r.shardPrimal) || 0);
    r.crystals = (Number(r.crystals) || 0) + n * 300; r.shardPrimal = 0;
    return { ...s, resources: r };
  },
};

export class SaveFormatError extends Error {}

/** Fusion profonde : complète les champs manquants d'une sauvegarde avec les valeurs par défaut. */
function fillDefaults(target: any, defaults: any): any {
  if (Array.isArray(defaults)) return Array.isArray(target) ? target : defaults;
  if (defaults && typeof defaults === 'object') {
    const out: any = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {};
    for (const k of Object.keys(defaults)) out[k] = k in out ? fillDefaults(out[k], defaults[k]) : defaults[k];
    return out;
  }
  if (target === undefined) return defaults;
  // Valeur par défaut nulle (champ optionnel, ex. dernière connexion) : on garde la valeur existante.
  if (defaults === null) return target;
  return target === null || typeof target !== typeof defaults ? defaults : target;
}

/** Valide, migre et normalise une sauvegarde brute. Lève SaveFormatError si elle est inutilisable. */
export function migrateSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') throw new SaveFormatError('Sauvegarde vide ou illisible.');
  let s: any = raw;
  if (typeof s.version !== 'number' || s.version < 1) throw new SaveFormatError('Version de sauvegarde inconnue.');
  if (s.version > SAVE_VERSION) throw new SaveFormatError(`Cette sauvegarde provient d'une version plus récente du jeu (v${s.version}). Mets le jeu à jour.`);
  if (!Array.isArray(s.heroes)) throw new SaveFormatError('Liste de héros manquante.');
  while (s.version < SAVE_VERSION) {
    const m = MIGRATIONS[s.version + 1];
    if (!m) throw new SaveFormatError(`Migration manquante vers v${s.version + 1}.`);
    s = m(s);
    s.version += 1;
  }
  const defaults = createNewSave(typeof s.createdAt === 'number' ? s.createdAt : Date.now());
  // Les listes « métier » ne sont pas remplacées par les valeurs par défaut :
  const merged: SaveData = fillDefaults({ ...s, heroes: s.heroes, teams: s.teams ?? defaults.teams }, defaults);
  // Données devenues inutiles (anciens fragments de héros, ancien réglage de visuel) : retirées des sauvegardes.
  delete (merged as { heroFragments?: unknown }).heroFragments;
  delete (merged.settings as { theme?: unknown }).theme;
  merged.equipment = (merged.equipment ?? []).map((g) => (g.heroUid && !s.heroes.some((h: { uid: string }) => h.uid === g.heroUid) ? { ...g, heroUid: null } : g));
  // Nettoyage : héros dont la définition n'existe plus (contenu retiré) et équipes pointant vers des héros absents.
  merged.heroes = merged.heroes.filter((h) => h && HERO_BY_ID[h.heroId]);
  const uids = new Set(merged.heroes.map((h) => h.uid));
  merged.teams = merged.teams.map((t) => ({
    ...t,
    slots: Array.from({ length: 5 }, (_, i) => (t.slots?.[i] && uids.has(t.slots[i]!) ? t.slots[i] : null)),
    leader: t.leader && uids.has(t.leader) ? t.leader : null,
  }));
  if (!merged.teams.some((t) => t.id === merged.activeTeamId)) merged.activeTeamId = merged.teams[0]?.id ?? defaults.activeTeamId;
  return merged;
}

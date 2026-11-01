import { HERO_BY_ID } from '../data/heroes';
import { createNewSave, SAVE_VERSION, type SaveData } from './schema';

// MIGRATIONS
// Chaque entrée transforme une sauvegarde de la version N vers N+1. On ne supprime jamais une migration :
// une sauvegarde très ancienne passe par toutes les étapes successives.
// Exemple pour la future v2 :  2: (s) => ({ ...s, inventory: { equipment: [] } }),
type Migration = (s: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // 2: (s) => { ... return s; },
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
  if (s.version > SAVE_VERSION) throw new SaveFormatError(`Cette sauvegarde provient d'une version plus récente du jeu (v${s.version}). Mettez le jeu à jour.`);
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

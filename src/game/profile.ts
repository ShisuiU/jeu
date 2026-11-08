import type { SaveData } from '../save/schema';
import { hasProfanity } from './moderation';

// NOM DU JOUEUR — obligatoire : il apparaît dans l'histoire, les classements, l'Arène, les clans et chez les amis.
// Les noms par défaut (« Lien », « Héritier »…) ne sont pas acceptés : chacun doit choisir le sien.
export const NAME_MIN = 3;
export const NAME_MAX = 18;
const DEFAULTS = ['lien', 'heritier', 'joueur', 'player', 'test', 'aeonfall'];
const plain = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Raison du refus, ou null si le nom convient. */
export function nameError(raw: string): string | null {
  const n = raw.trim();
  if (n.length < NAME_MIN) return `Au moins ${NAME_MIN} caractères.`;
  if (n.length > NAME_MAX) return `${NAME_MAX} caractères au plus.`;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '’._-]*$/u.test(n)) return 'Lettres, chiffres, espaces, apostrophes, points et tirets seulement.';
  if (DEFAULTS.includes(plain(n))) return 'Choisis un nom à toi.';
  if (hasProfanity(n)) return 'Ce nom n’est pas autorisé.';
  return null;
}
/** Le joueur doit-il (encore) choisir un nom ? */
export const needsName = (s: SaveData) => nameError(s.profile.name ?? '') !== null;
export const cleanName = (raw: string) => raw.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);

import { PROMO_CODES, normalizePromo, promoHash, type PromoCode } from '../data/promoCodes';
import type { SaveData } from '../save/schema';
import { applyReward } from './rewards';

/** Clé de la n-ième utilisation d'un code (la 1re garde l'ancienne clé, pour les parties existantes). */
const useKey = (h: string, n: number) => (n === 1 ? `promo_${h}` : `promo_${h}_${n}`);
/** Nombre de fois où ce code a déjà été utilisé dans la partie. */
export const promoUsed = (s: SaveData, h: string, max: number) => { let n = 0; while (n < max && s.flags[useKey(h, n + 1)]) n++; return n; };

/** Utilise un code promo : récompense appliquée et utilisation notée (une fois par partie, ou `uses` fois). */
export function redeemPromo(s: SaveData, raw: string, now: number): { ok: true; promo: PromoCode; left: number } | { ok: false; reason: string } {
  if (normalizePromo(raw).length < 3) return { ok: false, reason: 'Entre un code.' };
  const h = promoHash(raw);
  const promo = PROMO_CODES.find((p) => p.hash === h);
  if (!promo) return { ok: false, reason: 'Ce code n’existe pas.' };
  if (promo.until && now > Date.parse(promo.until)) return { ok: false, reason: 'Ce code a expiré.' };
  const max = promo.uses ?? 1;
  const used = promoUsed(s, h, max);
  if (used >= max) return { ok: false, reason: max > 1 ? `Tu as déjà utilisé ce code ${max} fois.` : 'Tu as déjà utilisé ce code.' };
  applyReward(s, promo.reward);
  s.flags[useKey(h, used + 1)] = true;
  return { ok: true, promo, left: max - used - 1 };
}

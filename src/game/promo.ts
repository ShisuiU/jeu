import { PROMO_CODES, normalizePromo, promoHash, type PromoCode } from '../data/promoCodes';
import type { SaveData } from '../save/schema';
import { applyReward } from './rewards';

/** Utilise un code promo : récompense appliquée et code marqué comme utilisé (une fois par partie). */
export function redeemPromo(s: SaveData, raw: string, now: number): { ok: true; promo: PromoCode } | { ok: false; reason: string } {
  if (normalizePromo(raw).length < 3) return { ok: false, reason: 'Entre un code.' };
  const h = promoHash(raw);
  const promo = PROMO_CODES.find((p) => p.hash === h);
  if (!promo) return { ok: false, reason: 'Ce code n’existe pas.' };
  if (promo.until && now > Date.parse(promo.until)) return { ok: false, reason: 'Ce code a expiré.' };
  if (s.flags[`promo_${h}`]) return { ok: false, reason: 'Tu as déjà utilisé ce code.' };
  applyReward(s, promo.reward);
  s.flags[`promo_${h}`] = true;
  return { ok: true, promo };
}

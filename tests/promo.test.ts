import { describe, expect, it } from 'vitest';
import { promoHash, PROMO_CODES } from '../src/data/promoCodes';
import { redeemPromo } from '../src/game/promo';
import { createNewSave } from '../src/save/schema';

describe('codes promo', () => {
  it('les empreintes correspondent aux codes prévus', () => {
    expect(PROMO_CODES.map((p) => p.hash)).toEqual([promoHash('AEONFALL'), promoHash('FRACTURE'), promoHash('FAILLES'), promoHash('FAILLES30')]);
    expect(PROMO_CODES[3].reward).toEqual({ shardEvent: 30 });
    expect(PROMO_CODES[2].reward).toEqual({ shardEvent: 20 });
    expect(promoHash(' aeon-fall ')).toBe(promoHash('AEONFALL'));
  });
  it('un code donne sa récompense une seule fois', () => {
    const s = createNewSave(Date.now());
    const before = s.resources.crystals;
    const r = redeemPromo(s, 'aeonfall', Date.now());
    expect(r.ok).toBe(true);
    expect(s.resources.crystals).toBe(before + 300);
    expect(redeemPromo(s, 'AEONFALL', Date.now()).ok).toBe(false);
    expect(redeemPromo(s, 'INCONNU', Date.now()).ok).toBe(false);
  });
});

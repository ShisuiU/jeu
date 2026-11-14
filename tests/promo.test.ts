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
    const before = s.resources.shardEpic;
    const r = redeemPromo(s, 'aeonfall', Date.now());
    expect(r.ok).toBe(true);
    expect(s.resources.shardEpic).toBe(before + 1); // 300 cristaux du code → 1 éclat épique (v1.102.0)
    expect(redeemPromo(s, 'AEONFALL', Date.now()).ok).toBe(false);
    expect(redeemPromo(s, 'INCONNU', Date.now()).ok).toBe(false);
  });
  it('le code à 30 éclats de faille s’utilise 2 fois par partie', () => {
    const s = createNewSave(Date.now());
    const b = s.resources.shardEvent ?? 0;
    const r1 = redeemPromo(s, 'failles30', Date.now());
    expect(r1.ok && r1.left).toBe(1);
    const r2 = redeemPromo(s, 'FAILLES30', Date.now());
    expect(r2.ok && r2.left).toBe(0);
    expect(s.resources.shardEvent).toBe(b + 60);
    expect(redeemPromo(s, 'FAILLES30', Date.now()).ok).toBe(false);
    expect(s.resources.shardEvent).toBe(b + 60);
  });
});

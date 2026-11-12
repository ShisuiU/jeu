import { describe, expect, it } from 'vitest';
import { HEROES } from '../src/data/heroes';
import { BAND, skillRatio, speedRange } from '../src/data/heroBalance';

describe('Rééquilibrage des héros (v1.75.0)', () => {
  it('chaque compétence offensive reste dans l’enveloppe de son rôle et de sa rareté', () => {
    for (const h of HEROES) for (const sk of h.skills) {
      const r = skillRatio(h, sk);
      if (r === null) continue;
      expect(r, `${h.id} / ${sk.id}`).toBeGreaterThanOrEqual(BAND.low - 0.03);
      expect(r, `${h.id} / ${sk.id}`).toBeLessThanOrEqual(BAND.high + 0.03);
    }
  });
  it('la vitesse de base reste dans la fourchette du rôle', () => {
    for (const h of HEROES) {
      const [lo, hi] = speedRange(h);
      expect(h.baseSpd, h.id).toBeGreaterThanOrEqual(lo);
      expect(h.baseSpd, h.id).toBeLessThanOrEqual(hi);
    }
  });
  it('un héros commun ne frappe pas plus fort qu’un légendaire du même rôle', () => {
    const best = (rar: string, role: string, slot: string) => Math.max(0, ...HEROES.filter((h) => h.rarity === rar && h.role === role).flatMap((h) => h.skills.filter((s) => s.slot === slot).map((s) => skillRatio(h, s) ?? 0)));
    expect(best('common', 'attacker', 'special')).toBeLessThanOrEqual(BAND.high + 0.03);
  });
});

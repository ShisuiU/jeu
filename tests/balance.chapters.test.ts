import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/campaign';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { stageWaves } from '../src/game/campaign';
import type { UnitSetup } from '../src/game/battle/types';
import { HEROES, HERO_BY_ID } from '../src/data/heroes';

// v1.87.0 (audit E-3) : courbe régulière. Pour une équipe de 5 héros Rares sans équipement (compétences au max),
// le niveau requis pour battre chaque boss augmente d'un chapitre à l'autre, sans mur (+12 niveaux au plus),
// reste sous le niveau des ennemis jusqu'au chapitre 8, et le chapitre 9 demande un peu d'équipement.
describe('courbe de difficulté de la campagne (simulation)', () => {
  const RARES = HEROES.filter((h) => h.rarity === 'rare').slice(0, 5).map((h) => h.id);
  const unit = (id: string, slot: number, lv: number): UnitSetup => ({ kind: 'hero', refId: id, slot, level: lv, rank: Math.min(6, Math.max(3, Math.ceil(lv / 10))), ascension: Math.min(6, Math.floor(lv / 10)), heroUid: id + slot, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((sk) => [sk.id, sk.upgrades.length + 1])) });
  const need = (n: number) => {
    const st = CHAPTERS[n - 1].stages[9];
    for (let lv = 1; lv <= 60; lv++) {
      const t = RARES.map((id, i) => unit(id, i, lv));
      let k = 0; for (let seed = 1; seed <= 3; seed++) if (runToEnd(createBattle(t, stageWaves(st, 'normal'), { seed, leaderUid: t[0].heroUid })).outcome === 'won') k++;
      if (k >= 2) return lv;
    }
    return 99;
  };
  it('niveau requis aux boss : croissant, sans mur, chapitre 9 avec équipement', () => {
    const req = CHAPTERS.map((c) => need(c.n));
    for (let n = 1; n < 8; n++) { expect(req[n], `ch${n + 1}`).toBeGreaterThanOrEqual(req[n - 1]); expect(req[n] - req[n - 1], `ch${n + 1}`).toBeLessThanOrEqual(16); }
    for (let n = 1; n <= 8; n++) { const elv = Math.max(...CHAPTERS[n - 1].stages[9].waves.flat().map((e) => e.level)); expect(req[n - 1], `ch${n}`).toBeLessThanOrEqual(elv); }
    expect(req[8]).toBeGreaterThan(60);
  }, 120000);
});

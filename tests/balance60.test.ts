import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { awakenCheck } from '../src/game/upgrade';
import { sweepTower, towerSweepMax } from '../src/game/towerSweep';
import { ghostRanks } from '../src/game/ranks';
import { BANNERS, BANNER_BY_ID, EPIC_SHARD_PRICE } from '../src/data/summons';
import { buyEpicShards } from '../src/game/summon';
import { DAILY_BONUS, DAILY_MISSIONS, WEEKLY_BONUS, WEEKLY_MISSIONS } from '../src/data/missions';
import { BOSS_TIERS } from '../src/data/worldBoss';

describe('Équilibrage v1.60', () => {
  it('éveil sans doublon : possible avec plus d’essence', () => {
    const s = createNewSave(0);
    const h = s.heroes[0];
    const c = awakenCheck(s, h);
    expect(c.cost.copies).toBeUndefined();
    expect(c.cost.awakenEssence).toBe(2 + 6);
    s.heroCopies[h.heroId] = 1;
    const d = awakenCheck(s, h);
    expect(d.cost.copies).toBe(1);
    expect(d.cost.awakenEssence).toBe(2);
  });
  it('Tour : montée rapide des étages bien en dessous de l’équipe, avec leurs récompenses', () => {
    const s = createNewSave(0);
    expect(towerSweepMax(s)).toBe(0);
    for (const h of s.heroes) h.level = 40;
    const max = towerSweepMax(s);
    expect(max).toBe(29); // ennemis niv. 30 = 40 − 10
    const before = s.resources.crystals;
    const r = sweepTower(s);
    expect(r.floors).toBe(29);
    expect(s.progress.tower.floor).toBe(29);
    expect(s.resources.crystals).toBeGreaterThan(before);
    expect(towerSweepMax(s)).toBe(0);
  });
  it('classement complété jusqu’à 10, jamais au-delà', () => {
    expect(ghostRanks('arena', 2)).toHaveLength(8);
    expect(ghostRanks('arena', 12)).toHaveLength(0);
    expect(ghostRanks('tower', 0).every((g) => g.uid.startsWith('ghost:') && g.tower > 0)).toBe(true);
  });
  it('légendaire garanti au 40e appel épique (v1.66.4), bonus du jour revu en v1.68.2', () => {
    expect(BANNER_BY_ID.epic.pity!.every).toBe(40);
    expect(DAILY_BONUS.crystals).toBe(100);
  });
});

describe('Invocations v1.66.4', () => {
  it('l’invocation épique ne garantit plus un Épique à chaque appel, mais un sur dix', () => {
    const b = BANNER_BY_ID.epic;
    expect(b.rates.rare).toBeGreaterThan(40);
    expect((b.rates.epic ?? 0) + (b.rates.legendary ?? 0) + (b.rates.mythic ?? 0)).toBeLessThan(55);
    expect(b.multiGuarantee).toBe('epic');
    expect(Object.values(b.rates).reduce((a, x) => a + (x ?? 0), 0)).toBeCloseTo(100, 5);
  });
  it('v1.84.0 : Mythique seulement aux Failles ; l’appel épique coûte 1 éclat épique (300 cristaux à l’échange)', () => {
    for (const b of BANNERS) {
      if (b.cost.resource === 'shardEvent') expect(b.rates.mythic ?? 0).toBeGreaterThan(0);
      else expect(b.rates.mythic ?? 0).toBe(0);
      expect(Object.values(b.rates).reduce((a, x) => a + (x ?? 0), 0)).toBeCloseTo(100, 5);
    }
    expect(BANNER_BY_ID.epic.cost).toEqual({ resource: 'shardEpic', amount: 1 });
    const s = createNewSave(Date.now()); s.resources.crystals = 650; s.resources.shardEpic = 0;
    expect(buyEpicShards(s, 1).ok).toBe(true);
    expect(buyEpicShards(s, 2).ok).toBe(false);
    expect(s.resources.crystals).toBe(350); expect(s.resources.shardEpic).toBe(1);
    // remise à 0 unique pour tous les comptes existants
    const old = JSON.parse(JSON.stringify(createNewSave(Date.now()))); old.resources.shardEpic = 7; delete old.flags.epic_shards_v184;
    const m = migrateSave(old);
    expect(m.resources.shardEpic).toBe(0);
    m.resources.shardEpic = 3;
    expect(migrateSave(JSON.parse(JSON.stringify(m))).resources.shardEpic).toBe(3);
  });
});

describe('Économie v1.68.2 (audit : trop d’invocations)', () => {
  it('cristaux d’un joueur régulier : environ une invocation épique par jour, pas trois', () => {
    const daily = DAILY_MISSIONS.reduce((a, m) => a + (m.reward.crystals ?? 0), 0) + (DAILY_BONUS.crystals ?? 0);
    const weekly = (WEEKLY_MISSIONS.reduce((a, m) => a + (m.reward.crystals ?? 0), 0) + (WEEKLY_BONUS.crystals ?? 0)) / 7;
    const boss = 3 * (BOSS_TIERS.find((t) => t.id === 'nightmare')!.reward.crystals ?? 0); // 3 clés au plus haut niveau
    const total = daily + weekly + boss + 80; // + camp et arène
    expect(total).toBeLessThan(2 * EPIC_SHARD_PRICE * BANNER_BY_ID.epic.cost.amount);
    expect(total).toBeGreaterThan(EPIC_SHARD_PRICE * BANNER_BY_ID.epic.cost.amount);
  });
  it('appel rare : un Épique une fois sur six, Légendaire garanti au 50e appel', () => {
    const b = BANNER_BY_ID.aeon;
    expect(b.pity!.every).toBe(50);
    expect(b.rates.epic).toBeGreaterThanOrEqual(15);
    expect(Object.values(b.rates).reduce((a, x) => a + (x ?? 0), 0)).toBeCloseTo(100, 5);
  });
});

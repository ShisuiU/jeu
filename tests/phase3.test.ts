import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { summon, rollRarity } from '../src/game/summon';
import { BANNER_BY_ID, BANNERS } from '../src/data/summons';
import { seededRand, generateGear, upgradeGear, equipGear, dismantleGear, gearBonus, applyGearBonus, mainValue } from '../src/game/gear';
import { useElixirs, rankUp, rankUpCheck, ascend, awaken, awakenCheck, upgradeSkill, elixirsToCap } from '../src/game/upgrade';
import { heroTotalStats } from '../src/game/heroStats';
import { applyStageResult, teamSetups } from '../src/game/campaign';
import { createBattle } from '../src/game/battle/engine';
import { RARITIES } from '../src/data/rarities';
import { HERO_BY_ID } from '../src/data/heroes';

const rich = () => {
  const s = createNewSave(1000);
  for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = 1_000_000;
  return s;
};

describe('migration v1 → v2', () => {
  it('ajoute équipement et compteurs sans perdre la progression', () => {
    const s: any = createNewSave(1000);
    s.version = 1; delete s.equipment; delete s.summons;
    s.resources.gold = 4242;
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.equipment).toEqual([]);
    expect(m.summons.total).toBe(0);
    expect(m.resources.gold).toBe(4242);
  });
});

describe('invocations', () => {
  it('les taux de chaque bannière totalisent 100 %', () => {
    for (const b of BANNERS) expect(Object.values(b.rates).reduce((a, v) => a + v, 0)).toBeCloseTo(100);
  });
  it('les taux observés correspondent aux taux affichés', () => {
    const r = seededRand(1);
    const b = BANNER_BY_ID.standard;
    const n = 20000, c: Record<string, number> = {};
    for (let i = 0; i < n; i++) { const x = rollRarity(r, b, 0).rarity; c[x] = (c[x] ?? 0) + 1; }
    expect(c.common / n).toBeCloseTo(0.6, 1);
    expect(c.rare / n).toBeCloseTo(0.08, 1);
  });
  it('dépense, attribue des héros et convertit les doublons en copies', () => {
    const s = rich();
    const before = s.resources.shardDim;
    const res = summon(s, 'standard', 10, seededRand(5), 2000);
    expect(res.ok).toBe(true);
    expect(s.resources.shardDim).toBe(before - 10);
    expect(res.results).toHaveLength(10);
    const dup = res.results.filter((x) => x.duplicate);
    for (const d of dup) expect(s.heroCopies[d.heroId]).toBeGreaterThan(0);
    expect(new Set(s.heroes.map((h) => h.heroId)).size).toBe(s.heroes.length);
  });
  it('refuse sans ressources', () => {
    const s = createNewSave(1); s.resources.crystals = 0;
    expect(summon(s, 'epic', 1, seededRand(1), 1).ok).toBe(false);
  });
  it('garantie : un légendaire au plus tard à la 100e invocation rare', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = rich();
      let got = -1;
      for (let i = 1; i <= 100 && got < 0; i++) {
        const r = summon(s, 'aeon', 1, seededRand(seed * 1000 + i), 1);
        if (r.results.some((x) => RARITIES[x.rarity].order >= RARITIES.legendary.order)) got = i;
      }
      expect(got).toBeGreaterThan(0);
    }
  });
  it('invocation ×10 rare : au moins un épique', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = rich();
      const r = summon(s, 'aeon', 10, seededRand(seed), 1);
      expect(r.results.some((x) => RARITIES[x.rarity].order >= RARITIES.epic.order)).toBe(true);
    }
  });
});

describe('améliorations', () => {
  it('élixirs : montée de niveau jusqu’au plafond du rang', () => {
    const s = rich();
    const h = s.heroes.find((x) => x.heroId === 'torvald')!; // rang 1 → niveau max 10
    const need = elixirsToCap(h);
    const r = useElixirs(s, h.uid, 999);
    expect(h.level).toBe(10);
    expect(r.used).toBe(need);
  });
  it('rang : nécessite le niveau max, augmente le plafond et les stats', () => {
    const s = rich();
    const h = s.heroes.find((x) => x.heroId === 'torvald')!;
    expect(rankUpCheck(s, h).ok).toBe(false);
    useElixirs(s, h.uid, 999);
    const atk = heroTotalStats(s, h).total.atk;
    expect(rankUp(s, h.uid).ok).toBe(true);
    expect(h.rank).toBe(2);
    expect(heroTotalStats(s, h).total.atk).toBeGreaterThan(atk);
    expect(useElixirs(s, h.uid, 1).used).toBe(1);
  });
  it('ascension et éveil', () => {
    const s = rich();
    const h = s.heroes.find((x) => x.heroId === 'elowen')!; // rang 3
    expect(ascend(s, h.uid).ok).toBe(false); // niveau 10 requis
    useElixirs(s, h.uid, 999);
    expect(ascend(s, h.uid).ok).toBe(true);
    expect(h.ascension).toBe(1);
    expect(awakenCheck(s, h).cost.copies).toBeUndefined(); // sans doublon : plus d'essence à la place
    expect(awakenCheck(s, h).cost.awakenEssence).toBe(8);
    s.heroCopies.elowen = 2;
    expect(awaken(s, h.uid).ok).toBe(true);
    expect(h.awaken).toBe(1);
    expect(s.heroCopies.elowen).toBe(1);
    expect(awaken(s, h.uid).ok).toBe(true); // ascension 1 ≥ éveil 1
    expect(awaken(s, h.uid).ok).toBe(false); // plus de doublon, et ascension 2 requise

  });
  it('compétences : jusqu’au niveau maximum', () => {
    const s = rich();
    const h = s.heroes.find((x) => x.heroId === 'brann')!;
    expect(upgradeSkill(s, h.uid, 'brann_1').ok).toBe(true);
    expect(h.skillLevels.brann_1).toBe(2);
    expect(upgradeSkill(s, h.uid, 'brann_1').ok).toBe(false); // 1 amélioration seulement
  });
});

describe('équipement', () => {
  it('génération cohérente avec la rareté', () => {
    const r = seededRand(3);
    for (let i = 0; i < 50; i++) {
      const g = generateGear(r, 'epic', 1);
      expect(g.subs).toHaveLength(3);
      expect(g.subs.some((x) => x.stat === g.main)).toBe(false);
    }
  });
  it('amélioration : coût, stat principale, nouvelle secondaire au niveau 4', () => {
    const s = rich();
    const g = generateGear(seededRand(1), 'rare', 1, 'weapon');
    s.equipment.push(g);
    const v0 = mainValue(g);
    for (let i = 0; i < 4; i++) expect(upgradeGear(s, g.uid, seededRand(i)).ok).toBe(true);
    expect(mainValue(g)).toBeGreaterThan(v0);
    expect(g.subs).toHaveLength(3);
  });
  it('équiper augmente les stats ; un emplacement = un objet ; démantèlement', () => {
    const s = rich();
    const h = s.heroes[0];
    const w1 = generateGear(seededRand(1), 'rare', 1, 'weapon');
    const w2 = generateGear(seededRand(2), 'rare', 1, 'weapon');
    s.equipment.push(w1, w2);
    const atk = heroTotalStats(s, h).total.atk;
    equipGear(s, w1.uid, h.uid);
    expect(heroTotalStats(s, h).total.atk).toBeGreaterThan(atk);
    equipGear(s, w2.uid, h.uid);
    expect(w1.heroUid).toBeNull();
    expect(dismantleGear(s, w2.uid)).toBeNull(); // équipé
    expect(dismantleGear(s, w1.uid)).not.toBeNull();
  });
  it('bonus d’ensemble', () => {
    const r = seededRand(9);
    const items = ['weapon', 'helmet', 'armor', 'gloves'].map((sl) => generateGear(r, 'common', 1, sl as any, 'swift'));
    const b = gearBonus(items);
    expect(b.sets.find((x) => x.id === 'swift')!.active).toBe(1);
    expect(b.pct.spd).toBe(12);
    expect(applyGearBonus({ hp: 1000, atk: 100, def: 100, spd: 100, critRate: 10, critDmg: 50, acc: 0, res: 0 }, b).spd).toBeGreaterThanOrEqual(112);
  });
  it('l’équipement est pris en compte en combat', () => {
    const s = rich();
    const h = s.heroes[0];
    const team = s.teams[0];
    const plain = createBattle(teamSetups(s, team), [[{ kind: 'enemy', refId: 'hollow_soldier', slot: 0, level: 1 }]], { seed: 1 });
    const g = generateGear(seededRand(4), 'legendary', 1, 'helmet');
    s.equipment.push(g); equipGear(s, g.uid, h.uid);
    const geared = createBattle(teamSetups(s, team), [[{ kind: 'enemy', refId: 'hollow_soldier', slot: 0, level: 1 }]], { seed: 1 });
    expect(geared.units[0].base.hp).toBeGreaterThan(plain.units[0].base.hp);
  });
  it('la campagne donne de l’équipement et du butin', () => {
    const s = createNewSave(1);
    let gear = 0;
    for (let i = 0; i < 20; i++) {
      const r = applyStageResult(s, '1-1', 'normal', true, 0, [s.heroes[0].uid], 1000 + i * 37);
      gear += r.gear.length;
      expect(Object.keys(r.loot)).toHaveLength(1);
    }
    expect(gear).toBeGreaterThan(5);
    expect(s.equipment.length).toBe(gear);
  });
});

it('fragments nécessaires cohérents avec la rareté', () => {
  expect(RARITIES[HERO_BY_ID.azhar.rarity].fragmentsToSummon).toBeGreaterThan(RARITIES[HERO_BY_ID.brann.rarity].fragmentsToSummon);
});

describe('taux d’invocation (rééquilibrés, façon Raid)', () => {
  it('l’invocation primordiale est retirée', () => {
    expect(BANNERS.map((b) => b.id)).not.toContain('primal');
    expect(summon(rich(), 'primal', 1, seededRand(1), 1).ok).toBe(false);
  });
});

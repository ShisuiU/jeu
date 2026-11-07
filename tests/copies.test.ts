import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { summon } from '../src/game/summon';
import { seededRand } from '../src/game/gear';
import { BOND_MAX, bondLevel, bondPct, copiesOf, giveCopy, giveCopyCheck } from '../src/game/copies';
import { heroTotalStats } from '../src/game/heroStats';
import { teamSetups } from '../src/game/campaign';
import { HERO_BY_ID } from '../src/data/heroes';
import { DUPLICATE_FRAGMENTS } from '../src/data/summons';

const rich = () => { const s = createNewSave(1000); for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = 1_000_000; return s; };

describe('doublons de héros', () => {
  it('une invocation d’un héros déjà possédé donne exactement 1 doublon', () => {
    const s = rich();
    const res = summon(s, 'standard', 10, seededRand(7), 2000);
    const dups = res.results.filter((r) => r.duplicate);
    expect(dups.length).toBeGreaterThan(0);
    const per: Record<string, number> = {};
    for (const d of dups) per[d.heroId] = (per[d.heroId] ?? 0) + 1;
    for (const [id, n] of Object.entries(per)) expect(copiesOf(s, id)).toBe(n);
    expect('heroFragments' in s).toBe(false);
  });

  it('offrir un doublon à la famille renforce tous les héros de cette famille', () => {
    const s = rich();
    const h = s.heroes[0]; const d = HERO_BY_ID[h.heroId];
    const other = s.heroes.find((x) => x !== h && HERO_BY_ID[x.heroId].faction === d.faction && HERO_BY_ID[x.heroId].affinity !== d.affinity);
    expect(giveCopyCheck(s, h.heroId, 'faction').ok).toBe(false);
    s.heroCopies[h.heroId] = 2;
    const before = heroTotalStats(s, h).total.atk;
    expect(giveCopy(s, h.heroId, 'faction')).toBe(true);
    expect(bondLevel(s, 'faction', d.faction)).toBe(1);
    expect(copiesOf(s, h.heroId)).toBe(1);
    expect(heroTotalStats(s, h).total.atk).toBeGreaterThan(before);
    if (other) expect(bondPct(s, other.heroId)).toBe(1);
    // Le bonus suit le héros en combat.
    const team = s.teams[0];
    const setup = teamSetups(s, team).find((u) => u.heroUid === h.uid)!;
    expect(setup.gear!.pct.atk).toBeGreaterThanOrEqual(1);
  });

  it('les liens d’affinité s’additionnent aux liens de famille, plafonnés à 10 niveaux', () => {
    const s = rich();
    const h = s.heroes[0];
    s.heroCopies[h.heroId] = 30;
    for (let i = 0; i < 15; i++) { giveCopy(s, h.heroId, 'affinity'); giveCopy(s, h.heroId, 'faction'); }
    expect(bondLevel(s, 'affinity', HERO_BY_ID[h.heroId].affinity)).toBe(BOND_MAX);
    expect(bondLevel(s, 'faction', HERO_BY_ID[h.heroId].faction)).toBe(BOND_MAX);
    expect(bondPct(s, h.heroId)).toBe(20);
    expect(copiesOf(s, h.heroId)).toBe(10);
    expect(giveCopyCheck(s, h.heroId, 'faction').reason).toMatch(/maximal/);
  });
});

describe('conversion des anciennes sauvegardes (v3 → v4)', () => {
  it('les fragments deviennent des doublons, sans rien perdre', () => {
    const old = createNewSave(1000) as unknown as Record<string, unknown>;
    old.version = 3;
    delete old.heroCopies; delete old.bonds;
    old.heroFragments = { brann: DUPLICATE_FRAGMENTS.common * 2, aldric: 1, idris: 0 };
    const s = migrateSave(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.heroCopies.brann).toBe(2);
    expect(s.heroCopies.aldric).toBe(1); // reste arrondi au supérieur
    expect(s.heroCopies.idris).toBeUndefined();
    expect('heroFragments' in s).toBe(false);
    expect(s.bonds).toEqual({ faction: {}, affinity: {} });
  });
});

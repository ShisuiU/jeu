import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { generateOpponents, playerTeamPower } from '../src/game/arena';
import { seededRand } from '../src/game/gear';
import { applyMode } from '../src/game/modes';
import { BOSS_TIERS, bossShare } from '../src/data/worldBoss';
import { eventBonus } from '../src/game/events';

describe('Arène et boss mondial (v1.114.0, retours du joueur)', () => {
  it('Arène hors ligne : à niveau 60, les adversaires imaginaires ont bien ~70 / 95 / 115 % de la puissance du joueur', () => {
    const s = createNewSave(1_800_000_000_000);
    for (const h of s.heroes) { h.level = 60; h.rank = 6; h.ascension = 6; }
    const pp = playerTeamPower(s);
    const ratios = generateOpponents(s, seededRand(7)).map((o) => o.power / pp);
    expect(ratios[0]).toBeGreaterThan(0.6);
    expect(ratios[1]).toBeGreaterThan(0.85);
    expect(ratios[2]).toBeGreaterThan(1.0);
  });
  it('boss mondial : la récompense est la part des PV infligée', () => {
    const t = BOSS_TIERS[0];
    expect(bossShare(t.reward, 100)).toEqual(Object.fromEntries(Object.entries(t.reward).filter(([, v]) => (v ?? 0) > 0)));
    expect(bossShare(t.reward, 37).gold).toBe(Math.round((t.reward.gold ?? 0) * 0.37));
    expect(bossShare(t.reward, 0)).toEqual({});
    const s = createNewSave(1_800_000_000_000);
    const gold = s.resources.gold;
    const max = 1_000_000;
    const res = applyMode(s, { mode: 'worldboss', tier: t.id }, { won: false, alliesDead: 0, participants: [], bossDamage: { dealt: max * 0.4, max } }, 1_800_000_000_000);
    // (les anciens cristaux de la table sont convertis en or à l'arrivée : on compare la récompense elle-même)
    expect(res.reward!.gold).toBe(Math.round((t.reward.gold ?? 0) * 0.4 * eventBonus(1_800_000_000_000, 'worldBoss')));
    expect(s.resources.gold).toBeGreaterThan(gold);
    expect(res.won).toBe(true);
  });
  it('anciennes sauvegardes : meilleurs scores du boss divisés par deux une seule fois (PV doublés)', () => {
    const s = createNewSave(1_800_000_000_000) as unknown as { flags: Record<string, boolean>; worldBoss: { best: Record<string, number> } };
    delete s.flags.wb_hp2_v114; s.worldBoss.best = { normal: 100, hard: 40 };
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.worldBoss.best).toEqual({ normal: 50, hard: 20 });
    expect(migrateSave(JSON.parse(JSON.stringify(m))).worldBoss.best).toEqual({ normal: 50, hard: 20 });
  });
});

import { describe, expect, it } from 'vitest';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { TOWER_FLOORS, towerReward, towerWaves } from '../src/data/tower';
import { DUNGEONS, DUNGEON_FLOORS, dungeonWaves } from '../src/data/dungeons';
import { ENEMIES } from '../src/data/enemies';
import { HERO_BY_ID } from '../src/data/heroes';
import type { WaveEnemy } from '../src/data/campaign';
import type { UnitSetup } from '../src/game/battle/types';

// FIN DE JEU (v1.43) : Tour à 100 étages (les Sommets), donjons à 15 étages. Simulations sans équipement.
const TEAM = ['varkhaal', 'ysolde', 'nerissa', 'orin', 'solenne'];
const team = (lv: number, rk: number, asc: number, aw: number): UnitSetup[] => TEAM.map((id, i) => ({ kind: 'hero', refId: id, slot: i, level: lv, rank: rk, ascension: asc, awaken: aw, heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, s.upgrades.length + 1])) }));
const setups = (w: WaveEnemy[][]) => w.map((x) => x.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level, hpMult: e.hpMult, statMult: e.statMult })));
const wins = (t: UnitSetup[], w: WaveEnemy[][], n = 3) => { let k = 0; for (let seed = 1; seed <= n; seed++) if (runToEnd(createBattle(t, setups(w), { seed, leaderUid: TEAM[0] })).outcome === 'won') k++; return k; };

describe('Tour des Âges : les Sommets', () => {
  it('100 étages, tous jouables, ennemis connus', () => {
    expect(TOWER_FLOORS).toBe(100);
    for (let f = 1; f <= TOWER_FLOORS; f++) for (const w of towerWaves(f)) for (const e of w) expect(ENEMIES[e.enemy], `${f} ${e.enemy}`).toBeTruthy();
    expect(towerReward(100).crystals).toBeGreaterThan(towerReward(90).crystals!);
  });
  it('une équipe au maximum sans équipement passe l’étage 70 mais pas le 100', () => {
    expect(wins(team(60, 6, 6, 5), towerWaves(70))).toBe(3);
    expect(wins(team(60, 6, 6, 5), towerWaves(100))).toBe(0);
  }, 60000);
});

describe('donjons à 15 étages', () => {
  it('une équipe niveau 60 passe l’étage 13 de chaque donjon', () => {
    expect(DUNGEON_FLOORS).toBe(15);
    for (const d of DUNGEONS) expect(wins(team(60, 6, 5, 0), dungeonWaves(d, 13), 2), d.id).toBe(2);
  }, 60000);
});

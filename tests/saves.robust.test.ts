import { describe, expect, it } from 'vitest';
import v1 from './fixtures/save-v1.json';
import { migrateSave } from '../src/save/migrations';
import { createNewSave, SAVE_VERSION, type SaveData } from '../src/save/schema';
import { exportSave, importSave } from '../src/save/exportImport';
import { claimDaily } from '../src/game/daily';
import { summon } from '../src/game/summon';
import { useElixirs, rankUp, ascend, upgradeSkill } from '../src/game/upgrade';
import { generateGear, upgradeGear, equipGear, dismantleGear, seededRand } from '../src/game/gear';
import { applyMode } from '../src/game/modes';
import { applyStageResult } from '../src/game/campaign';
import { track, claimMission, applyResets } from '../src/game/missions';
import { DAILY_MISSIONS } from '../src/data/missions';
import { generateOpponents } from '../src/game/arena';
import { produce } from 'immer';

describe('sauvegarde de référence v1 (phase 1)', () => {
  it('se migre vers la version actuelle sans perte', () => {
    const m = migrateSave(JSON.parse(JSON.stringify(v1)));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.heroes).toHaveLength((v1 as any).heroes.length);
    expect(m.heroes.every((h) => h.level === 9)).toBe(true);
    expect(m.progress.campaign['normal:1-9'].clears).toBe(1);
    expect(m.equipment).toEqual([]);
    expect(m.arena.rating).toBe(1000);
    expect(m.settings.music).toBe(true);
    expect(importSave(exportSave(m))).toEqual(m);
  });
});

describe('robustesse : 300 actions aléatoires', () => {
  it('la sauvegarde reste valide et identique après export/import', () => {
    const r = seededRand(2026);
    let s: SaveData = createNewSave(Date.parse('2026-11-10T10:00:00Z'));
    for (const k of Object.keys(s.resources) as (keyof SaveData['resources'])[]) s.resources[k] = k === 'crystals' ? 0 : 5000; // plus de cristaux (v1.102.0)
    let now = Date.parse('2026-11-10T10:00:00Z');
    const actions: ((d: SaveData) => void)[] = [
      (d) => claimDaily(d, now),
      (d) => summon(d, ['standard', 'aeon', 'epic'][Math.floor(r() * 3)], r() < 0.3 ? 10 : 1, r, now),
      (d) => d.heroes.length && useElixirs(d, d.heroes[Math.floor(r() * d.heroes.length)].uid, 3),
      (d) => d.heroes.length && rankUp(d, d.heroes[Math.floor(r() * d.heroes.length)].uid),
      (d) => d.heroes.length && ascend(d, d.heroes[Math.floor(r() * d.heroes.length)].uid),
      (d) => { const h = d.heroes[Math.floor(r() * d.heroes.length)]; upgradeSkill(d, h.uid, Object.keys(h.skillLevels)[0]); },
      (d) => { const g = generateGear(r, 'rare', now); d.equipment.push(g); equipGear(d, g.uid, d.heroes[0].uid); },
      (d) => d.equipment.length && upgradeGear(d, d.equipment[Math.floor(r() * d.equipment.length)].uid, r),
      (d) => d.equipment.length && dismantleGear(d, d.equipment[Math.floor(r() * d.equipment.length)].uid),
      (d) => applyStageResult(d, '1-' + (1 + Math.floor(r() * 10)), 'normal', r() < 0.8, Math.floor(r() * 3), d.heroes.slice(0, 4).map((h) => h.uid), now),
      (d) => applyMode(d, { mode: 'dungeon', dungeonId: 'warforge', floor: 1 }, { won: r() < 0.7, alliesDead: 0, participants: [d.heroes[0].uid] }, now),
      (d) => applyMode(d, { mode: 'worldboss', tier: 'normal' }, { won: false, alliesDead: 4, participants: [], bossDamage: { dealt: r() * 100, max: 100 } }, now),
      (d) => { d.arena.opponents = generateOpponents(d, r); applyMode(d, { mode: 'arena', opponentId: d.arena.opponents[0].id }, { won: r() < 0.5, alliesDead: 0, participants: [] }, now); },
      (d) => { track(d, 'battleWin', 1); DAILY_MISSIONS.forEach((m) => claimMission(d, 'daily', m.id)); },
      (d) => { now += 3600_000 * (1 + Math.floor(r() * 30)); d.time.highWater = now; applyResets(d, now); },
    ];
    for (let i = 0; i < 300; i++) {
      const act = actions[Math.floor(r() * actions.length)];
      s = produce(s, (d) => { act(d); });
      if (i % 25 === 0) {
        expect(importSave(exportSave(s))).toEqual(s);
        expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
      }
      for (const v of Object.values(s.resources)) expect(Number.isFinite(v) && v >= 0).toBe(true);
      expect(new Set(s.heroes.map((h) => h.heroId)).size).toBe(s.heroes.length);
      for (const g of s.equipment) if (g.heroUid) expect(s.heroes.some((h) => h.uid === g.heroUid)).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { applyResets, track, claimMission, missionState, bonusAvailable, claimBonus, claimAchievement, achievementDone, eventTaskState, claimEventTask } from '../src/game/missions';
import { DAILY_MISSIONS } from '../src/data/missions';
import { resolveMode, canStart, payMode, applyMode, nextSpec } from '../src/game/modes';
import { generateOpponents } from '../src/game/arena';
import { seededRand } from '../src/game/gear';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { teamSetups, isStageUnlocked } from '../src/game/campaign';
import { STAGE_BY_ID } from '../src/data/campaign';
import { dayKey, weekKey } from '../src/core/time';
import { setEvents, activeEvents, bannerAvailable } from '../src/game/events';
import { BUNDLED_EVENTS } from '../src/data/events';
import { DUNGEONS } from '../src/data/dungeons';
import { TOWER_FLOORS, towerWaves } from '../src/data/tower';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const fresh = () => { const s = createNewSave(NOW); s.time.highWater = NOW; applyResets(s, NOW); return s; };

describe('migration v2 → v3', () => {
  it('ajoute missions, arène, boss mondial, événements', () => {
    const s: any = createNewSave(1); s.version = 2;
    for (const k of ['resets', 'missions', 'achievements', 'arena', 'worldBoss', 'events']) delete s[k];
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.arena.rating).toBe(1000);
    expect(m.missions.daily.claimed).toEqual([]);
    expect(m.worldBoss.keysUsed).toBe(0);
  });
});

describe('temps', () => {
  it('clé de semaine : lundi', () => {
    expect(weekKey(new Date(2026, 10, 11, 12).getTime())).toBe('2026-11-09');
    expect(weekKey(new Date(2026, 10, 15, 23).getTime())).toBe('2026-11-09');
    expect(weekKey(new Date(2026, 10, 16, 6).getTime())).toBe('2026-11-16');
  });
});

describe('missions', () => {
  it('suivi, réclamation et bonus quotidien', () => {
    const s = fresh();
    track(s, 'battleWin', 5);
    expect(missionState(s, 'daily', 'd_win5').done).toBe(true);
    const elix = s.resources.xpElixir;
    expect(claimMission(s, 'daily', 'd_win5')).toBe(true);
    expect(s.resources.xpElixir).toBe(elix + 3);
    expect(claimMission(s, 'daily', 'd_win5')).toBe(false);
    for (const m of DAILY_MISSIONS) { track(s, m.key, m.target); claimMission(s, 'daily', m.id); }
    expect(bonusAvailable(s, 'daily')).toBe(true);
    expect(claimBonus(s, 'daily')).toBe(true);
    expect(claimBonus(s, 'daily')).toBe(false);
  });
  it('réinitialisation au changement de jour (les hebdomadaires restent)', () => {
    const s = fresh();
    track(s, 'battleWin', 3);
    s.worldBoss.keysUsed = 3;
    applyResets(s, NOW + 24 * 3600 * 1000);
    expect(s.missions.daily.counters.battleWin ?? 0).toBe(0);
    expect(s.missions.weekly.counters.battleWin).toBe(3);
    expect(s.worldBoss.keysUsed).toBe(0);
    expect(s.resets.day).toBe(dayKey(NOW + 24 * 3600 * 1000));
  });
  it('succès', () => {
    const s = fresh();
    expect(achievementDone(s, 'a_lvl5')).toBe(false);
    s.profile.level = 5;
    expect(claimAchievement(s, 'a_lvl5')).toBe(true);
    expect(claimAchievement(s, 'a_lvl5')).toBe(false);
  });
});

describe('événements', () => {
  it('fenêtre de dates, bannière et objectifs', () => {
    setEvents(BUNDLED_EVENTS);
    expect(activeEvents(NOW).filter((e) => !e.cycle)).toHaveLength(1);
    expect(activeEvents(Date.parse('2030-01-01')).filter((e) => !e.cycle)).toHaveLength(0);
    expect(bannerAvailable('event_ash', NOW)).toBe(true);
    expect(bannerAvailable('event_ash', Date.parse('2030-01-01'))).toBe(false);
    expect(bannerAvailable('aeon', Date.parse('2030-01-01'))).toBe(true);
    const s = fresh();
    track(s, 'battleWin', 15);
    const st = eventTaskState(s, 'ev_ash_2026', 'e1')!;
    expect(st.done).toBe(true);
    expect(claimEventTask(s, 'ev_ash_2026', 'e1')).toBe(true);
    expect(s.resources.shardEvent).toBe(3);
  });
});

describe('modes de jeu', () => {
  it('donjon : coût, victoire, étage suivant, équipement garanti', () => {
    const s = fresh();
    const spec = { mode: 'dungeon' as const, dungeonId: 'forge', floor: 1 };
    expect(canStart(s, { ...spec, floor: 2 }).ok).toBe(false);
    const e0 = s.energy.current;
    expect(payMode(s, spec, NOW).ok).toBe(true);
    expect(s.energy.current).toBeLessThan(e0);
    const res = applyMode(s, spec, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW);
    expect(res.gear).toHaveLength(1);
    expect(s.progress.dungeons.forge.bestFloor).toBe(1);
    expect(canStart(s, { ...spec, floor: 2 }).ok).toBe(true);
    expect(nextSpec(s, spec)).toEqual({ ...spec, floor: 2 });
    expect(s.missions.daily.counters.dungeonWin).toBe(1);
  });
  it('tour : étages successifs', () => {
    const s = fresh();
    expect(canStart(s, { mode: 'tower', floor: 2 }).ok).toBe(false);
    applyMode(s, { mode: 'tower', floor: 1 }, { won: true, alliesDead: 0, participants: [] }, NOW);
    expect(s.progress.tower.floor).toBe(1);
    expect(canStart(s, { mode: 'tower', floor: 2 }).ok).toBe(true);
    for (let f = 1; f <= TOWER_FLOORS; f++) expect(towerWaves(f)[0].length).toBeGreaterThan(0);
  });
  it('boss mondial : clés quotidiennes et récompenses selon les dégâts', () => {
    const s = fresh();
    const spec = { mode: 'worldboss' as const, tier: 'normal' };
    for (let i = 0; i < 3; i++) expect(payMode(s, spec, NOW).ok).toBe(true);
    expect(payMode(s, spec, NOW).ok).toBe(false);
    const res = applyMode(s, spec, { won: false, alliesDead: 4, participants: [], bossDamage: { dealt: 32, max: 100 } }, NOW);
    expect(res.damage!.chests).toBe(3);
    expect(s.worldBoss.best.normal).toBe(32);
    expect(Object.keys(res.reward).length).toBeGreaterThan(0);
  });
  it('boss mondial : le combat s’arrête à la limite de tours', () => {
    const s = fresh();
    const info = resolveMode(s, { mode: 'worldboss', tier: 'normal' });
    const b = runToEnd(createBattle(teamSetups(s, s.teams[0]), info.waves, { seed: 1, turnLimit: info.turnLimit }));
    expect(['timeout', 'lost']).toContain(b.outcome);
    expect(b.actionCount).toBeLessThanOrEqual(info.turnLimit! + 1);
  });
  it('arène : adversaires, tickets, classement', () => {
    const s = fresh();
    s.arena.opponents = generateOpponents(s, seededRand(1));
    expect(s.arena.opponents).toHaveLength(3);
    const op = s.arena.opponents[2];
    const info = resolveMode(s, { mode: 'arena', opponentId: op.id });
    expect(info.waves[0].length).toBeGreaterThanOrEqual(4);
    const b = runToEnd(createBattle(teamSetups(s, s.teams[0]), info.waves, { seed: 3 }));
    expect(['won', 'lost']).toContain(b.outcome);
    payMode(s, { mode: 'arena', opponentId: op.id }, NOW);
    const res = applyMode(s, { mode: 'arena', opponentId: op.id }, { won: true, alliesDead: 0, participants: [] }, NOW);
    expect(res.rating!.delta).toBeGreaterThan(0);
    expect(s.arena.ticketsUsed).toBe(1);
    expect(s.arena.opponents[0].id).not.toBe(op.id);
  });
  it('difficultés : Difficile s’ouvre après le chapitre en Normal', () => {
    const s = fresh();
    expect(isStageUnlocked(s, 'hard', STAGE_BY_ID['1-1'])).toBe(false);
    s.progress.campaign['normal:1-10'] = { stars: 3, clears: 1 };
    expect(isStageUnlocked(s, 'hard', STAGE_BY_ID['1-1'])).toBe(true);
    expect(resolveMode(s, { mode: 'campaign', stageId: '1-1', difficulty: 'hard' }).waves[0][0].level).toBeGreaterThan(10);
  });
  it('les 4 donjons sont générés pour les 10 étages', () => {
    const s = fresh();
    for (const d of DUNGEONS) for (let f = 1; f <= 10; f++) expect(resolveMode(s, { mode: 'dungeon', dungeonId: d.id, floor: f }).waves).toHaveLength(2);
  });
});

import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { RIFT_ROOMS } from '../src/data/rift';
import { applyRiftBattle, chooseNode, generateNodes, pickRelic, riftSetups, riftWaves, startRift, syncRift } from '../src/game/rift';
import { teamSetups } from '../src/game/campaign';
import { applyMode, canStart, resolveMode } from '../src/game/modes';
import { migrateSave } from '../src/save/migrations';

const T = new Date(2026, 10, 13, 12).getTime();
describe('Les Failles (v1.93.0)', () => {
  it('10 salles, la dernière est le boss, la même faille toute la semaine', () => {
    const a = generateNodes('2026-W46'), b = generateNodes('2026-W46');
    expect(a).toEqual(b); expect(a).toHaveLength(RIFT_ROOMS); expect(a[RIFT_ROOMS - 1]).toEqual(['boss']);
    expect(a.every((o) => o.length >= 1)).toBe(true);
  });
  it('une traversée : combat, PV conservés, halte, autel, défaite', () => {
    const s = createNewSave(T); s.time.highWater = T;
    syncRift(s, T);
    const team = s.teams[0].slots.filter((u): u is string => !!u);
    expect(startRift(s, team, T).ok).toBe(true);
    expect(startRift(s, team, T).ok).toBe(false); // une seule par semaine
    expect(chooseNode(s, 0).fight).toBe(true);
    expect(canStart(s, { mode: 'rift', room: 1 }).ok).toBe(true);
    expect(resolveMode(s, { mode: 'rift', room: 1 }).waves.length).toBeGreaterThan(0);
    const hp = Object.fromEntries(team.map((u, i) => [u, i === 0 ? 0 : 0.5]));
    const res = applyMode(s, { mode: 'rift', room: 1 }, { won: true, alliesDead: 1, participants: team, allyHp: hp }, T);
    expect(res.won).toBe(true); expect(s.rift.room).toBe(2); expect(s.rift.hp[team[0]]).toBe(0);
    // le héros tombé ne combat plus
    expect(riftSetups(s, teamSetups(s, s.teams[0])).some((a) => a.heroUid === team[0])).toBe(false);
    expect(riftSetups(s, teamSetups(s, s.teams[0]))[0].hpPct).toBe(0.5);
    // forcer une halte puis un autel
    s.rift.nodes[1] = ['rest']; chooseNode(s, 0); expect(s.rift.hp[team[0]]).toBe(0.2); expect(s.rift.room).toBe(3);
    s.rift.nodes[2] = ['altar']; chooseNode(s, 0); expect(s.rift.altar).toHaveLength(3);
    expect(pickRelic(s, s.rift.altar![0]).ok).toBe(true); expect(s.rift.relics).toHaveLength(1); expect(s.rift.room).toBe(4);
    s.rift.nodes[3] = ['fight']; chooseNode(s, 0);
    expect(riftWaves(s).length).toBeGreaterThan(0);
    applyRiftBattle(s, false, {}); expect(s.rift.status).toBe('lost');
  });
  it('les anciennes sauvegardes reçoivent la Faille', () => {
    const old = JSON.parse(JSON.stringify(createNewSave(T))); delete old.rift;
    expect(migrateSave(old).rift.status).toBe('idle');
  });
});

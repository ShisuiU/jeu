import { normalizeReward } from '../src/data/resources';
import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { HERO_BY_ID, HEROES } from '../src/data/heroes';
import { CHALLENGES, RIFT_OATH_BONUS, checkChallenge, riftOathOf, towerChallengeOf, towerChallengeReward } from '../src/data/challenges';
import { applyMode, canStart, resolveMode } from '../src/game/modes';
import { startRift, syncRift } from '../src/game/rift';

const T0 = Date.UTC(2026, 10, 14, 12);

describe('Défis à contraintes (v1.97.0)', () => {
  it('chaque règle se vérifie sur la composition de l’équipe', () => {
    const healer = HEROES.find((h) => h.role === 'healer')!;
    const defender = HEROES.find((h) => h.role === 'defender')!;
    const legend = HEROES.find((h) => h.rarity === 'legendary')!;
    const plain = HEROES.filter((h) => h.role === 'attacker' && h.rarity === 'rare').slice(0, 2);
    expect(checkChallenge('noHealer', [healer, ...plain])).toBeTruthy();
    expect(checkChallenge('noHealer', plain)).toBeNull();
    expect(checkChallenge('noDefender', [defender])).toBeTruthy();
    expect(checkChallenge('noLegend', [legend])).toBeTruthy();
    expect(checkChallenge('fourMax', HEROES.slice(0, 5))).toBeTruthy();
    expect(checkChallenge('fourMax', HEROES.slice(0, 4))).toBeNull();
    expect(checkChallenge('noHealer', [])).toBeTruthy();
    expect(Object.keys(CHALLENGES)).toContain(towerChallengeOf(5));
  });

  it('Tour : un défi par étage multiple de 5 déjà conquis, récompensé une seule fois', () => {
    const s = createNewSave(T0);
    const spec = { mode: 'tower' as const, floor: 10, challenge: true };
    expect(canStart(s, spec).ok).toBe(false); // étage pas encore conquis
    s.progress.tower.floor = 12;
    expect(canStart(s, spec).ok).toBe(true);
    expect(canStart(s, { mode: 'tower', floor: 11, challenge: true }).ok).toBe(false); // pas un étage à défi
    expect(resolveMode(s, spec).challenge).toBe(towerChallengeOf(10));
    // une équipe qui respecte la règle
    const rule = towerChallengeOf(10);
    const ok = s.heroes.filter((h) => !checkChallenge(rule, [HERO_BY_ID[h.heroId]])).slice(0, 4).map((h) => h.uid);
    expect(ok.length).toBeGreaterThan(0);
    const before = s.resources.gold;
    const r = applyMode(s, spec, { won: true, alliesDead: 0, participants: ok }, T0);
    expect(r.firstClear).toBe(true);
    expect(s.resources.gold - before).toBe(normalizeReward(towerChallengeReward(10)).gold);
    expect(s.progress.tower.challenges).toContain(10);
    expect(s.progress.tower.floor).toBe(12); // la progression normale ne bouge pas
    expect(canStart(s, spec).ok).toBe(false); // déjà relevé
  });

  it('Tour : une équipe qui ne respecte pas la règle ne valide pas le défi', () => {
    const s = createNewSave(T0);
    s.progress.tower.floor = 10;
    const spec = { mode: 'tower' as const, floor: 10, challenge: true };
    const rule = towerChallengeOf(10);
    const bad = HEROES.find((h) => checkChallenge(rule, rule === 'fourMax' ? HEROES.slice(0, 5) : [h]))!;
    if (rule !== 'fourMax') s.heroes.push({ ...s.heroes[0], uid: 'bad', heroId: bad.id });
    const parts = rule === 'fourMax' ? [...s.heroes.map((h) => h.uid), ...['x1', 'x2', 'x3', 'x4', 'x5']].slice(0, 5) : ['bad'];
    if (rule === 'fourMax') while (s.heroes.length < 5) s.heroes.push({ ...s.heroes[0], uid: `x${s.heroes.length}` });
    const r = applyMode(s, spec, { won: true, alliesDead: 0, participants: rule === 'fourMax' ? s.heroes.slice(0, 5).map((h) => h.uid) : parts }, T0);
    expect(r.firstClear).toBe(false);
    expect(s.progress.tower.challenges ?? []).not.toContain(10);
  });

  it('Failles : le serment de la semaine refuse une équipe non conforme', () => {
    const s = createNewSave(T0);
    const r = syncRift(s, T0);
    const rule = riftOathOf(r.week);
    const team = s.heroes.map((h) => h.uid);
    const why = checkChallenge(rule, s.heroes.map((h) => HERO_BY_ID[h.heroId]));
    const res = startRift(s, team, T0, true);
    expect(res.ok).toBe(!why);
    if (res.ok) expect(s.rift.oath).toBe(rule);
    expect(RIFT_OATH_BONUS.crystals).toBeGreaterThan(0);
  });
});

describe('Fin des cristaux d’Aeon (v1.102.0)', () => {
  it('aucune récompense ne donne de cristaux : petites sommes en or, grosses en éclats épiques', async () => {
    const { normalizeReward, crystalsTo } = await import('../src/data/resources');
    expect(crystalsTo(100)).toEqual({ gold: 5000 });
    expect(crystalsTo(300)).toEqual({ shardEpic: 1 });
    expect(crystalsTo(550)).toEqual({ shardEpic: 2 });
    expect(normalizeReward({ crystals: 100, gold: 1000, shardDim: 2 })).toEqual({ gold: 6000, shardDim: 2 });
    const s = createNewSave(T0);
    expect(s.resources.crystals).toBe(0);
    const { applyReward } = await import('../src/game/rewards');
    applyReward(s, { crystals: 600 });
    expect(s.resources.crystals).toBe(0);
    expect(s.resources.shardEpic).toBe(1 + 2);
  });
  it('le stock de cristaux d’une ancienne partie devient des éclats épiques et de l’or', async () => {
    const { migrateSave } = await import('../src/save/migrations');
    const old = JSON.parse(JSON.stringify(createNewSave(T0)));
    old.resources.crystals = 1000; old.resources.gold = 0; old.resources.shardEpic = 0;
    const m = migrateSave(old);
    expect(m.resources.crystals).toBe(0);
    expect(m.resources.shardEpic).toBe(3);
    expect(m.resources.gold).toBe(100 * 50);
  });
});

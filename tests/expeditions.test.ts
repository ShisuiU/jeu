import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { claimExpedition, expeditionLoot, refreshExpeditions, startExpedition, recallExpedition, EXPEDITION_SLOTS } from '../src/game/expeditions';
import { dayKey } from '../src/core/time';

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);

describe('expéditions', () => {
  it('4 offres par jour, identiques pour le même jour, différentes le lendemain', () => {
    const s = createNewSave(NOW);
    const a = refreshExpeditions(s, NOW).offers.map((o) => o.id + o.place);
    expect(a).toHaveLength(EXPEDITION_SLOTS);
    expect(refreshExpeditions(s, NOW + 60_000).offers.map((o) => o.id + o.place)).toEqual(a);
    const tomorrow = NOW + 24 * 3600_000;
    expect(dayKey(tomorrow)).not.toBe(dayKey(NOW));
    expect(refreshExpeditions(s, tomorrow).offers.map((o) => o.id + o.place)).not.toEqual(a);
  });

  it('départ, retour en temps réel, butin une seule fois, mission comptée', () => {
    const s = createNewSave(NOW);
    const o = refreshExpeditions(s, NOW).offers[0];
    const team = s.heroes.slice(0, o.size).map((h) => h.uid);
    expect(startExpedition(s, o.id, team, NOW).ok).toBe(true);
    expect(startExpedition(s, o.id, team, NOW).ok).toBe(false);
    expect(claimExpedition(s, o.id, NOW + 1000).ok).toBe(false);
    const gold = s.resources.gold;
    const r = claimExpedition(s, o.id, NOW + o.minutes * 60_000);
    expect(r.ok).toBe(true);
    expect(Object.keys(r.reward ?? {}).length).toBeGreaterThan(0);
    if (r.reward?.gold) expect(s.resources.gold).toBe(gold + r.reward.gold);
    expect(claimExpedition(s, o.id, NOW + o.minutes * 60_000).ok).toBe(false);
    expect(startExpedition(s, o.id, team, NOW + o.minutes * 60_000).ok).toBe(false);
    expect(s.missions.daily.counters.expedition).toBe(1);
  });

  it('un héros ne part pas dans deux expéditions ; le rappeler le libère sans butin', () => {
    const s = createNewSave(NOW);
    const [a, b] = refreshExpeditions(s, NOW).offers;
    const h = s.heroes[0].uid;
    const team = (o: typeof a) => [h, ...s.heroes.slice(1).map((x) => x.uid)].slice(0, o.size);
    expect(startExpedition(s, a.id, team(a), NOW).ok).toBe(true);
    expect(startExpedition(s, b.id, team(b), NOW).ok).toBe(false);
    recallExpedition(s, a.id);
    expect(startExpedition(s, b.id, team(b), NOW).ok).toBe(true);
  });

  it('la condition remplie augmente le butin', () => {
    const s = createNewSave(NOW);
    const o = { ...refreshExpeditions(s, NOW).offers[0], size: 1, cond: { kind: 'affinity' as const, id: 'telluric' } };
    const tell = s.heroes.find((h) => h.heroId === 'torvald')!.uid;
    const other = s.heroes.find((h) => h.heroId === 'corvin')!.uid;
    expect(expeditionLoot(s, o, [tell]).bonus).toBe(true);
    expect(expeditionLoot(s, o, [other]).bonus).toBe(false);
  });

  it('une ancienne sauvegarde reçoit le champ expéditions', () => {
    const s: any = createNewSave(NOW); delete s.expeditions;
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.expeditions).toEqual({ day: '', offers: [], runs: [], done: [] });
  });
});

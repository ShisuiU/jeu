import { describe, expect, it } from 'vitest';
import { createNewSave, createHeroInstance } from '../src/save/schema';
import { activeMissions, missionState, track } from '../src/game/missions';
import { claimAllMissions, claimableIn, claimAllExpeditions, launchAllExpeditions, launchableExpeditions, harvestAll, harvestReady, suggestTeam } from '../src/game/quickClaim';
import { refreshExpeditions, condMet } from '../src/game/expeditions';
import { HEROES, HERO_BY_ID } from '../src/data/heroes';

const NOW = Date.UTC(2026, 10, 15, 12);

describe('Récupération groupée (v1.103.0)', () => {
  it('réclame en une fois toutes les missions du jour terminées, puis le coffre', () => {
    const s = createNewSave(NOW);
    for (const m of activeMissions(s, 'daily')) track(s, m.key, m.target);
    const n = claimableIn(s, 'daily');
    expect(n).toBe(activeMissions(s, 'daily').length);
    const gold0 = s.resources.gold, epic0 = s.resources.shardEpic;
    const r = claimAllMissions(s, 'daily');
    expect(r.count).toBe(n + 1); // + le coffre
    expect(activeMissions(s, 'daily').every((m) => missionState(s, 'daily', m.id).claimed)).toBe(true);
    expect(s.missions.daily.bonus).toBe(true);
    expect(s.resources.gold - gold0).toBe(r.reward.gold ?? 0);
    expect(s.resources.shardEpic - epic0).toBe(r.reward.shardEpic ?? 0);
    expect(claimAllMissions(s, 'daily').count).toBe(0); // rien deux fois
  });
  it('lance toutes les expéditions avec les meilleurs héros libres, puis les récupère au retour', () => {
    const s = createNewSave(NOW);
    for (const h of HEROES.slice(0, 12)) s.heroes.push(createHeroInstance(h.id, NOW));
    const ex = refreshExpeditions(s, NOW);
    const team = suggestTeam(s, ex.offers[0], new Set())!;
    expect(team).toHaveLength(ex.offers[0].size);
    if (s.heroes.some((h) => condMet(ex.offers[0].cond, [h.heroId]))) expect(condMet(ex.offers[0].cond, team.map((u) => s.heroes.find((h) => h.uid === u)!.heroId))).toBe(true);
    const n = launchAllExpeditions(s, NOW);
    expect(n).toBe(ex.offers.length);
    expect(launchableExpeditions(s)).toBe(0);
    const all = s.expeditions.runs.flatMap((r) => r.heroUids);
    expect(new Set(all).size).toBe(all.length); // aucun héros envoyé deux fois
    expect(claimAllExpeditions(s, NOW).count).toBe(0); // pas encore revenues
    const r = claimAllExpeditions(s, NOW + 13 * 3600_000);
    expect(r.count).toBe(n);
    void HERO_BY_ID;
  });
  it('récolte le Camp et la Mine en un geste', () => {
    const s = createNewSave(NOW);
    s.camp = { since: NOW - 6 * 3600_000 }; s.buildings.mineSince = NOW - 6 * 3600_000;
    expect(harvestReady(s, NOW)).toBe(2);
    const d0 = s.resources.diamonds ?? 0;
    const r = harvestAll(s, NOW);
    expect(r.count).toBe(2);
    expect((s.resources.diamonds ?? 0) - d0).toBe(r.reward.diamonds);
    expect(harvestReady(s, NOW)).toBe(0);
  });
});

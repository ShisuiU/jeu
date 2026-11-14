import { normalizeReward } from '../src/data/resources';
import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { HERO_BY_ID } from '../src/data/heroes';
import { FACTION_MAX_STARS, FACTION_ORDER, FACTION_STAR_MILESTONES, factionStatMult, factionWaves } from '../src/data/factionDungeon';
import { claimFactionMilestone, claimableMilestones, factionOfDay, factionTeam, familyStars, floorStars, nextRotation, setFactionTeam, totalFactionStars } from '../src/game/factionDungeon';
import { applyMode, canStart, resolveMode } from '../src/game/modes';
import { createHeroInstance } from '../src/save/schema';

const DAY = 86_400_000;
const T = new Date(2026, 10, 12, 12, 0, 0).getTime();
describe('Donjon des familles (v1.79.0)', () => {
  it('une famille par jour, les 6 familles en 6 jours, changement au renouvellement', () => {
    const seen = new Set(Array.from({ length: 6 }, (_, k) => factionOfDay(T + k * DAY)));
    expect(seen.size).toBe(6);
    expect(factionOfDay(T + 6 * DAY)).toBe(factionOfDay(T));
    const n = nextRotation(T);
    expect(n).toBeGreaterThan(T);
    expect(factionOfDay(n - 1000)).toBe(factionOfDay(T));
    expect(factionOfDay(n + 1000)).not.toBe(factionOfDay(T));
  });
  it('seuls les héros de la famille du jour composent l’équipe ; la progression reste quand le donjon revient', () => {
    const s = createNewSave(T); s.time.highWater = T;
    const f = factionOfDay(T);
    const other = FACTION_ORDER.find((x) => x !== f)!;
    const mine = Object.values(HERO_BY_ID).filter((h) => h.faction === f).slice(0, 2).map((h) => createHeroInstance(h.id, T));
    const foreign = createHeroInstance(Object.values(HERO_BY_ID).find((h) => h.faction === other)!.id, T);
    s.heroes.push(...mine, foreign);
    setFactionTeam(s, f, [foreign.uid, mine[1].uid, mine[0].uid]);
    const team = factionTeam(s, f);
    expect(team.slots.filter(Boolean)).toEqual([mine[1].uid, mine[0].uid]);
    expect(team.slots.every((u) => !u || HERO_BY_ID[s.heroes.find((h) => h.uid === u)!.heroId].faction === f)).toBe(true);
    const spec = { mode: 'faction' as const, faction: f, floor: 1 };
    expect(canStart(s, spec).ok).toBe(true);
    expect(canStart(s, { ...spec, faction: other }).ok).toBe(false); // fermé aujourd'hui
    expect(resolveMode(s, spec).cost.kind).toBe('free');
    applyMode(s, spec, { won: true } as never, T);
    expect(s.factionDungeon.best[f]).toBe(1);
    s.time.highWater = T + 6 * DAY; // le donjon revient
    expect(canStart(s, { ...spec, floor: 2 }).ok).toBe(true);
    expect(canStart(s, spec).ok).toBe(true); // un étage conquis peut être rejoué (étoiles)
    expect(canStart(s, { ...spec, floor: 3 }).ok).toBe(false);
  });
  it('plus dur : la puissance des ennemis grimpe à chaque étage', () => {
    expect(factionStatMult(1)).toBe(1);
    expect(factionStatMult(30)).toBeGreaterThan(6);
    const f = FACTION_ORDER[0];
    expect(factionWaves(f, 30).flat().every((e) => (e.statMult ?? 1) > 6 && e.level === 70)).toBe(true);
  });
  it('étoiles : 1 à 3 par étage, meilleure note gardée, rejouer ne redonne pas la récompense ; paliers sur le total des familles', () => {
    const s = createNewSave(T); s.time.highWater = T;
    const f = factionOfDay(T);
    s.heroes.push(...Object.values(HERO_BY_ID).filter((h) => h.faction === f).slice(0, 3).map((h) => createHeroInstance(h.id, T)));
    const spec = { mode: 'faction' as const, faction: f, floor: 1 };
    const gold0 = s.resources.gold;
    const r1 = applyMode(s, spec, { won: true, alliesDead: 2, participants: [] }, T);
    expect(r1.stars).toBe(1); expect(r1.firstClear).toBe(true);
    const gold1 = s.resources.gold; expect(gold1).toBeGreaterThan(gold0);
    const r2 = applyMode(s, spec, { won: true, alliesDead: 0, participants: [] }, T);
    expect(r2.stars).toBe(3); expect(r2.firstClear).toBe(false);
    expect(s.resources.gold).toBe(gold1);
    applyMode(s, spec, { won: true, alliesDead: 1, participants: [] }, T);
    expect(floorStars(s, f, 1)).toBe(3);
    expect(totalFactionStars(s)).toBe(3);
    // les anciens étages conquis comptent 1 étoile
    const other = FACTION_ORDER.find((x) => x !== f)!;
    s.factionDungeon.best[other] = 29;
    expect(familyStars(s, other)).toBe(29);
    expect(totalFactionStars(s)).toBe(32);
    expect(claimableMilestones(s)).toEqual([0]);
    expect(claimFactionMilestone(s, 1).ok).toBe(false);
    const g0 = s.resources.gold;
    expect(claimFactionMilestone(s, 0).ok).toBe(true);
    expect(s.resources.gold).toBe(g0 + (normalizeReward(FACTION_STAR_MILESTONES[0].reward).gold ?? 0));
    expect(claimFactionMilestone(s, 0).ok).toBe(false);
    expect(FACTION_MAX_STARS).toBe(540);
    expect(FACTION_STAR_MILESTONES.at(-1)!.stars).toBe(540);
  });
});

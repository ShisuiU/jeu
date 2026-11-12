import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { HERO_BY_ID } from '../src/data/heroes';
import { FACTION_ORDER } from '../src/data/factionDungeon';
import { factionOfDay, factionTeam, nextRotation, setFactionTeam } from '../src/game/factionDungeon';
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
    expect(canStart(s, spec).ok).toBe(false);
  });
});

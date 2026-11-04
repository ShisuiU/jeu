import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { applyResets, track, claimEventTask, eventClaimable } from '../src/game/missions';
import { setEvents, activeEvents, cycleWeek, weeklyEvent, eventPoints, claimMilestone, milestoneState, eventBonus, nextWeekly } from '../src/game/events';
import { applyMode, canStart, payMode, resolveMode, trialSetup } from '../src/game/modes';
import { CYCLE_THEMES } from '../src/data/eventCycle';
import { BUNDLED_EVENTS } from '../src/data/events';
import { CHAPTERS } from '../src/data/campaign';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { HERO_BY_ID } from '../src/data/heroes';
import type { UnitSetup } from '../src/game/battle/types';

const NOW = new Date(2026, 10, 4, 12).getTime(); // mercredi 4 novembre 2026, heure locale
const fresh = (t = NOW) => { const s = createNewSave(t); s.time.highWater = t; applyResets(s, t); return s; };

describe('calendrier des événements de la semaine', () => {
  it('une semaine va du lundi au lundi, à l’heure de renouvellement', () => {
    const w = cycleWeek(NOW);
    const mon = new Date(w.start);
    expect(mon.getDay()).toBe(1);
    expect(mon.getHours()).toBe(5);
    expect(w.end - w.start + 1000).toBeGreaterThanOrEqual(7 * 24 * 3600 * 1000 - 3600 * 1000); // passage à l'heure d'hiver toléré
    expect(cycleWeek(w.end).index).toBe(w.index);
    expect(cycleWeek(w.end + 1000).index).toBe(w.index + 1);
    // Lundi 4 h 59 appartient encore à la semaine précédente.
    expect(cycleWeek(w.start - 60_000).index).toBe(w.index - 1);
  });
  it('les 6 thèmes se suivent, sans répétition sur 6 semaines, et l’événement est stable', () => {
    const week = 7 * 24 * 3600 * 1000;
    const themes = Array.from({ length: 6 }, (_, k) => weeklyEvent(NOW + k * week)!.cycle!.theme);
    expect(new Set(themes).size).toBe(CYCLE_THEMES.length);
    expect(weeklyEvent(NOW)).toBe(weeklyEvent(NOW + 3600_000));
    expect(nextWeekly(NOW).theme.id).toBe(themes[1]);
    expect(activeEvents(NOW).some((e) => e.cycle)).toBe(true);
  });
  it('chaque thème rapporte assez de points pour atteindre le dernier palier', () => {
    for (const t of CYCLE_THEMES) expect(t.tasks.reduce((n, x) => n + x.points, 0) + 50 + 60 + 80).toBeGreaterThanOrEqual(500);
  });
});

describe('objectifs, points et paliers', () => {
  it('objectifs → points → paliers réclamables une seule fois', () => {
    const s = fresh(); const e = weeklyEvent(NOW)!;
    expect(eventPoints(s, e)).toBe(0);
    for (const t of e.tasks!) track(s, t.key, t.target);
    expect(eventClaimable(s, NOW, e.id)).toBe(5);
    for (const t of e.tasks!) expect(claimEventTask(s, e.id, t.id)).toBe(true);
    expect(eventPoints(s, e)).toBe(e.tasks!.reduce((n, t) => n + (t.points ?? 0), 0));
    const crystals = s.resources.crystals;
    expect(milestoneState(s, e, 1)!.ready).toBe(true);
    expect(claimMilestone(s, e.id, 1, NOW)).toBe(true);
    expect(claimMilestone(s, e.id, 1, NOW)).toBe(false);
    expect(s.resources.crystals).toBe(crystals + 100);
    expect(milestoneState(s, e, 4)!.ready).toBe(false); // 330 points < 500
  });
});

describe('épreuve en 3 combats', () => {
  it('dans l’ordre, une fois chacune, difficulté fixée au premier combat', () => {
    const s = fresh(); const e = weeklyEvent(NOW)!;
    const spec = (trial: number) => ({ mode: 'challenge' as const, eventId: e.id, trial });
    expect(canStart(s, spec(1)).ok).toBe(false);
    expect(canStart(s, spec(0)).ok).toBe(true);
    expect(resolveMode(s, spec(0)).waves[0].length).toBeGreaterThan(0);
    expect(payMode(s, spec(0), NOW).ok).toBe(true);
    expect(s.events[e.id].chap).toBe(1);
    const lost = applyMode(s, spec(0), { won: false, alliesDead: 5, participants: [] }, NOW);
    expect(lost.won).toBe(false);
    expect(s.events[e.id].trials ?? 0).toBe(0);
    const won = applyMode(s, spec(0), { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW);
    expect(won.firstClear).toBe(true);
    expect(s.events[e.id].trials).toBe(1);
    expect(eventPoints(s, e)).toBe(50);
    expect(canStart(s, spec(0)).ok).toBe(false);
    expect(canStart(s, spec(1)).ok).toBe(true);
  });
});

describe('bonus de la semaine', () => {
  it('la Forge Ardente multiplie le butin des donjons, pas les autres semaines', () => {
    const week = 7 * 24 * 3600 * 1000;
    const forgeAt = Array.from({ length: 6 }, (_, k) => NOW + k * week).find((t) => weeklyEvent(t)!.cycle!.theme === 'forge')!;
    const otherAt = Array.from({ length: 6 }, (_, k) => NOW + k * week).find((t) => !['forge'].includes(weeklyEvent(t)!.cycle!.theme))!;
    setEvents([]); // sans la Faille de Cendre (qui donne déjà ×1,5 aux donjons)
    expect(eventBonus(forgeAt, 'dungeon')).toBe(1.5);
    expect(eventBonus(otherAt, 'dungeon')).toBe(1);
    const run = (t: number) => { const s = fresh(t); const spec = { mode: 'dungeon' as const, dungeonId: 'forge', floor: 1 }; payMode(s, spec, t); return applyMode(s, spec, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, t).reward; };
    const a = run(forgeAt), b = run(otherAt);
    const k = Object.keys(b)[0] as keyof typeof a;
    expect((a[k] ?? 0)).toBeGreaterThan(b[k] ?? 0);
    setEvents(BUNDLED_EVENTS);
  });
});

// Même équipe de référence que tests/balance.chapters.test.ts.
const TEAMS: Record<number, string[]> = {
  2: ['aldric', 'brann', 'corvin', 'elowen', 'torvald'],
  3: ['aldric', 'ysolde', 'corvin', 'elowen', 'maelis'],
  4: ['aldric', 'ysolde', 'kaedra', 'orin', 'maelis'],
  5: ['aldric', 'ysolde', 'kaedra', 'orin', 'tamsin'],
  6: ['varkhaal', 'ysolde', 'nerissa', 'orin', 'tamsin'],
  7: ['varkhaal', 'ysolde', 'nerissa', 'orin', 'caelum'],
  8: ['varkhaal', 'ysolde', 'nerissa', 'orin', 'solenne'],
};
function team(n: number, lv: number): UnitSetup[] {
  return TEAMS[n].map((id, i) => ({ kind: 'hero', refId: id, slot: i, level: lv, rank: Math.max(Math.ceil(lv / 10), 1), ascension: Math.max(0, Math.min(6, Math.floor(lv / 10))), heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, 2])) }));
}

describe('équilibrage de l’épreuve (simulation, chaque thème, chapitres 2 à 8)', () => {
  const week = 7 * 24 * 3600 * 1000;
  for (let k = 0; k < 6; k++) {
    it(`thème de la semaine +${k}`, () => {
      const t = NOW + k * week; const e = weeklyEvent(t)!;
      const rates: string[] = []; const bad: string[] = []; const easy: string[] = [];
      for (let n = 2; n <= 8; n++) {
        const s = fresh(t); s.events[e.id] = { counters: {}, claimed: [], challengeDone: false, chap: n };
        for (const [i, off] of [[0, -3], [2, 0], [2, -8]] as const) {
          const spec = { mode: 'challenge' as const, eventId: e.id, trial: i };
          const set = trialSetup(s, e.id, i)!;
          const elv = Math.max(...set.waves.flat().map((w) => w.level));
          let w = 0; const seeds = 10;
          for (let seed = 1; seed <= seeds; seed++) if (runToEnd(createBattle(team(n, Math.min(60, elv + off)), resolveMode(s, spec).waves, { seed, leaderUid: TEAMS[n][0] })).outcome === 'won') w++;
          rates.push(`${e.cycle!.theme} ch${n} é${i + 1}${off}: ${w}`);
          const r = w / seeds;
          // Au chapitre 8, les héros plafonnent au niveau 60 : le test « 8 niveaux en dessous » n'a pas de sens.
          if (i === 0 ? r < 0.6 : off === 0 && r < 0.2) bad.push(rates.at(-1)!);
          if (i === 2 && off < 0 && n < 8 && r >= 0.9) easy.push(rates.at(-1)!);
        }
      }
      expect(CHAPTERS.length).toBeGreaterThanOrEqual(8);
      expect(bad).toEqual([]);
      // 8 niveaux sous l'ennemi, le dernier combat ne doit pas être gagné d'avance (tolérance : 2 chapitres sur 6).
      expect(easy.length, easy.join(', ')).toBeLessThanOrEqual(2);
    });
  }
});

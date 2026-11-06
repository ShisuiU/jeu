import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { summon } from '../src/game/summon';
import { seededRand } from '../src/game/gear';
import { activeEvents, loginState, setEvents } from '../src/game/events';
import { claimLoginDay } from '../src/game/loginEvent';
import { eventClaimable } from '../src/game/missions';
import { BUNDLED_EVENTS } from '../src/data/events';
import { HEROES } from '../src/data/heroes';

const DAY = 24 * 3600 * 1000;
const T0 = new Date(2026, 10, 7, 12).getTime(); // 7 novembre 2026, midi (heure locale)
const fresh = (t = T0) => { const s = createNewSave(t); s.time.highWater = t; for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = 1_000_000; return s; };

describe('héros exclusifs', () => {
  it('Élyra est exclusive et ne sort jamais à l’invocation', () => {
    expect(HEROES.filter((h) => h.exclusive).map((h) => h.id)).toEqual(['elyra']);
    const s = fresh();
    for (let i = 0; i < 30; i++) summon(s, 'primal', 10, seededRand(100 + i), T0);
    expect(s.heroes.some((h) => h.heroId === 'elyra')).toBe(false);
    expect(s.heroCopies.elyra ?? 0).toBe(0);
  });
});

describe('L’Appel des Sept Aubes (7 jours de connexion)', () => {
  setEvents(BUNDLED_EVENTS);
  const ev = () => activeEvents(T0).find((e) => e.id === 'ev_dawn_2026')!;

  it('l’événement est actif et propose un cadeau par jour', () => {
    expect(ev()).toBeTruthy();
    const s = fresh();
    expect(loginState(s, ev(), T0)).toMatchObject({ total: 7, claimed: 0, ready: true });
    expect(eventClaimable(s, T0, 'ev_dawn_2026')).toBe(1);
  });

  it('un seul cadeau par jour ; Élyra rejoint l’équipe le 7e jour de connexion', () => {
    const s = fresh();
    const gold = s.resources.gold;
    expect(claimLoginDay(s, 'ev_dawn_2026', T0)).toMatchObject({ ok: true, day: 1 });
    expect(s.resources.gold).toBe(gold + 10000);
    expect(claimLoginDay(s, 'ev_dawn_2026', T0 + 3600_000).ok).toBe(false); // même jour
    // Les jours n'ont pas besoin d'être consécutifs.
    let t = T0;
    for (let d = 2; d <= 7; d++) { t += (d === 4 ? 3 : 1) * DAY; s.time.highWater = t; expect(claimLoginDay(s, 'ev_dawn_2026', t).day).toBe(d); }
    expect(s.heroes.some((h) => h.heroId === 'elyra')).toBe(true);
    expect(loginState(s, ev(), t + DAY)).toMatchObject({ claimed: 7, ready: false });
    expect(claimLoginDay(s, 'ev_dawn_2026', t + DAY).ok).toBe(false);
  });

  it('si Élyra est déjà là, le 7e jour donne un doublon', () => {
    const s = fresh();
    s.events.ev_dawn_2026 = { counters: {}, claimed: [], challengeDone: false, login: ['a', 'b', 'c', 'd', 'e', 'f'] };
    claimLoginDay(s, 'ev_dawn_2026', T0); // 7e jour : Élyra
    const r = (() => { s.events.ev_dawn_2026.login = ['a', 'b', 'c', 'd', 'e', 'f']; return claimLoginDay(s, 'ev_dawn_2026', T0 + DAY); })();
    expect(r).toMatchObject({ ok: true, hero: 'elyra', duplicate: true });
    expect(s.heroCopies.elyra).toBe(1);
    expect(s.heroes.filter((h) => h.heroId === 'elyra')).toHaveLength(1);
  });

  it('après la fin de l’événement, plus rien à réclamer', () => {
    const s = fresh(Date.parse('2026-12-20T12:00:00Z'));
    expect(activeEvents(s.time.highWater).some((e) => e.id === 'ev_dawn_2026')).toBe(false);
    expect(claimLoginDay(s, 'ev_dawn_2026', s.time.highWater).ok).toBe(false);
  });
});

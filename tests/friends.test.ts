import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { GIFTS_PER_DAY, GIFT_ENERGY, canBorrow, canGift, claimsLeft, friendCode, giftWaiting, lendHero, markBorrowed, normalizeCode, pairId, receiveGift, type Friendship } from '../src/game/friends';
import { createBattle } from '../src/game/battle/engine';
import { teamSetups } from '../src/game/campaign';

const T0 = new Date(2026, 10, 9, 12).getTime();
const DAY = 24 * 3600 * 1000;
const f = (extra: Partial<Friendship> = {}): Friendship => ({ users: ['a', 'b'], from: 'a', status: 'ok', gifts: {}, claims: {}, createdAt: 1, ...extra });

describe('amis (règles locales)', () => {
  it('code ami : 6 caractères lisibles, stable, différent selon le compte', () => {
    const c = friendCode('uid-123');
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(friendCode('uid-123')).toBe(c);
    expect(friendCode('uid-124')).not.toBe(c);
    expect(friendCode('uid-123', 1)).not.toBe(c);
    expect(normalizeCode(' ab-c 12 3 ')).toBe('ABC123');
    expect(pairId('b', 'a')).toBe('a_b');
  });
  it('cadeaux : un envoi par jour, réception du cadeau en attente', () => {
    const day = new Date(T0).toISOString();
    void day;
    const x = f();
    expect(canGift(x, 'a', T0)).toBe(true);
    expect(giftWaiting(x, 'b')).toBe(false);
    const sent = f({ gifts: { a: '2026-11-09' } });
    expect(giftWaiting(sent, 'b')).toBe(true);
    expect(giftWaiting(f({ gifts: { a: '2026-11-09' }, claims: { b: '2026-11-09' } }), 'b')).toBe(false);
    expect(canGift(f({ status: 'pending' }), 'a', T0)).toBe(false);
  });
  it('recevoir : +énergie, sans limite par jour (même au-delà du maximum)', () => {
    const s = createNewSave(T0);
    const e0 = s.energy.current;
    expect(receiveGift(s, T0)).toBe(true);
    expect(s.energy.current).toBe(e0 + GIFT_ENERGY);
    for (let i = 1; i < 40; i++) expect(receiveGift(s, T0)).toBe(true);
    expect(s.energy.current).toBe(e0 + 40 * GIFT_ENERGY);
    expect(claimsLeft(s, T0)).toBe(GIFTS_PER_DAY);
  });
  it('héros prêté : le plus puissant, utilisable une fois par jour et par ami en renfort', () => {
    const s = createNewSave(T0);
    const l = lendHero(s)!;
    expect(s.heroes.some((h) => h.heroId === l.refId)).toBe(true);
    expect(canBorrow(s, 'b', T0)).toBe(true);
    markBorrowed(s, 'b', T0);
    expect(canBorrow(s, 'b', T0)).toBe(false);
    expect(canBorrow(s, 'b', T0 + DAY)).toBe(true);
    // Le renfort combat bien aux côtés de l'équipe.
    const own = teamSetups(s, s.teams[0]);
    const b = createBattle([...own, { kind: 'hero', refId: 'kaedra', slot: 4, level: 30 }], [[{ kind: 'enemy', refId: 'hollow_soldier', slot: 0, level: 1 }]], { seed: 1 });
    expect(b.units.filter((u) => u.side === 'ally')).toHaveLength(own.length + 1);
  });
});

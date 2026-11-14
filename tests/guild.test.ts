import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { addPending, bossTotal, claimTier, claimableTiers, clanRights, guildWeek, roleOf, takePending, triesLeft, useTry, validGuildName, tagOf, type GuildDoc } from '../src/game/guild';
import { GUILD_BOSS, GUILD_TIERS } from '../src/data/guild';
import { canStart, resolveMode } from '../src/game/modes';

const T0 = new Date(2026, 10, 9, 12).getTime();
const DAY = 24 * 3600 * 1000;
const guild = (dmg: Record<string, number>, week = guildWeek(T0)): GuildDoc => ({
  name: 'Les Veilleurs', nameLower: 'les veilleurs', tag: 'LV', description: '', emblem: 'aldric', open: true, leader: 'a',
  members: { a: { name: 'A', avatar: 'aldric', power: 1, role: 'leader', joinedAt: 1 } }, count: 1, createdAt: 1, boss: { week, dmg },
});

describe('clans (règles locales)', () => {
  it('noms de clan valides et sigle', () => {
    expect(validGuildName('ab')).not.toBeNull();
    expect(validGuildName('Les Veilleurs')).toBeNull();
    expect(validGuildName('<script>')).not.toBeNull();
    expect(tagOf('Les Veilleurs du Mur')).toBe('LVDM');
  });
  it('2 essais de boss par jour, seulement dans un clan', () => {
    const s = createNewSave(T0);
    expect(canStart(s, { mode: 'guildboss' }).ok).toBe(false);
    s.guild.id = 'g';
    expect(useTry(s, T0) && useTry(s, T0)).toBe(true);
    expect(useTry(s, T0)).toBe(false);
    expect(triesLeft(s, T0)).toBe(0);
    expect(triesLeft(s, T0 + DAY)).toBe(GUILD_BOSS.triesPerDay);
    expect(resolveMode(s, { mode: 'guildboss' }).turnLimit).toBe(GUILD_BOSS.turnLimit);
  });
  it('dégâts en attente : gardés jusqu’à l’envoi', () => {
    const s = createNewSave(T0); s.guild.id = 'g';
    addPending(s, 1234.4, T0); addPending(s, 100, T0);
    expect(takePending(s, T0)).toBe(1334);
    expect(takePending(s, T0)).toBe(0);
  });
  it('paliers : atteints par le clan, il faut avoir attaqué, une fois chacun', () => {
    const s = createNewSave(T0); s.guild.id = 'g';
    const g = guild({ a: GUILD_TIERS[1].dmg, b: 1 });
    expect(bossTotal(g, T0)).toBe(GUILD_TIERS[1].dmg + 1);
    expect(claimableTiers(s, g, 'z', T0)).toEqual([]); // n'a pas attaqué
    expect(claimableTiers(s, g, 'b', T0)).toEqual([0, 1]);
    const gold = s.resources.gold;
    expect(claimTier(s, g, 'b', 0, T0)).toBeTruthy();
    expect(s.resources.gold).toBeGreaterThan(gold);
    expect(claimTier(s, g, 'b', 0, T0)).toBeNull();
    expect(claimableTiers(s, g, 'b', T0)).toEqual([1]);
    // Semaine suivante : les dégâts de l'ancienne semaine ne comptent plus.
    expect(bossTotal(g, T0 + 8 * DAY)).toBe(0);
  });
});

describe('clans : rôles', () => {
  const g = (officers: string[] = []): GuildDoc => ({
    name: 'C', nameLower: 'c', tag: 'C', description: '', emblem: 'aldric', open: true, leader: 'a', officers, count: 3, createdAt: 1, boss: { week: 'w', dmg: {} },
    members: { a: { name: 'A', avatar: 'aldric', power: 1, role: 'leader', joinedAt: 1 }, b: { name: 'B', avatar: 'aldric', power: 1, role: 'member', joinedAt: 1 }, c: { name: 'C', avatar: 'aldric', power: 1, role: 'member', joinedAt: 1 } },
  });
  it('Chef, Adjoint, Membre', () => {
    expect(roleOf(g(['b']), 'a')).toBe('leader');
    expect(roleOf(g(['b']), 'b')).toBe('officer');
    expect(roleOf(g(['b']), 'c')).toBe('member');
    expect(roleOf({ ...g(), officers: undefined }, 'b')).toBe('member'); // anciens clans
  });
  it('droits selon le rôle', () => {
    expect(clanRights(g(['b']), 'a', 'b')).toMatchObject({ kick: true, officer: true, leader: true });
    expect(clanRights(g(['b']), 'b', 'c')).toMatchObject({ kick: true, officer: false, leader: false, settings: true });
    expect(clanRights(g(['b']), 'b', 'a').kick).toBe(false);
    expect(clanRights(g(['b', 'c']), 'b', 'c').kick).toBe(false); // un adjoint n'exclut pas un adjoint
    expect(clanRights(g(['b']), 'c', 'b')).toMatchObject({ kick: false, settings: false });
    expect(clanRights(g(['b', 'x', 'y', 'z', 'w']), 'a', 'c').officer).toBe(false); // 5 adjoints au plus
  });
});

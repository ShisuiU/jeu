import type { SaveData } from '../save/schema';
import { GUILD_BOSS, GUILD_NAME_MAX, GUILD_NAME_MIN, GUILD_TIERS } from '../data/guild';
import { dayKey, weekKey } from '../core/time';
import { applyReward } from './rewards';
import type { Reward } from '../data/resources';
import { playerTeamPower } from './arena';

// CLANS — règles du jeu (sans réseau). Le document en ligne guilds/{gid} est décrit ici ;
// src/cloud/guild.ts le lit et l'écrit.
export interface GuildMember { name: string; avatar: string; power: number; role: 'leader' | 'member'; joinedAt: number }
export interface GuildDoc {
  name: string; nameLower: string; tag: string; description: string; emblem: string; open: boolean;
  leader: string; /** Adjoints (5 au plus). */ officers?: string[]; members: Record<string, GuildMember>; count: number; createdAt: number;
  boss: { week: string; dmg: Record<string, number> };
}
// Rôles : Chef (un seul), Adjoints (5 au plus), Membres.
export type ClanRole = 'leader' | 'officer' | 'member';
export const OFFICERS_MAX = 5;
export const ROLE_NAMES: Record<ClanRole, string> = { leader: 'Chef', officer: 'Adjoint', member: 'Membre' };
export const ROLE_HELP: Record<ClanRole, string> = {
  leader: 'Nomme les adjoints et le prochain chef, exclut, règle le clan.',
  officer: 'Exclut les simples membres, change la présentation, ouvre ou ferme le clan.',
  member: 'Discute et attaque le boss de clan.',
};
export const roleOf = (g: GuildDoc, uid: string): ClanRole => (g.leader === uid ? 'leader' : (g.officers ?? []).includes(uid) ? 'officer' : 'member');
/** Ce que « me » peut faire à « who ». */
export function clanRights(g: GuildDoc, me: string, who: string) {
  const mine = roleOf(g, me), theirs = roleOf(g, who), self = me === who;
  return {
    kick: !self && (mine === 'leader' || (mine === 'officer' && theirs === 'member')),
    officer: !self && mine === 'leader' && theirs !== 'leader' && (theirs === 'officer' || (g.officers ?? []).length < OFFICERS_MAX),
    leader: !self && mine === 'leader',
    settings: mine === 'leader' || mine === 'officer',
  };
}

export interface ChatMessage { id: string; uid: string; name: string; text: string; at: number }

export function validGuildName(name: string): string | null {
  const n = name.trim();
  if (n.length < GUILD_NAME_MIN || n.length > GUILD_NAME_MAX) return `Le nom fait de ${GUILD_NAME_MIN} à ${GUILD_NAME_MAX} caractères.`;
  if (!/^[\p{L}\p{N}' -]+$/u.test(n)) return 'Lettres, chiffres, espaces, apostrophes et tirets seulement.';
  return null;
}
export const tagOf = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 4).toUpperCase() || name.slice(0, 3).toUpperCase();

/** Fiche publiée dans le clan. */
export function memberEntry(s: SaveData, role: GuildMember['role'], joinedAt: number): GuildMember {
  return { name: (s.profile.name || 'Lien').trim().slice(0, 18), avatar: s.profile.avatarHeroId, power: playerTeamPower(s), role, joinedAt };
}

/** Semaine en cours du boss de clan (même découpage que les missions hebdomadaires). */
export const guildWeek = (now: number) => weekKey(now);
export function bossTotal(g: GuildDoc, now: number): number {
  return g.boss?.week === guildWeek(now) ? Object.values(g.boss.dmg ?? {}).reduce((a, v) => a + v, 0) : 0;
}
export const myBossDamage = (g: GuildDoc, uid: string, now: number) => (g.boss?.week === guildWeek(now) ? g.boss.dmg?.[uid] ?? 0 : 0);

/** État local (dans la sauvegarde) : essais du jour, dégâts pas encore envoyés, paliers récupérés. */
function local(s: SaveData, now: number) {
  const day = dayKey(now), week = guildWeek(now);
  if (s.guild.day !== day) { s.guild.day = day; s.guild.tries = 0; }
  if (s.guild.week !== week) { s.guild.week = week; s.guild.claimed = []; s.guild.pending = 0; }
  return s.guild;
}
export const triesLeft = (s: SaveData, now: number) => (s.guild.day === dayKey(now) ? Math.max(0, GUILD_BOSS.triesPerDay - s.guild.tries) : GUILD_BOSS.triesPerDay);
export function useTry(s: SaveData, now: number): boolean {
  const g = local(s, now);
  if (!s.guild.id || g.tries >= GUILD_BOSS.triesPerDay) return false;
  g.tries++;
  return true;
}
/** Dégâts d'un combat : gardés dans la sauvegarde jusqu'à leur envoi au clan. */
export function addPending(s: SaveData, dealt: number, now: number) { local(s, now).pending += Math.max(0, Math.round(dealt)); }
export function takePending(s: SaveData, now: number): number { const g = local(s, now); const p = g.pending; g.pending = 0; return p; }

/** Paliers que ce joueur peut récupérer : atteints par le clan, et il a attaqué cette semaine. */
export function claimableTiers(s: SaveData, g: GuildDoc, uid: string, now: number): number[] {
  if (myBossDamage(g, uid, now) <= 0) return [];
  const total = bossTotal(g, now);
  const claimed = s.guild.week === guildWeek(now) ? s.guild.claimed : [];
  return GUILD_TIERS.map((_, i) => i).filter((i) => total >= GUILD_TIERS[i].dmg && !claimed.includes(i));
}
export function claimTier(s: SaveData, g: GuildDoc, uid: string, i: number, now: number): Reward | null {
  if (!claimableTiers(s, g, uid, now).includes(i)) return null;
  local(s, now).claimed.push(i);
  applyReward(s, GUILD_TIERS[i].reward);
  return GUILD_TIERS[i].reward;
}

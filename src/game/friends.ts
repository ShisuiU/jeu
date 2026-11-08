import type { SaveData } from '../save/schema';
import { dayKey } from '../core/time';
import { applyReward } from './rewards';
import { heroTotalStats } from './heroStats';
import { powerOf } from './stats';
import { heroBonus } from './copies';
import type { DefenseHero } from './arena';

// AMIS — règles du jeu (sans réseau). En ligne : profiles/{uid}, codes/{code}, friendships/{a_b}.
export const FRIENDS_MAX = 30;
export const GIFT_ENERGY = 10;
/** Aucune limite au nombre de cadeaux d'amis récupérables par jour (chaque ami en envoie un par jour). */
export const GIFTS_PER_DAY = Infinity;

export interface FriendProfile { name: string; avatar: string; level: number; power: number; code: string; lend: (DefenseHero & { name?: string }) | null; updatedAt: number }
export interface Friendship { users: [string, string]; from: string; status: 'pending' | 'ok'; gifts: Record<string, string>; claims: Record<string, string>; createdAt: number }

export const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);
export const otherOf = (f: Friendship, me: string) => (f.users[0] === me ? f.users[1] : f.users[0]);

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I : faciles à recopier
/** Code ami (6 caractères) tiré du compte ; « salt » en cas de doublon. */
export function friendCode(uid: string, salt = 0): string {
  let h = 2166136261 ^ salt;
  for (const c of uid) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let out = '';
  for (let i = 0; i < 6; i++) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; out += ALPHA[(h >>> 16) % ALPHA.length]; }
  return out;
}
export const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

/** Le héros que tes amis peuvent emprunter : ton plus puissant, avec son équipement. */
export function lendHero(s: SaveData): DefenseHero | null {
  const best = [...s.heroes].sort((a, b) => powerOf(heroTotalStats(s, b).total) - powerOf(heroTotalStats(s, a).total))[0];
  if (!best) return null;
  return { refId: best.heroId, slot: 0, level: best.level, rank: best.rank, ascension: best.ascension, awaken: best.awaken, skillLevels: best.skillLevels, gear: heroBonus(s, best) };
}

function local(s: SaveData, now: number) {
  const day = dayKey(now);
  if (s.friends.day !== day) { s.friends.day = day; s.friends.claims = 0; s.friends.borrowed = []; }
  return s.friends;
}
export const today = (now: number) => dayKey(now);
/** Peut-on envoyer son cadeau du jour à cet ami ? */
export const canGift = (f: Friendship, me: string, now: number) => f.status === 'ok' && f.gifts[me] !== dayKey(now);
/** Un cadeau de l'ami attend-il ? (envoyé, et pas encore reçu) */
export const giftWaiting = (f: Friendship, me: string) => { const g = f.gifts[otherOf(f, me)]; return f.status === 'ok' && !!g && f.claims[me] !== g; };
export const claimsLeft = (s: SaveData, now: number) => (s.friends.day === dayKey(now) ? Math.max(0, GIFTS_PER_DAY - s.friends.claims) : GIFTS_PER_DAY);
/** Reçoit l'énergie d'un cadeau (mutation). Sans limite : chaque cadeau envoyé se récupère. */
export function receiveGift(s: SaveData, now: number): boolean {
  const l = local(s, now);
  if (l.claims >= GIFTS_PER_DAY) return false;
  l.claims++;
  applyReward(s, { energy: GIFT_ENERGY });
  return true;
}
/** Héros d'ami en renfort : une fois par jour et par ami. */
export const canBorrow = (s: SaveData, friendUid: string, now: number) => !(s.friends.day === dayKey(now) && s.friends.borrowed.includes(friendUid));
export function markBorrowed(s: SaveData, friendUid: string, now: number) { const l = local(s, now); if (!l.borrowed.includes(friendUid)) l.borrowed.push(friendUid); }

import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore/lite';
import { cloud } from './cloudCore';
import type { SaveData } from '../save/schema';
import { FRIENDS_MAX, friendCode, giftWaiting, lendHero, normalizeCode, otherOf, pairId, today, type FriendProfile, type Friendship } from '../game/friends';
import { playerTeamPower } from '../game/arena';
import { useGifts } from '../state/gifts';

// AMIS EN LIGNE — profiles/{uid} (fiche publique), codes/{code} → uid, friendships/{a_b}.
const ctx = () => { const c = cloud(); if (!c.uid) throw Object.assign(new Error('Connecte-toi à ton compte.'), { code: 'auth' }); return c as { db: typeof c.db; uid: string }; };

let myCode: string | null = null;
/** Réserve (une fois) et retourne son code ami. */
export async function ensureCode(): Promise<string> {
  const { db, uid } = ctx();
  if (myCode) return myCode;
  for (let salt = 0; salt < 8; salt++) {
    const code = friendCode(uid, salt);
    const ref = doc(db, 'codes', code);
    const snap = await getDoc(ref);
    if (snap.exists()) { if ((snap.data() as { uid: string }).uid === uid) return (myCode = code); continue; }
    await setDoc(ref, { uid });
    return (myCode = code);
  }
  throw new Error('Impossible de créer ton code ami. Réessaie plus tard.');
}

let lastProfile = '';
/** Publie sa fiche (nom, avatar, niveau, puissance, héros prêté). Appelé avec la sauvegarde en ligne. */
export async function publishProfile(s: SaveData, force = false): Promise<void> {
  const { db, uid } = ctx();
  const code = await ensureCode();
  const p: FriendProfile = { name: (s.profile.name || 'Lien').trim().slice(0, 18), avatar: s.profile.avatarHeroId, level: s.profile.level, power: playerTeamPower(s), code, lend: lendHero(s), updatedAt: Date.now() };
  const key = JSON.stringify({ ...p, updatedAt: 0 });
  if (key === lastProfile && !force) return;
  await setDoc(doc(db, 'profiles', uid), JSON.parse(JSON.stringify(p))); // sans champs « undefined »
  lastProfile = key;
}

export interface FriendRow { id: string; uid: string; f: Friendship; profile: FriendProfile | null }
/** Amitiés (acceptées et demandes), avec la fiche de chaque ami. */
export async function listFriends(): Promise<FriendRow[]> {
  const { db, uid } = ctx();
  const snap = await getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', uid)));
  const rows = snap.docs.map((d) => ({ id: d.id, f: d.data() as Friendship }));
  return Promise.all(rows.map(async (r) => {
    const other = otherOf(r.f, uid);
    const p = await getDoc(doc(db, 'profiles', other)).catch(() => null);
    return { ...r, uid: other, profile: p?.exists() ? (p.data() as FriendProfile) : null };
  }));
}

/** Compte les cadeaux d'amis qui attendent (sans lire les fiches : une seule requête). */
export async function refreshGifts(): Promise<number> {
  const { db, uid } = ctx();
  const snap = await getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', uid)));
  const n = snap.docs.filter((d) => giftWaiting(d.data() as Friendship, uid)).length;
  useGifts.getState().set(n);
  return n;
}

/** Envoie une demande d'ami à partir d'un code. */
export async function addByCode(raw: string, current: FriendRow[]): Promise<string> {
  const { db, uid } = ctx();
  const code = normalizeCode(raw);
  if (code.length < 6) throw new Error('Un code ami fait 6 caractères.');
  const snap = await getDoc(doc(db, 'codes', code));
  if (!snap.exists()) throw new Error('Aucun joueur avec ce code.');
  const other = (snap.data() as { uid: string }).uid;
  if (other === uid) throw new Error('C’est ton propre code !');
  if (current.some((r) => r.uid === other)) throw new Error('Vous êtes déjà amis (ou une demande attend).');
  if (current.filter((r) => r.f.status === 'ok').length >= FRIENDS_MAX) throw new Error(`Tu as déjà ${FRIENDS_MAX} amis.`);
  const users = [uid, other].sort() as [string, string];
  await setDoc(doc(db, 'friendships', pairId(uid, other)), { users, from: uid, status: 'pending', gifts: {}, claims: {}, createdAt: Date.now() });
  const p = await getDoc(doc(db, 'profiles', other));
  return p.exists() ? (p.data() as FriendProfile).name : 'ce joueur';
}

/** Envoie une demande d'ami directement à un joueur (touché dans un classement, v1.75.1). */
export async function addByUid(other: string, current: FriendRow[]): Promise<void> {
  const { db, uid } = ctx();
  if (other === uid) throw new Error('C’est toi !');
  if (current.some((r) => r.uid === other)) throw new Error('Vous êtes déjà amis (ou une demande attend).');
  if (current.filter((r) => r.f.status === 'ok').length >= FRIENDS_MAX) throw new Error(`Tu as déjà ${FRIENDS_MAX} amis.`);
  const users = [uid, other].sort() as [string, string];
  await setDoc(doc(db, 'friendships', pairId(uid, other)), { users, from: uid, status: 'pending', gifts: {}, claims: {}, createdAt: Date.now() });
}

export const accept = (id: string) => updateDoc(doc(ctx().db, 'friendships', id), { status: 'ok' });
export const removeFriend = (id: string) => deleteDoc(doc(ctx().db, 'friendships', id));
/** Envoie son cadeau d'énergie du jour. */
export async function sendGift(id: string): Promise<void> { const { db, uid } = ctx(); await updateDoc(doc(db, 'friendships', id), { [`gifts.${uid}`]: today(Date.now()), giftAt: serverTimestamp() }); } // giftAt : l'ami est prévenu (notification)
/** Marque le cadeau de l'ami comme reçu (l'énergie est ajoutée par l'appelant). */
export async function markClaimed(r: FriendRow): Promise<void> { const { db, uid } = ctx(); await updateDoc(doc(db, 'friendships', r.id), { [`claims.${uid}`]: r.f.gifts[r.uid] }); }

/** Fiche publique, profils et codes effacés avec le compte. */
export async function deleteSocial(): Promise<void> {
  const { db, uid } = ctx();
  const rows = await getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', uid))).catch(() => null);
  await Promise.all((rows?.docs ?? []).map((d) => deleteDoc(d.ref).catch(() => {})));
  const code = await ensureCode().catch(() => null);
  if (code) await deleteDoc(doc(db, 'codes', code)).catch(() => {});
  await deleteDoc(doc(db, 'profiles', uid)).catch(() => {});
}

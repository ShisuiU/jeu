import { doc, getDoc, setDoc, deleteDoc, addDoc, collection, query, orderBy, limit, getDocs, serverTimestamp, type Timestamp } from 'firebase/firestore/lite';
import { cloud } from './cloudCore';
import { useGame } from '../state/store';

// MODÉRATION EN LIGNE — reports/{id} (signalements), admins/{uid} (modérateurs, créés dans la console
// Firebase), bans/{uid} (joueurs bannis des fonctions en ligne). Les règles Firestore vérifient tout.
export type ReportKind = 'name' | 'chat' | 'clan' | 'behavior';
export interface Report { id: string; by: string; byName: string; target: string; targetName: string; kind: ReportKind; text: string; where: string; at: number }
export interface Ban { uid: string; name: string; reason: string; at: number }

const ctx = () => { const c = cloud(); if (!c.uid) throw Object.assign(new Error('Connecte-toi à ton compte.'), { code: 'auth' }); return c as { db: typeof c.db; uid: string }; };
const ms = (t: Timestamp | number | null | undefined) => (typeof t === 'number' ? t : t ? t.toMillis() : Date.now());

export async function sendReport(r: { target: string; targetName: string; kind: ReportKind; text: string; where: string }) {
  const { db, uid } = ctx();
  const me = useGame.getState().save!.profile.name;
  await addDoc(collection(db, 'reports'), { by: uid, byName: me.slice(0, 18), target: r.target, targetName: r.targetName.slice(0, 40), kind: r.kind, text: r.text.slice(0, 300), where: r.where.slice(0, 60), at: serverTimestamp() });
}

let adminCache: boolean | null = null;
export async function amIAdmin(): Promise<boolean> {
  const c = cloud(); if (!c.uid) return false;
  if (adminCache !== null) return adminCache;
  adminCache = (await getDoc(doc(c.db, 'admins', c.uid)).catch(() => null))?.exists() ?? false;
  return adminCache;
}
/** Le joueur est-il banni ? (pour l'expliquer dans l'écran du compte) */
export async function myBan(): Promise<Ban | null> {
  const c = cloud(); if (!c.uid) return null;
  const s = await getDoc(doc(c.db, 'bans', c.uid)).catch(() => null);
  return s?.exists() ? { ...(s.data() as Omit<Ban, 'uid' | 'at'>), uid: c.uid, at: ms(s.data().at) } : null;
}

export async function listReports(): Promise<Report[]> {
  const { db } = ctx();
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('at', 'desc'), limit(100)));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Report, 'id' | 'at'>), id: d.id, at: ms(d.data().at) }));
}
export const dismissReport = (id: string) => deleteDoc(doc(ctx().db, 'reports', id));

/** Retire un joueur des classements, de l'Arène et de la liste d'amis publique. */
export async function removeFromRanks(uid: string) {
  const { db } = ctx();
  await Promise.all(['ranks', 'defenses', 'profiles'].map((c) => deleteDoc(doc(db, c, uid)).catch(() => {})));
}
export async function banPlayer(uid: string, name: string, reason: string) {
  const { db } = ctx();
  await setDoc(doc(db, 'bans', uid), { name: name.slice(0, 40), reason: reason.slice(0, 200), at: serverTimestamp() });
  await removeFromRanks(uid);
}
export const unbanPlayer = (uid: string) => deleteDoc(doc(ctx().db, 'bans', uid));
export async function listBans(): Promise<Ban[]> {
  const { db } = ctx();
  const snap = await getDocs(query(collection(db, 'bans'), limit(100)));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Ban, 'uid' | 'at'>), uid: d.id, at: ms(d.data().at) }));
}

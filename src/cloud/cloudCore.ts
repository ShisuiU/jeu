import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider, type Auth,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, runTransaction, collection, query, orderBy, limit, getDocs, where, addDoc, serverTimestamp, connectFirestoreEmulator, type Firestore, type Timestamp } from 'firebase/firestore/lite';
import { connectAuthEmulator } from 'firebase/auth';
import { defenseDoc, defensePoints, type ArenaDefense } from '../game/arena';
import { isUnlocked } from '../game/unlocks';
import type { ArenaLogEntry } from '../save/schema';
import { rankEntry, type RankEntry, type RankField } from '../game/ranks';
import { FIREBASE_CONFIG } from './config';
import { useAccount, setCloudWanted } from './account';
import { useGame } from '../state/store';
import { useUI } from '../state/ui';
import { exportSave, importSave } from '../save/exportImport';
import { replaceSave, setSyncProvider } from '../save/saveManager';
import { SAVE_VERSION, type SaveData } from '../save/schema';
import { writeBackup } from '../save/db';
import { BALANCE } from '../data/balance';

// SAUVEGARDE EN LIGNE — Firebase Authentication (e-mail + mot de passe) et Firestore.
// Document saves/{uid} : { payload (code d'export, avec empreinte), updatedAt, revision, saveVersion }.
// Règles Firestore : chaque compte ne lit et n'écrit que son propre document.
//
// Synchronisation :
//  • on retient la dernière version synchronisée (révision) sur l'appareil ;
//  • seule la partie locale a changé → envoi ; seule la partie en ligne a changé → chargement ;
//  • les deux ont changé → on demande au joueur laquelle garder (jamais d'écrasement silencieux) ;
//  • les envois automatiques sont espacés (au plus une fois par minute, et quand l'app passe en arrière-plan)
//    et vérifient dans une transaction que la partie en ligne n'a pas changé entre-temps.

let app: FirebaseApp, auth: Auth, db: Firestore;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushAt = 0;
const PUSH_EVERY = 60_000;

type Meta = { revision: number; updatedAt: number; saveId: string };
const metaKey = (uid: string) => `aeonfall.cloud.sync.${uid}`;
const readMeta = (uid: string): Meta | null => { try { const r = localStorage.getItem(metaKey(uid)); return r ? JSON.parse(r) : null; } catch { return null; } };
const writeMeta = (uid: string, s: SaveData) => { try { localStorage.setItem(metaKey(uid), JSON.stringify({ revision: s.revision, updatedAt: s.updatedAt, saveId: s.saveId })); } catch { /* */ } };

const ERR: Record<string, string> = {
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/missing-email': 'Indique ton adresse e-mail.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Connecte-toi.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/missing-password': 'Indique un mot de passe.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cette adresse.',
  'auth/too-many-requests': 'Trop d’essais. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Pas de connexion Internet.',
  'auth/requires-recent-login': 'Par sécurité, confirme ton mot de passe.',
  'permission-denied': 'Accès refusé par le serveur.',
  'unavailable': 'Serveur injoignable (hors ligne ?).',
};
export const errText = (e: unknown) => { const c = (e as { code?: string })?.code ?? ''; return ERR[c] ?? (e instanceof Error ? e.message : 'Erreur inconnue.'); };

function ensure() {
  if (app) return;
  app = initializeApp(FIREBASE_CONFIG);
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  auth.languageCode = 'fr';
  db = getFirestore(app);
  // Tests de bout en bout : émulateurs Firebase locaux (jamais dans la version publiée).
  if (import.meta.env.VITE_FIREBASE_EMULATOR) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}
/** Accès partagé pour les autres modules en ligne (guildes, amis). */
export function cloud() { ensure(); return { db, uid: auth.currentUser?.uid ?? null }; }

/** Démarre la surveillance du compte (connexion persistée d'une session à l'autre). */
export function startCloud() {
  ensure();
  const acc = useAccount.getState();
  if (acc.started) return;
  acc.set({ started: true });
  onAuthStateChanged(auth, (u) => {
    useAccount.getState().set({ user: u ? { uid: u.uid, email: u.email } : null });
    if (u) {
      setCloudWanted(true);
      setSyncProvider({ id: 'firebase', name: 'Compte en ligne', isAvailable: async () => navigator.onLine, pull: async () => null, push: async (s) => queuePush(s) });
      void syncNow('login');
    } else {
      setSyncProvider({ id: 'local', name: 'Appareil uniquement', isAvailable: async () => true, pull: async () => null, push: async () => {} });
    }
  });
  const flush = () => { if (document.visibilityState === 'hidden') void pushNow(); };
  document.addEventListener('visibilitychange', flush);
  window.addEventListener('online', () => { void syncNow('online'); });
}

const saveRef = (uid: string) => doc(db, 'saves', uid);
const payloadOf = (s: SaveData) => ({ payload: exportSave(s), updatedAt: s.updatedAt, revision: s.revision, saveVersion: SAVE_VERSION });
const pristine = (s: SaveData) => s.stats.battlesWon === 0 && s.summons.total === 0;

async function upload(uid: string, s: SaveData) {
  await setDoc(saveRef(uid), payloadOf(s));
  writeMeta(uid, s);
  lastPushAt = Date.now();
  void publishRank(uid, s);
  void publishDefense(uid, s);
}

// CLASSEMENTS — document ranks/{uid} : pseudo, avatar et meilleurs scores, publié avec la sauvegarde.
// Règles Firestore : lecture pour tous, écriture uniquement par le propriétaire du document.
const rankRef = (uid: string) => doc(db, 'ranks', uid);
let lastRank = '';
export async function publishRank(uid: string, s: SaveData) {
  try {
    if (!s.settings.showInRanks) { if (lastRank !== 'off') { await deleteDoc(rankRef(uid)); lastRank = 'off'; } return; }
    const e = rankEntry(s);
    const key = JSON.stringify({ ...e, updatedAt: 0 });
    if (key === lastRank) return;
    await setDoc(rankRef(uid), e);
    lastRank = key;
  } catch { /* les classements ne doivent jamais gêner la sauvegarde */ }
}
/** Publie tout de suite (ex. réglage changé). */
export async function publishRankNow() {
  ensure(); const u = auth.currentUser; const s = useGame.getState().save;
  if (u && s) { lastRank = ''; await publishRank(u.uid, s); }
}
/** Les 50 meilleurs d'un classement. */
export async function fetchRanks(field: RankField): Promise<(RankEntry & { uid: string })[]> {
  ensure();
  const snap = await getDocs(query(collection(db, 'ranks'), orderBy(field, 'desc'), limit(50)));
  return snap.docs.map((d) => ({ ...(d.data() as RankEntry), uid: d.id }));
}
export const currentUid = () => { ensure(); return auth.currentUser?.uid ?? null; };

// ARÈNE RÉELLE — defenses/{uid} : l'équipe de défense (publiée avec la sauvegarde, et quand on la change).
// defenses/{uid}/log : chaque attaquant y inscrit son combat ; le défenseur le lit et l'applique à son classement.
const defenseRef = (uid: string) => doc(db, 'defenses', uid);
let lastDefense = '';
export async function publishDefense(uid: string, s: SaveData, force = false) {
  try {
    if (!s.settings.showInRanks || !isUnlocked(s, 'arena')) { if (lastDefense !== 'off') { await deleteDoc(defenseRef(uid)); lastDefense = 'off'; } return; }
    const d = defenseDoc(s, Date.now());
    const key = JSON.stringify({ ...d, updatedAt: 0 });
    if (key === lastDefense && !force) return;
    await setDoc(defenseRef(uid), d);
    lastDefense = key;
  } catch { /* l'Arène en ligne ne doit jamais gêner la sauvegarde */ }
}
export async function publishDefenseNow() {
  ensure(); const u = auth.currentUser; const s = useGame.getState().save;
  if (u && s) await publishDefense(u.uid, s, true);
}
/** Défenses de puissance proche (de 50 % à 170 % de la sienne), sans la sienne. */
export async function fetchDefenses(power: number): Promise<ArenaDefense[]> {
  ensure(); const me = auth.currentUser?.uid;
  const snap = await getDocs(query(collection(db, 'defenses'), where('power', '>=', Math.floor(power * 0.5)), where('power', '<=', Math.ceil(power * 1.7)), orderBy('power'), limit(40)));
  return snap.docs.filter((d) => d.id !== me).map((d) => ({ ...(d.data() as Omit<ArenaDefense, 'uid'>), uid: d.id }));
}
export async function fetchDefense(uid: string): Promise<ArenaDefense | null> {
  ensure(); const snap = await getDoc(defenseRef(uid));
  return snap.exists() ? { ...(snap.data() as Omit<ArenaDefense, 'uid'>), uid } : null;
}
/** Inscrit le combat dans le journal du défenseur. */
export async function postArenaLog(defUid: string, s: SaveData, attackerWon: boolean, power: number) {
  ensure(); const u = auth.currentUser; if (!u) return;
  await addDoc(collection(db, 'defenses', defUid, 'log'), {
    attacker: u.uid, name: (s.profile.name || 'Lien').trim().slice(0, 18), avatar: s.profile.avatarHeroId, power: Math.round(power),
    won: attackerWon, points: defensePoints(attackerWon), at: serverTimestamp(),
  });
}
/** Les 30 derniers combats reçus ; les plus anciens (au-delà de 30) sont effacés du serveur. */
export async function fetchMyLog(): Promise<ArenaLogEntry[]> {
  ensure(); const u = auth.currentUser; if (!u) return [];
  const snap = await getDocs(query(collection(db, 'defenses', u.uid, 'log'), orderBy('at', 'desc'), limit(60)));
  const all = snap.docs.map((d) => { const x = d.data() as Omit<ArenaLogEntry, 'id' | 'at'> & { at: Timestamp | null }; return { ...x, id: d.id, at: x.at ? x.at.toMillis() : Date.now() }; });
  for (const old of snap.docs.slice(30)) void deleteDoc(old.ref).catch(() => {});
  return all.slice(0, 30);
}

async function adopt(uid: string, remote: SaveData) {
  await replaceSave(remote, 'synchronisation');
  const cur = useGame.getState().save!;
  await upload(uid, cur); // aligne la révision en ligne sur la partie adoptée
}

/** Synchronisation complète (au démarrage, à la connexion, à la demande). */
export async function syncNow(reason: 'login' | 'online' | 'manual'): Promise<void> {
  ensure();
  const u = auth.currentUser; const st = useAccount.getState();
  const local = useGame.getState().save;
  if (!u || !local || st.conflict) return;
  st.set({ status: 'syncing', error: null });
  try {
    const snap = await getDoc(saveRef(u.uid));
    const last = readMeta(u.uid);
    if (!snap.exists()) { await upload(u.uid, local); return done(reason === 'manual' ? 'Partie envoyée en ligne.' : undefined); }
    const data = snap.data() as { payload: string; revision: number; updatedAt: number };
    const remote = importSave(data.payload);
    const same = remote.saveId === local.saveId && remote.revision === local.revision;
    if (same) { writeMeta(u.uid, local); return done(); }
    if (!last || last.saveId !== remote.saveId) {
      // Première connexion sur cet appareil.
      if (pristine(local)) { await adopt(u.uid, remote); return done('Partie du compte chargée.'); }
      useAccount.getState().set({ conflict: { local, remote, remoteAt: data.updatedAt }, status: 'idle' });
      return;
    }
    const remoteChanged = data.revision !== last.revision;
    const localChanged = local.revision !== last.revision;
    if (remoteChanged && localChanged) { useAccount.getState().set({ conflict: { local, remote, remoteAt: data.updatedAt }, status: 'idle' }); return; }
    if (remoteChanged) { await adopt(u.uid, remote); return done('Partie mise à jour depuis un autre appareil.'); }
    if (localChanged) await upload(u.uid, local);
    return done();
  } catch (e) {
    useAccount.getState().set({ status: navigator.onLine ? 'error' : 'offline', error: errText(e) });
  }
}
function done(msg?: string) {
  useAccount.getState().set({ status: 'ok', lastSync: Date.now(), error: null });
  if (msg) useUI.getState().toast(msg, 'ok');
}

/** Envoi automatique, espacé, après les sauvegardes locales. */
export function queuePush(_s: SaveData) {
  if (pushTimer) return;
  const wait = Math.max(5_000, PUSH_EVERY - (Date.now() - lastPushAt));
  pushTimer = setTimeout(() => { pushTimer = null; void pushNow(); }, wait);
}

/** Envoi vérifié : seulement si la partie en ligne est celle que l'on connaît. */
export async function pushNow(): Promise<void> {
  if (!auth) return;
  const u = auth.currentUser; const st = useAccount.getState();
  const local = useGame.getState().save;
  if (!u || !local || st.conflict || !navigator.onLine) return;
  const last = readMeta(u.uid);
  if (!last) { void syncNow('online'); return; }
  if (local.revision === last.revision) return;
  try {
    const conflict = await runTransaction(db, async (tx) => {
      const snap = await tx.get(saveRef(u.uid));
      if (snap.exists() && (snap.data() as { revision: number }).revision !== last.revision) return true;
      tx.set(saveRef(u.uid), payloadOf(local));
      return false;
    });
    if (conflict) { void syncNow('online'); return; }
    writeMeta(u.uid, local); lastPushAt = Date.now();
    void publishRank(u.uid, local);
    st.set({ status: 'ok', lastSync: Date.now(), error: null });
  } catch (e) {
    st.set({ status: navigator.onLine ? 'error' : 'offline', error: errText(e) });
  }
}

/** Choix du joueur en cas de conflit. */
export async function resolve(keep: 'local' | 'remote') {
  const u = auth.currentUser; const c = useAccount.getState().conflict;
  if (!u || !c) return;
  useAccount.getState().set({ conflict: null, busy: true });
  try {
    if (keep === 'remote') await adopt(u.uid, c.remote);
    else { await writeBackup(c.remote, 'compte-en-ligne', BALANCE.autosave.maxBackups); await upload(u.uid, useGame.getState().save!); }
    done(keep === 'remote' ? 'Partie en ligne chargée.' : 'Cette partie est maintenant celle du compte.');
  } catch (e) { useAccount.getState().set({ error: errText(e) }); }
  finally { useAccount.getState().set({ busy: false }); }
}

export async function register(email: string, password: string) { ensure(); startCloud(); await createUserWithEmailAndPassword(auth, email.trim(), password); }
export async function login(email: string, password: string) { ensure(); startCloud(); await signInWithEmailAndPassword(auth, email.trim(), password); }
export async function resetPassword(email: string) { ensure(); await sendPasswordResetEmail(auth, email.trim()); }
export async function logout() {
  ensure(); await pushNow().catch(() => {});
  await signOut(auth); setCloudWanted(false);
  useAccount.getState().set({ user: null, lastSync: null, status: 'idle', conflict: null });
}
/** Supprime la sauvegarde en ligne puis le compte (la partie reste sur l'appareil). */
export async function deleteAccount(password?: string) {
  ensure(); const u = auth.currentUser; if (!u) return;
  if (password && u.email) await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
  await deleteDoc(saveRef(u.uid));
  await deleteDoc(rankRef(u.uid)).catch(() => {});
  // Défense d'Arène et son journal.
  await getDocs(collection(db, 'defenses', u.uid, 'log')).then((l) => Promise.all(l.docs.map((d) => deleteDoc(d.ref)))).catch(() => {});
  await deleteDoc(defenseRef(u.uid)).catch(() => {});
  await deleteUser(u);
  try { localStorage.removeItem(metaKey(u.uid)); } catch { /* */ }
  setCloudWanted(false);
  useAccount.getState().set({ user: null, lastSync: null, status: 'idle', conflict: null });
}

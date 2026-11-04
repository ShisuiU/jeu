import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider, type Auth,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, runTransaction, type Firestore } from 'firebase/firestore/lite';
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
  'auth/missing-email': 'Indiquez votre adresse e-mail.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Connectez-vous.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/missing-password': 'Indiquez un mot de passe.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cette adresse.',
  'auth/too-many-requests': 'Trop d’essais. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Pas de connexion Internet.',
  'auth/requires-recent-login': 'Par sécurité, confirmez votre mot de passe.',
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
}

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
  await deleteUser(u);
  try { localStorage.removeItem(metaKey(u.uid)); } catch { /* */ }
  setCloudWanted(false);
  useAccount.getState().set({ user: null, lastSync: null, status: 'idle', conflict: null });
}

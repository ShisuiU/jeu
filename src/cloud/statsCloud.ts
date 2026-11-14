import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator, type Firestore } from 'firebase/firestore/lite';
import { FIREBASE_CONFIG } from './config';
import type { DayStats } from '../game/telemetry';

// ENVOI DES STATISTIQUES ANONYMES (v1.101.0) — document stats/{jour}_{identifiant du jour}, réécrit à chaque envoi.
// Module léger (sans connexion au compte) : il ne charge que Firestore, et seulement quand il y a quelque chose à envoyer.
let db: Firestore | null = null;
function ensure(): Firestore {
  if (db) return db;
  const app: FirebaseApp = getApps().find((a) => a.name === 'stats') ?? initializeApp(FIREBASE_CONFIG, 'stats');
  db = getFirestore(app);
  if (import.meta.env.VITE_FIREBASE_EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return db;
}

export async function sendDay(d: DayStats): Promise<void> {
  const { id, ...data } = d;
  await setDoc(doc(ensure(), 'stats', `${d.day}_${id}`), { ...data, at: serverTimestamp() });
}

import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore/lite';
import { cloud } from './cloudCore';
import type { SaveData } from '../save/schema';
import { nextDue, pushTimes, type PushPrefs } from '../game/notify';
import { localPush, pushOn, saveLocal } from './pushLocal';
export { localPush, pushOn, pushSupport } from './pushLocal';

// NOTIFICATIONS — l'abonnement de ce téléphone (push/{uid}) et les heures à annoncer.
// Le serveur d'envoi (GitHub Actions, toutes les 10 minutes) lit ces heures et prévient le téléphone.
function keyBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
const fail = (msg: string) => Object.assign(new Error(msg), { code: 'push' });

/** Active les notifications. À appeler directement depuis un appui (l'iPhone l'exige pour demander l'autorisation). */
export async function enablePush(s: SaveData, permission?: Promise<NotificationPermission>): Promise<void> {
  const perm = permission ?? Notification.requestPermission(); // en premier, avant toute attente
  const { db, uid } = cloud();
  if (!uid) throw fail('Connecte-toi à ton compte pour recevoir des notifications.');
  if ((await perm) !== 'granted') throw fail('Notifications refusées. Autorise-les dans les réglages du téléphone (Notifications → Aeonfall), puis réessaie.');
  const cfg = await getDoc(doc(db, 'config', 'push')).catch(() => null);
  const vapid = cfg?.exists() ? (cfg.data() as { vapid?: string }).vapid : undefined;
  if (!vapid) throw fail('Les notifications ne sont pas encore ouvertes sur le serveur. Réessaie un peu plus tard.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub, vapid)) { await sub.unsubscribe().catch(() => {}); sub = null; }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapid) as BufferSource });
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const prefs = localPush().prefs;
  const t = pushTimes(s, Date.now());
  await setDoc(doc(db, 'push', uid), { sub: { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } }, ...t, due: 0, tz: new Date().getTimezoneOffset(), ...prefs, updatedAt: Date.now() }, { merge: true });
  saveLocal({ on: true, prefs });
  lastDue = 0;
}
function sameKey(sub: PushSubscription, vapid: string): boolean {
  const k = sub.options?.applicationServerKey; if (!k) return true;
  const a = new Uint8Array(k), b = keyBytes(vapid);
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Coupe les notifications de ce téléphone (et efface l'abonnement en ligne). */
export async function disablePush(): Promise<void> {
  saveLocal({ ...localPush(), on: false });
  try { const reg = await navigator.serviceWorker?.getRegistration(); await (await reg?.pushManager.getSubscription())?.unsubscribe(); } catch { /* */ }
  const { db, uid } = cloud();
  if (uid) await deleteDoc(doc(db, 'push', uid)).catch(() => {});
}

export async function setPushPrefs(prefs: PushPrefs): Promise<void> {
  saveLocal({ ...localPush(), prefs });
  const { db, uid } = cloud();
  if (uid && pushOn()) await updateDoc(doc(db, 'push', uid), { ...prefs, updatedAt: Date.now() });
}

let lastDue = -1;
/** Jeu quitté : envoie les heures à annoncer. Jeu repris : rien à annoncer pendant qu'on joue. */
export async function schedulePush(s: SaveData | null, playing: boolean): Promise<void> {
  if (!s || !pushOn()) return;
  const { db, uid } = cloud(); if (!uid) return;
  const now = Date.now();
  const t = pushTimes(s, now);
  const due = playing ? 0 : nextDue(t, localPush().prefs);
  if (playing && lastDue === 0) return;
  await updateDoc(doc(db, 'push', uid), { ...t, due, tz: new Date().getTimezoneOffset(), updatedAt: now }).catch(() => {});
  lastDue = due;
}

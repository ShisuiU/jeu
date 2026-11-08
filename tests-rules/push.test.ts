import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => { await t.clearFirestore(); });
const db = (uid: string) => t.authenticatedContext(uid).firestore();
const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'x', auth: 'y' } };
const push = (extra: Record<string, unknown> = {}) => ({ sub, campAt: 1, energyAt: 2, due: 0, tz: -60, camp: true, energy: true, gifts: true, updatedAt: 1, ...extra });

describe('notifications', () => {
  it('chacun gère seulement son propre abonnement', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'push/a'), push()));
    await assertSucceeds(updateDoc(doc(db('a'), 'push/a'), { due: 5, campAt: 5 }));
    await assertFails(getDoc(doc(db('b'), 'push/a')));
    await assertFails(setDoc(doc(db('b'), 'push/a'), push()));
    await assertFails(deleteDoc(doc(db('b'), 'push/a')));
    await assertSucceeds(deleteDoc(doc(db('a'), 'push/a')));
  });
  it('abonnement mal formé refusé', async () => {
    await assertFails(setDoc(doc(db('a'), 'push/a'), push({ sub: { endpoint: 'http://evil', keys: {} } })));
    await assertFails(setDoc(doc(db('a'), 'push/a'), push({ extra: 1 })));
    await assertFails(setDoc(doc(db('a'), 'push/a'), push({ due: 'bientôt' })));
  });
  it('la clé publique se lit, mais ne s’écrit pas depuis le jeu', async () => {
    await assertSucceeds(getDoc(doc(t.unauthenticatedContext().firestore(), 'config/push')));
    await assertFails(setDoc(doc(db('a'), 'config/push'), { vapid: 'x' }));
  });
  it('cadeau d’énergie daté par le serveur (pour prévenir l’ami)', async () => {
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'friendships/a_b'), { users: ['a', 'b'], from: 'a', status: 'ok', gifts: {}, claims: {}, createdAt: 1 }); });
    await assertSucceeds(updateDoc(doc(db('a'), 'friendships/a_b'), { 'gifts.a': '2026-11-08', giftAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db('b'), 'friendships/a_b'), { 'gifts.b': '2026-11-08', giftAt: 12345 }));
    await assertSucceeds(updateDoc(doc(db('b'), 'friendships/a_b'), { 'gifts.b': '2026-11-08' })); // ancienne version du jeu
  });
});

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => {
  await t.clearFirestore();
  await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'admins/mod'), { since: 1 }); });
});
const anon = () => t.unauthenticatedContext().firestore();
const day = (o: Record<string, unknown> = {}) => ({ day: '2026-11-14', v: '1.101.0', lvl: 12, ch: 304, tower: 20, bat: { campaign_w: 5, campaign_l: 2 }, def: { 'c3-4': 2 }, sum: 10, ses: 2, min: 35, at: serverTimestamp(), ...o });

describe('statistiques anonymes (v1.101.0)', () => {
  it('écrites sans compte quand la forme est correcte, relues seulement par un modérateur', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'stats/2026-11-14_abcdef123456'), day()));
    await assertSucceeds(setDoc(doc(anon(), 'stats/2026-11-14_abcdef123456'), day({ min: 40 }))); // mise à jour du jour
    await assertFails(getDocs(collection(anon(), 'stats')));
    await assertFails(getDocs(collection(t.authenticatedContext('a').firestore(), 'stats')));
    await assertSucceeds(getDocs(collection(t.authenticatedContext('mod').firestore(), 'stats')));
  });
  it('refuse les champs en trop, les nombres hors bornes et les identifiants mal formés', async () => {
    await assertFails(setDoc(doc(anon(), 'stats/2026-11-14_abcdef123456'), day({ email: 'x@y.z' })));
    await assertFails(setDoc(doc(anon(), 'stats/2026-11-14_abcdef123456'), day({ min: 5000 })));
    await assertFails(setDoc(doc(anon(), 'stats/2026-11-14_ABC'), day()));
    await assertFails(setDoc(doc(anon(), 'stats/2026-11-15_abcdef123456'), day())); // jour différent de l'identifiant
    await assertFails(setDoc(doc(anon(), 'stats/2026-11-14_abcdef123456'), day({ at: 5 })));
  });
});

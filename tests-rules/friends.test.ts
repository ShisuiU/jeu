import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => { await t.clearFirestore(); });

const db = (uid: string) => t.authenticatedContext(uid).firestore();
const profile = { name: 'Alice', avatar: 'kaedra', level: 10, power: 9000, code: 'ABC123', lend: null, updatedAt: 1 };
const fs = (extra: Record<string, unknown> = {}) => ({ users: ['a', 'b'], from: 'a', status: 'pending', gifts: {}, claims: {}, createdAt: 1, ...extra });
const seed = (data: Record<string, unknown>) => t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'friendships/a_b'), data); });

describe('profils et codes amis', () => {
  it('chacun publie sa fiche ; lisible par les joueurs connectés', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'profiles/a'), profile));
    await assertFails(setDoc(doc(db('b'), 'profiles/a'), profile));
    await assertFails(setDoc(doc(db('a'), 'profiles/a'), { ...profile, code: 'x' }));
    await assertSucceeds(getDoc(doc(db('b'), 'profiles/a')));
    await assertFails(getDoc(doc(t.unauthenticatedContext().firestore(), 'profiles/a')));
  });
  it('un code ami se réserve pour soi, une seule fois', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'codes/ABC123'), { uid: 'a' }));
    await assertFails(setDoc(doc(db('b'), 'codes/ABC124'), { uid: 'a' }));
    await assertFails(setDoc(doc(db('b'), 'codes/ABC123'), { uid: 'b' })); // déjà pris : ce serait une modification
    await assertSucceeds(getDoc(doc(db('b'), 'codes/ABC123')));
  });
});

describe('amitiés', () => {
  it('demander, et seul l’autre accepte', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'friendships/a_b'), fs()));
    await assertFails(updateDoc(doc(db('a'), 'friendships/a_b'), { status: 'ok' }));
    await assertFails(updateDoc(doc(db('c'), 'friendships/a_b'), { status: 'ok' }));
    await assertSucceeds(updateDoc(doc(db('b'), 'friendships/a_b'), { status: 'ok' }));
  });
  it('identifiant et contenu de la demande vérifiés', async () => {
    await assertFails(setDoc(doc(db('a'), 'friendships/b_a'), fs({ users: ['b', 'a'] })));
    await assertFails(setDoc(doc(db('a'), 'friendships/a_b'), fs({ from: 'b' })));
    await assertFails(setDoc(doc(db('a'), 'friendships/a_b'), fs({ status: 'ok' })));
    await assertFails(setDoc(doc(db('c'), 'friendships/a_b'), fs({ from: 'c' })));
  });
  it('cadeaux : chacun n’écrit que sa ligne, une fois amis', async () => {
    await seed(fs());
    await assertFails(updateDoc(doc(db('a'), 'friendships/a_b'), { 'gifts.a': '2026-11-09' }));
    await seed(fs({ status: 'ok' }));
    await assertSucceeds(updateDoc(doc(db('a'), 'friendships/a_b'), { 'gifts.a': '2026-11-09' }));
    await assertFails(updateDoc(doc(db('a'), 'friendships/a_b'), { 'gifts.b': '2026-11-09' }));
    await assertSucceeds(updateDoc(doc(db('b'), 'friendships/a_b'), { 'claims.b': '2026-11-09' }));
    await assertFails(updateDoc(doc(db('b'), 'friendships/a_b'), { status: 'pending' }));
  });
  it('lecture et suppression par les deux amis seulement', async () => {
    await seed(fs({ status: 'ok' }));
    await assertSucceeds(getDocs(query(collection(db('a'), 'friendships'), where('users', 'array-contains', 'a'))));
    await assertFails(getDoc(doc(db('c'), 'friendships/a_b')));
    await assertFails(deleteDoc(doc(db('c'), 'friendships/a_b')));
    await assertSucceeds(deleteDoc(doc(db('b'), 'friendships/a_b')));
  });
});

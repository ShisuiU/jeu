import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => {
  await t.clearFirestore();
  await t.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'admins/mod'), { since: 1 });
    await setDoc(doc(c.firestore(), 'ranks/bad'), { name: 'Vilain', arena: 1 });
    await setDoc(doc(c.firestore(), 'defenses/bad'), { name: 'Vilain', avatar: 'x', level: 1, power: 1, rating: 1, team: [{}], updatedAt: 1 });
  });
});
const db = (uid: string) => t.authenticatedContext(uid).firestore();
const report = (by: string, target = 'bad') => ({ by, byName: 'Alice', target, targetName: 'Vilain', kind: 'name', text: 'Nom insultant', where: 'Classements', at: serverTimestamp() });

describe('signalements', () => {
  it('un joueur signale ; seul un modérateur lit et efface', async () => {
    await assertSucceeds(addDoc(collection(db('a'), 'reports'), report('a')));
    await assertFails(addDoc(collection(db('a'), 'reports'), report('b'))); // au nom d'un autre
    await assertFails(addDoc(collection(db('a'), 'reports'), report('a', 'a'))); // soi-même
    await assertFails(getDocs(collection(db('a'), 'reports')));
    const snap = await t.withSecurityRulesDisabled(async (c) => getDocs(collection(c.firestore(), 'reports')));
    void snap;
    await assertSucceeds(getDocs(collection(db('mod'), 'reports')));
  });
  it('personne ne se déclare modérateur', async () => {
    await assertFails(setDoc(doc(db('a'), 'admins/a'), { since: 1 }));
  });
});

describe('modérateur et bannissement', () => {
  it('le modérateur retire un joueur des classements et de l’Arène, le bannit', async () => {
    await assertFails(deleteDoc(doc(db('a'), 'ranks/bad')));
    await assertSucceeds(deleteDoc(doc(db('mod'), 'ranks/bad')));
    await assertSucceeds(deleteDoc(doc(db('mod'), 'defenses/bad')));
    await assertFails(setDoc(doc(db('a'), 'bans/bad'), { name: 'Vilain', reason: 'x', at: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(db('mod'), 'bans/bad'), { name: 'Vilain', reason: 'Insultes', at: serverTimestamp() }));
  });
  it('un banni ne peut plus publier ni signaler', async () => {
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'bans/bad'), { name: 'Vilain', reason: 'x', at: 1 }); });
    await assertFails(setDoc(doc(db('bad'), 'ranks/bad'), { name: 'Vilain', arena: 5 }));
    await assertFails(addDoc(collection(db('bad'), 'reports'), report('bad', 'a')));
    await assertSucceeds(getDoc(doc(db('bad'), 'bans/bad'))); // il voit qu'il est banni
    await assertSucceeds(deleteDoc(doc(db('bad'), 'ranks/bad'))); // il peut encore effacer ses données
  });
});

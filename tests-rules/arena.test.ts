import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => { await t.clearFirestore(); });

const defense = { name: 'Alice', avatar: 'kaedra', level: 12, power: 9000, rating: 1040, team: [{ refId: 'kaedra', slot: 0, level: 40 }], updatedAt: 1 };
const log = (attacker: string) => ({ attacker, name: 'Bob', avatar: 'brann', power: 8000, won: true, points: 8, at: serverTimestamp() });

describe('sauvegardes et classements', () => {
  it('une sauvegarde est privée', async () => {
    await assertSucceeds(setDoc(doc(t.authenticatedContext('a').firestore(), 'saves/a'), { payload: 'x' }));
    await assertFails(getDoc(doc(t.authenticatedContext('b').firestore(), 'saves/a')));
  });
  it('classements : lecture pour tous, écriture par le propriétaire', async () => {
    await assertSucceeds(setDoc(doc(t.authenticatedContext('a').firestore(), 'ranks/a'), { name: 'Alice', avatar: 'kaedra', level: 1, arena: 1000, tower: 0, boss: 0, power: 100, updatedAt: 1 }));
    await assertSucceeds(getDocs(collection(t.unauthenticatedContext().firestore(), 'ranks')));
    await assertFails(setDoc(doc(t.authenticatedContext('b').firestore(), 'ranks/a'), { name: 'Pirate' }));
    await assertFails(deleteDoc(doc(t.authenticatedContext('b').firestore(), 'ranks/a')));
    await assertSucceeds(deleteDoc(doc(t.authenticatedContext('a').firestore(), 'ranks/a')));
  });
});

describe('Arène réelle', () => {
  it('chacun publie sa propre défense, valide', async () => {
    const a = t.authenticatedContext('a').firestore();
    await assertSucceeds(setDoc(doc(a, 'defenses/a'), defense));
    await assertFails(setDoc(doc(a, 'defenses/b'), defense));
    await assertFails(setDoc(doc(a, 'defenses/a'), { ...defense, team: [] }));
    await assertFails(setDoc(doc(a, 'defenses/a'), { ...defense, extra: 1 }));
    await assertFails(setDoc(doc(a, 'defenses/a'), { ...defense, name: 'x'.repeat(40) }));
  });
  it('les défenses se lisent une fois connecté', async () => {
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'defenses/a'), defense); });
    await assertSucceeds(getDoc(doc(t.authenticatedContext('b').firestore(), 'defenses/a')));
    await assertFails(getDoc(doc(t.unauthenticatedContext().firestore(), 'defenses/a')));
  });
  it('journal : l’attaquant écrit son combat, seul le défenseur le lit', async () => {
    const b = t.authenticatedContext('b').firestore();
    await assertSucceeds(addDoc(collection(b, 'defenses/a/log'), log('b')));
    await assertFails(addDoc(collection(b, 'defenses/a/log'), log('c'))); // se faire passer pour un autre
    await assertFails(addDoc(collection(b, 'defenses/a/log'), { ...log('b'), points: 500 }));
    await assertFails(addDoc(collection(b, 'defenses/b/log'), log('b'))); // pas dans son propre journal
    await assertFails(getDocs(collection(b, 'defenses/a/log')));
    await assertSucceeds(getDocs(collection(t.authenticatedContext('a').firestore(), 'defenses/a/log')));
  });
  it('seul le propriétaire efface sa défense', async () => {
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'defenses/a'), defense); });
    await assertFails(deleteDoc(doc(t.authenticatedContext('b').firestore(), 'defenses/a')));
    await assertSucceeds(deleteDoc(doc(t.authenticatedContext('a').firestore(), 'defenses/a')));
  });
});

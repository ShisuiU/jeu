import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => { await t.clearFirestore(); });
const db = (uid: string) => t.authenticatedContext(uid).firestore();
const rank = (extra: Record<string, unknown> = {}) => ({ name: 'Alice', avatar: 'kaedra', level: 20, arena: 1100, tower: 30, boss: 40, power: 20000, updatedAt: 1, at: serverTimestamp(), ...extra });

describe('anti-triche : classements', () => {
  it('valeurs plausibles acceptées, invraisemblables refusées', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'ranks/a'), rank()));
    await assertFails(setDoc(doc(db('a'), 'ranks/a'), rank({ power: 9_999_999 })));
    await assertFails(setDoc(doc(db('a'), 'ranks/a'), rank({ tower: 500 })));
    await assertFails(setDoc(doc(db('a'), 'ranks/a'), rank({ boss: 250 })));
    await assertFails(setDoc(doc(db('a'), 'ranks/a'), rank({ arena: 4000 }))); // création trop haute
  });
  it('l’Arène ne monte pas plus vite qu’en jouant', async () => {
    const tenMinAgo = Timestamp.fromMillis(Date.now() - 10 * 60_000);
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'ranks/a'), { ...rank(), at: tenMinAgo }); });
    await assertSucceeds(updateDoc(doc(db('a'), 'ranks/a'), { arena: 1150, at: serverTimestamp() }));
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'ranks/a'), { ...rank(), at: tenMinAgo }); });
    await assertFails(updateDoc(doc(db('a'), 'ranks/a'), { arena: 2500, at: serverTimestamp() }));
  });
});

describe('anti-triche : défense et boss de clan', () => {
  it('défense à la puissance impossible refusée', async () => {
    const d = { name: 'A', avatar: 'x', level: 1, power: 20000, rating: 1000, team: [{ refId: 'kaedra' }], updatedAt: 1 };
    await assertSucceeds(setDoc(doc(db('a'), 'defenses/a'), d));
    await assertFails(setDoc(doc(db('a'), 'defenses/a'), { ...d, power: 5_000_000 }));
  });
  it('dégâts de boss de clan plafonnés', async () => {
    const m = (role: string) => ({ name: 'X', avatar: 'aldric', power: 1, role, joinedAt: 1 });
    await t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'guilds/g'), { name: 'Clan', nameLower: 'clan', tag: 'C', description: '', emblem: 'x', open: true, leader: 'a', members: { a: m('leader'), b: m('member') }, count: 2, createdAt: 1, boss: { week: '2026-W45', dmg: { b: 100000 } } }); });
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'boss.dmg.b': 300000 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'boss.dmg.b': 50_000_000 }));
  });
});

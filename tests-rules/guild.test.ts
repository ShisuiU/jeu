import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, deleteField, addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { env } from './helpers';

let t: RulesTestEnvironment;
beforeAll(async () => { t = await env(); });
afterAll(async () => { await t.cleanup(); });
beforeEach(async () => { await t.clearFirestore(); });

const m = (role: 'leader' | 'member', name = 'X') => ({ name, avatar: 'kaedra', power: 1000, role, joinedAt: 1 });
const guild = (extra: Record<string, unknown> = {}) => ({
  name: 'Les Veilleurs', nameLower: 'les veilleurs', tag: 'LV', description: 'Bienvenue', emblem: 'aldric', open: true,
  leader: 'a', members: { a: m('leader', 'Alice') }, count: 1, createdAt: 1, boss: { week: '2026-W45', dmg: {} }, ...extra,
});
const db = (uid: string) => t.authenticatedContext(uid).firestore();
const seed = (data: Record<string, unknown>) => t.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'guilds/g'), data); });

describe('clans : création et lecture', () => {
  it('créer son clan, en être le chef et seul membre', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'guilds/g'), guild()));
    await assertFails(setDoc(doc(db('a'), 'guilds/h'), guild({ leader: 'b', members: { b: m('leader') } })));
    await assertFails(setDoc(doc(db('a'), 'guilds/h'), guild({ members: { a: m('leader'), b: m('member') }, count: 2 })));
    await assertFails(setDoc(doc(db('a'), 'guilds/h'), guild({ name: 'ab' })));
  });
  it('lisible par les joueurs connectés seulement', async () => {
    await seed(guild());
    await assertSucceeds(getDoc(doc(db('z'), 'guilds/g')));
    await assertFails(getDoc(doc(t.unauthenticatedContext().firestore(), 'guilds/g')));
  });
});

describe('clans : rejoindre, quitter, chef', () => {
  it('rejoindre un clan ouvert, pas un fermé ni un plein', async () => {
    await seed(guild());
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b': m('member', 'Bob'), count: 2 }));
    await assertFails(updateDoc(doc(db('c'), 'guilds/g'), { 'members.c': m('leader'), count: 3 })); // se proclamer chef
    await assertFails(updateDoc(doc(db('c'), 'guilds/g'), { 'members.c': m('member'), count: 2 })); // compte faux
    await seed(guild({ open: false }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b': m('member'), count: 2 }));
    const full: Record<string, unknown> = {}; for (let i = 0; i < 29; i++) full[`u${i}`] = m('member');
    await seed(guild({ members: { a: m('leader'), ...full }, count: 30 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b': m('member'), count: 31 }));
  });
  it('un membre ne touche qu’à sa fiche et à ses dégâts', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member') }, count: 2, boss: { week: '2026-W45', dmg: { a: 100 } } }));
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b.power': 2000, 'boss.dmg.b': 5000 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'boss.dmg.a': 0 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'boss.dmg.b': 10 })); // baisser ses dégâts
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.a.power': 1 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { open: false }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b.role': 'leader' }));
    // Nouvelle semaine : on repart de sa seule ligne.
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { boss: { week: '2026-W46', dmg: { b: 1 } } }));
  });
  it('quitter ; le chef exclut, règle, nomme un successeur', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member'), c: m('member') }, count: 3 }));
    await assertSucceeds(updateDoc(doc(db('c'), 'guilds/g'), { 'members.c': deleteField(), count: 2 }));
    await assertFails(updateDoc(doc(db('a'), 'guilds/g'), { 'members.a': deleteField(), count: 1 })); // le chef ne part pas comme ça
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.a': deleteField(), count: 1 })); // un membre n'exclut pas
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { description: 'Nouvelle', open: false }));
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { leader: 'b', 'members.a.role': 'member', 'members.b.role': 'leader' }));
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'members.a': deleteField(), count: 1 })); // le nouveau chef exclut
  });
  it('seul le dernier membre dissout le clan', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member') }, count: 2 }));
    await assertFails(deleteDoc(doc(db('a'), 'guilds/g')));
    await seed(guild());
    await assertFails(deleteDoc(doc(db('b'), 'guilds/g')));
    await assertSucceeds(deleteDoc(doc(db('a'), 'guilds/g')));
  });
});

describe('clans : adjoints', () => {
  it('le chef nomme et retire des adjoints ; pas les membres', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member'), c: m('member') }, count: 3 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { officers: ['b'] }));
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { officers: ['b'] }));
    await assertFails(updateDoc(doc(db('a'), 'guilds/g'), { officers: ['a'] })); // le chef n'est pas adjoint
    await assertFails(updateDoc(doc(db('a'), 'guilds/g'), { officers: ['z'] })); // pas un membre
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { officers: ['b', 'c'] })); // un adjoint ne nomme pas
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { officers: [] }));
  });
  it('un adjoint exclut un simple membre, règle le clan, mais n’exclut ni le chef ni un adjoint', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member'), c: m('member'), d: m('member') }, count: 4, officers: ['b', 'd'] }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.d': deleteField(), count: 3, officers: ['b'] }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.a': deleteField(), count: 3 }));
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { description: 'Par l’adjoint' }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { open: false })); // seul le chef ouvre ou ferme le clan (v1.68.21)
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'members.c': deleteField(), count: 3 }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { name: 'Renommé' }));
  });
  it('un adjoint qui part se retire de la liste ; le chef exclut un adjoint', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member'), c: m('member') }, count: 3, officers: ['b', 'c'] }));
    await assertFails(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b': deleteField(), count: 2 })); // reste adjoint fantôme
    await assertSucceeds(updateDoc(doc(db('b'), 'guilds/g'), { 'members.b': deleteField(), count: 2, officers: ['c'] }));
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { 'members.c': deleteField(), count: 1, officers: [] }));
  });
  it('nommer un adjoint chef : il quitte la liste des adjoints', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member') }, count: 2, officers: ['b'] }));
    await assertFails(updateDoc(doc(db('a'), 'guilds/g'), { leader: 'b', 'members.a.role': 'member', 'members.b.role': 'leader' }));
    await assertSucceeds(updateDoc(doc(db('a'), 'guilds/g'), { leader: 'b', 'members.a.role': 'member', 'members.b.role': 'leader', officers: [] }));
  });
});

describe('discussion de clan', () => {
  it('réservée aux membres, messages à leur nom', async () => {
    await seed(guild({ members: { a: m('leader'), b: m('member') }, count: 2 }));
    const msg = (uid: string, text = 'Salut !') => ({ uid, name: 'Bob', text, at: serverTimestamp() });
    await assertSucceeds(addDoc(collection(db('b'), 'guilds/g/chat'), msg('b')));
    await assertFails(addDoc(collection(db('b'), 'guilds/g/chat'), msg('a')));
    await assertFails(addDoc(collection(db('b'), 'guilds/g/chat'), msg('b', 'x'.repeat(300))));
    await assertFails(addDoc(collection(db('z'), 'guilds/g/chat'), msg('z')));
    await assertSucceeds(getDocs(collection(db('a'), 'guilds/g/chat')));
    await assertFails(getDocs(collection(db('z'), 'guilds/g/chat')));
  });
});

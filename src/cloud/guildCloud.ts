import {
  doc, getDoc, setDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp,
  runTransaction, deleteField, type Timestamp,
} from 'firebase/firestore/lite';
import { cloud } from './cloudCore';
import { useGame } from '../state/store';
import type { SaveData } from '../save/schema';
import { GUILD_DESC_MAX, GUILD_MAX, CHAT_MAX } from '../data/guild';
import { OFFICERS_MAX, guildWeek, maskProfanity, memberEntry, takePending, validGuildName, tagOf, type ChatMessage, type GuildDoc } from '../game/guild';

// CLANS EN LIGNE — guilds/{gid} (fiche, membres, dégâts du boss de la semaine) et guilds/{gid}/chat.
// Toutes les modifications passent par des transactions : deux joueurs qui rejoignent en même temps ne
// dépassent jamais 30 membres. Les règles Firestore (firestore.rules) vérifient chaque écriture.

const ctx = () => { const c = cloud(); if (!c.uid) throw Object.assign(new Error('Connecte-toi à ton compte.'), { code: 'auth' }); return c as { db: typeof c.db; uid: string }; };
const gref = (gid: string) => doc(cloud().db, 'guilds', gid);
export type GuildWithId = GuildDoc & { id: string };

export async function getGuild(gid: string): Promise<GuildWithId | null> {
  const snap = await getDoc(gref(gid));
  return snap.exists() ? { ...(snap.data() as GuildDoc), id: gid } : null;
}

/** Clans ouvertes (les plus peuplées d'abord), ou recherche par début de nom. */
export async function listGuilds(search = ''): Promise<GuildWithId[]> {
  const { db } = cloud();
  const q = search.trim().toLowerCase();
  const snap = q
    ? await getDocs(query(collection(db, 'guilds'), where('nameLower', '>=', q), where('nameLower', '<=', q + ''), limit(20)))
    : await getDocs(query(collection(db, 'guilds'), orderBy('count', 'desc'), limit(40)));
  // Filtre « ouvertes » côté appareil : évite un index composé à créer dans la console.
  return snap.docs.map((d) => ({ ...(d.data() as GuildDoc), id: d.id })).filter((g) => q || (g.open && g.count < GUILD_MAX)).slice(0, 20);
}

export async function createGuild(s: SaveData, name: string, description: string, open: boolean): Promise<GuildWithId> {
  const { db, uid } = ctx();
  const err = validGuildName(name); if (err) throw new Error(err);
  const n = name.trim();
  const ref = doc(collection(db, 'guilds'));
  const now = Date.now();
  const g: GuildDoc = {
    name: n, nameLower: n.toLowerCase(), tag: tagOf(n), description: maskProfanity(description.trim()).slice(0, GUILD_DESC_MAX), emblem: s.profile.avatarHeroId, open,
    leader: uid, members: { [uid]: memberEntry(s, 'leader', now) }, count: 1, createdAt: now, boss: { week: guildWeek(now), dmg: {} },
  };
  await setDoc(ref, g);
  return { ...g, id: ref.id };
}

export async function joinGuild(s: SaveData, gid: string): Promise<void> {
  const { db, uid } = ctx();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gref(gid));
    if (!snap.exists()) throw new Error('Ce clan n’existe plus.');
    const g = snap.data() as GuildDoc;
    if (g.members[uid]) return;
    if (!g.open) throw new Error('Ce clan est fermé.');
    if (g.count >= GUILD_MAX) throw new Error('Ce clan est complet.');
    tx.update(gref(gid), { [`members.${uid}`]: memberEntry(s, 'member', Date.now()), count: g.count + 1 });
  });
}

/** Quitter. Le chef seul dissout le clan (et sa discussion) ; avec d'autres membres, il nomme d'abord un chef. */
export async function leaveGuild(gid: string): Promise<'left' | 'dissolved'> {
  const { db, uid } = ctx();
  const g = await getGuild(gid);
  if (!g || !g.members[uid]) return 'left';
  if (g.leader === uid) {
    if (g.count > 1) throw new Error('Nomme d’abord un autre chef (dans la liste des membres).');
    const chat = await getDocs(collection(db, 'guilds', gid, 'chat'));
    await Promise.all(chat.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(gref(gid));
    return 'dissolved';
  }
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gref(gid)); const cur = snap.data() as GuildDoc | undefined;
    if (!cur?.members[uid]) return;
    tx.update(gref(gid), { [`members.${uid}`]: deleteField(), count: cur.count - 1, ...(cur.officers?.includes(uid) ? { officers: cur.officers.filter((x) => x !== uid) } : {}) });
  });
  return 'left';
}

export async function kickMember(gid: string, who: string): Promise<void> {
  const { db } = ctx();
  await runTransaction(db, async (tx) => {
    const cur = (await tx.get(gref(gid))).data() as GuildDoc | undefined;
    if (!cur?.members[who]) return;
    tx.update(gref(gid), { [`members.${who}`]: deleteField(), count: cur.count - 1, ...(cur.officers?.includes(who) ? { officers: cur.officers.filter((x) => x !== who) } : {}) });
  });
}

/** Le chef nomme un adjoint, ou lui retire ce rôle. */
export async function setOfficer(gid: string, who: string, on: boolean): Promise<void> {
  const { db, uid } = ctx();
  await runTransaction(db, async (tx) => {
    const cur = (await tx.get(gref(gid))).data() as GuildDoc | undefined;
    if (!cur?.members[who] || cur.leader !== uid || who === uid) return;
    const list = (cur.officers ?? []).filter((x) => x !== who);
    if (on && list.length >= OFFICERS_MAX) throw new Error(`${OFFICERS_MAX} adjoints au plus.`);
    tx.update(gref(gid), { officers: on ? [...list, who] : list });
  });
}

export async function promoteLeader(gid: string, who: string): Promise<void> {
  const { db, uid } = ctx();
  await runTransaction(db, async (tx) => {
    const cur = (await tx.get(gref(gid))).data() as GuildDoc | undefined;
    if (!cur?.members[who] || cur.leader !== uid) return;
    tx.update(gref(gid), { leader: who, [`members.${uid}.role`]: 'member', [`members.${who}.role`]: 'leader', officers: (cur.officers ?? []).filter((x) => x !== who) });
  });
}

export async function updateSettings(gid: string, patch: { description?: string; open?: boolean }): Promise<void> {
  const { db } = ctx();
  await runTransaction(db, async (tx) => {
    tx.update(gref(gid), { ...(patch.description != null ? { description: maskProfanity(patch.description.trim()).slice(0, GUILD_DESC_MAX) } : {}), ...(patch.open != null ? { open: patch.open } : {}) });
  });
}

/**
 * Met à jour sa fiche (nom, avatar, puissance) et envoie les dégâts du boss en attente.
 * Retourne le clan à jour, ou null si le joueur n'en fait plus partie (exclu, clan dissous).
 */
export async function syncMe(gid: string): Promise<GuildWithId | null> {
  const { db, uid } = ctx();
  const s = useGame.getState().save!;
  const now = Date.now();
  let pending = 0;
  // On ne touche à la sauvegarde que s'il y a des dégâts à envoyer (sinon chaque envoi relancerait une sauvegarde).
  if (s.guild.pending > 0) useGame.getState().mutate((d) => { pending = takePending(d, now); });
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(gref(gid));
      if (!snap.exists()) return null;
      const g = snap.data() as GuildDoc;
      const mine = g.members[uid];
      if (!mine) return null;
      const entry = memberEntry(s, mine.role, mine.joinedAt);
      const week = guildWeek(now);
      const boss = g.boss.week === week ? { week, dmg: { ...g.boss.dmg, [uid]: (g.boss.dmg[uid] ?? 0) + pending } } : g.boss.week < week ? { week, dmg: { [uid]: pending } } : g.boss;
      const same = JSON.stringify(entry) === JSON.stringify(mine) && pending === 0 && boss.week === g.boss.week;
      if (!same) tx.update(gref(gid), { [`members.${uid}`]: entry, boss });
      return { ...g, members: { ...g.members, [uid]: entry }, boss, id: gid };
    });
  } catch (e) {
    // Rien n'est perdu : les dégâts repartent dans la file d'attente.
    if (pending) useGame.getState().mutate((d) => { d.guild.pending += pending; });
    throw e;
  }
}

export async function listChat(gid: string): Promise<ChatMessage[]> {
  const snap = await getDocs(query(collection(cloud().db, 'guilds', gid, 'chat'), orderBy('at', 'desc'), limit(50)));
  return snap.docs.map((d) => { const x = d.data() as Omit<ChatMessage, 'id' | 'at'> & { at: Timestamp | null }; return { ...x, id: d.id, at: x.at ? x.at.toMillis() : Date.now() }; }).reverse();
}

export async function sendChat(gid: string, text: string): Promise<void> {
  const { db, uid } = ctx();
  const t = maskProfanity(text.trim()).slice(0, CHAT_MAX);
  if (!t) return;
  const s = useGame.getState().save!;
  await addDoc(collection(db, 'guilds', gid, 'chat'), { uid, name: (s.profile.name || 'Lien').trim().slice(0, 18), text: t, at: serverTimestamp() });
}

export async function deleteChat(gid: string, id: string): Promise<void> {
  await deleteDoc(doc(cloud().db, 'guilds', gid, 'chat', id));
}

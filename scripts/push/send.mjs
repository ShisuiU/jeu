// ENVOI DES NOTIFICATIONS D'AEONFALL — lancé par GitHub Actions toutes les 10 minutes
// (.github/workflows/notifications.yml). Il lit dans Firestore :
//   push/{uid}           : l'abonnement du téléphone et les heures à annoncer (camp plein, énergie au maximum) ;
//   friendships/{a_b}    : les cadeaux d'énergie envoyés récemment entre amis.
// Il a besoin d'un seul secret GitHub : FIREBASE_SERVICE_ACCOUNT (la clé du compte de service Firebase).
// Les clés d'envoi (VAPID) en sont tirées, et la clé publique est publiée dans config/push pour le jeu.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { createECDH, createHash } from 'node:crypto';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.log('Secret FIREBASE_SERVICE_ACCOUNT absent : aucune notification envoyée.'); process.exit(0); }
const sa = JSON.parse(raw);
initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT || sa.project_id } : { credential: cert(sa) });
const db = getFirestore();

// Clés VAPID stables, tirées de la clé du compte de service (rien d'autre à configurer).
const priv = createHash('sha256').update(`${sa.private_key}|aeonfall-vapid`).digest();
const ecdh = createECDH('prime256v1'); ecdh.setPrivateKey(priv);
const VAPID = { publicKey: ecdh.getPublicKey().toString('base64url'), privateKey: priv.toString('base64url') };
webpush.setVapidDetails(process.env.PUSH_SUBJECT || 'https://jeu-aeonfall.vercel.app', VAPID.publicKey, VAPID.privateKey);

const now = Date.now();
const HOUR = 3600_000;
/** Heures calmes (22 h – 8 h, heure du joueur). Même règle que src/game/notify.ts. */
const quiet = (tz) => { const h = new Date(now - (tz ?? -60) * 60_000).getUTCHours(); return h >= 22 || h < 8; };
const stats = { sent: 0, gone: 0, failed: 0, quiet: 0, playing: 0 };
/** Le joueur est dans le jeu (signe de vie de moins de 5 minutes) : on ne le dérange pas, l'annonce attend. */
const playing = (d) => typeof d.updatedAt === 'number' && now - d.updatedAt < 5 * 60_000;

async function send(ref, d, msg) {
  try {
    await webpush.sendNotification(d.sub, JSON.stringify(msg), { TTL: 6 * 3600, urgency: 'normal', topic: msg.tag });
    stats.sent++; return true;
  } catch (e) {
    // Abonnement expiré ou supprimé (application désinstallée, autorisation retirée) : on l'efface.
    if (e.statusCode === 404 || e.statusCode === 410) { await ref.delete().catch(() => {}); stats.gone++; return false; }
    console.warn('Envoi refusé', e.statusCode ?? '', String(e.body ?? e.message).slice(0, 160)); stats.failed++; return false;
  }
}

async function main() {
  // La clé publique pour le jeu (écrite seulement si elle change).
  const cfg = db.doc('config/push');
  if ((await cfg.get()).data()?.vapid !== VAPID.publicKey) await cfg.set({ vapid: VAPID.publicKey });

  // 1. Camp plein, énergie au maximum.
  const due = await db.collection('push').where('due', '>', 0).where('due', '<=', now).get();
  for (const snap of due.docs) {
    const d = snap.data();
    if (!d.sub?.endpoint) continue;
    if (quiet(d.tz)) { stats.quiet++; continue; } // réessayé à 8 h
    if (playing(d)) { stats.playing++; continue; } // réessayé quand il aura quitté le jeu
    const camp = d.camp !== false && d.campAt > 0 && d.campAt <= now && d.campSent !== d.campAt;
    const energy = d.energy !== false && d.energyAt > 0 && d.energyAt <= now && d.energySent !== d.energyAt;
    // Une annonce trop ancienne (plus d'un jour) n'a plus d'intérêt.
    const fresh = (t) => now - t < 24 * HOUR;
    const upd = {};
    if (camp) upd.campSent = d.campAt;
    if (energy) upd.energySent = d.energyAt;
    const say = [camp && fresh(d.campAt), energy && fresh(d.energyAt)];
    if (say[0] && say[1]) await send(snap.ref, d, { title: 'Ton camp est plein', body: 'Le butin t’attend, et ton énergie est au maximum.', tag: 'camp' });
    else if (say[0]) await send(snap.ref, d, { title: 'Ton camp est plein', body: 'Tes héros ont rempli leurs sacs : viens récupérer le butin.', tag: 'camp' });
    else if (say[1]) await send(snap.ref, d, { title: 'Énergie au maximum', body: 'Tes héros sont reposés et prêts à repartir à l’aventure.', tag: 'energy' });
    const left = [d.camp !== false && d.campAt > now ? d.campAt : 0, d.energy !== false && d.energyAt > now ? d.energyAt : 0].filter((x) => x > 0);
    upd.due = left.length ? Math.min(...left) : 0;
    await snap.ref.update(upd).catch(() => {});
  }

  // 2. Cadeaux d'énergie des amis (les 12 dernières heures ; chaque cadeau n'est annoncé qu'une fois).
  // Une fois par heure, toutes les amitiés sont relues : les cadeaux envoyés depuis une ancienne version du jeu
  // (sans la date d'envoi « giftAt ») sont annoncés quand même.
  const full = new Date(now).getUTCMinutes() < 10;
  const recent = full
    ? await db.collection('friendships').where('status', '==', 'ok').get()
    : await db.collection('friendships').where('giftAt', '>=', Timestamp.fromMillis(now - 12 * HOUR)).get();
  const forWho = new Map(); // destinataire → [{ from, day }]
  for (const f of recent.docs.map((x) => x.data())) {
    if (f.status !== 'ok' || !Array.isArray(f.users)) continue;
    for (const from of f.users) {
      const to = f.users.find((u) => u !== from);
      const day = f.gifts?.[from];
      if (!day || f.claims?.[to] === day) continue; // pas de cadeau, ou déjà reçu
      forWho.set(to, [...(forWho.get(to) ?? []), { from, day }]);
    }
  }
  for (const [to, gifts] of forWho) {
    const ref = db.doc(`push/${to}`);
    const d = (await ref.get()).data();
    if (!d?.sub?.endpoint || d.gifts === false) continue;
    const fresh = gifts.filter((g) => d.giftSeen?.[g.from] !== g.day);
    if (!fresh.length) continue;
    if (quiet(d.tz)) { stats.quiet++; continue; }
    if (playing(d)) { stats.playing++; continue; }
    const names = await Promise.all(fresh.slice(0, 2).map(async (g) => (await db.doc(`profiles/${g.from}`).get()).data()?.name || 'Un ami'));
    const body = fresh.length === 1 ? `${names[0]} t’a envoyé de l’énergie. Viens la récupérer !`
      : `${names[0]} et ${fresh.length - 1 === 1 ? names[1] : `${fresh.length - 1} autres amis`} t’ont envoyé de l’énergie.`;
    await send(ref, d, { title: 'Cadeau d’un ami', body, tag: 'gift' });
    // Marqué comme annoncé même si l'envoi échoue : jamais de répétition.
    await ref.update(Object.fromEntries(fresh.map((g) => [`giftSeen.${g.from}`, g.day]))).catch(() => {});
  }
  // Compte rendu (sans aucune donnée personnelle) : combien de téléphones sont inscrits, combien attendent une annonce.
  const all = await db.collection('push').get();
  const subs = all.docs.map((x) => x.data()).filter((x) => x.sub?.endpoint);
  const waiting = subs.filter((x) => x.due > 0);
  const next = waiting.length ? Math.round((Math.min(...waiting.map((x) => x.due)) - now) / 60000) : null;
  console.log(`Abonnés : ${subs.length} · annonces programmées : ${waiting.length}${next !== null ? ` (prochaine dans ${next} min)` : ''} · cadeaux récents lus : ${recent.size}`);
  console.log(`Notifications : ${stats.sent} envoyées, ${stats.quiet} reportées (nuit), ${stats.playing} reportées (joueur en jeu), ${stats.gone} abonnements expirés, ${stats.failed} échecs.`);
}

await main();
process.exit(0);

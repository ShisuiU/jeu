import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount } from '../../cloud/account';
import { GUILD_BOSS, GUILD_DESC_MAX, GUILD_MAX, GUILD_NAME_MAX, GUILD_TIERS, CHAT_MAX } from '../../data/guild';
import { OFFICERS_MAX, ROLE_HELP, ROLE_NAMES, bossTotal, claimTier, claimableTiers, clanRights, myBossDamage, roleOf, triesLeft, type ChatMessage, type ClanRole, type GuildDoc } from '../../game/guild';
import { HERO_BY_ID } from '../../data/heroes';
import { play } from '../../audio/sfx';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { RewardInline } from '../components/RewardView';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import type { GuildWithId } from '../../cloud/guildCloud';
import { ReportSheet, isBlockedUid, type ReportTarget } from '../components/ReportSheet';
import { maskProfanity } from '../../game/moderation';

// GUILDE — trouver ou créer un clan, puis : membres, discussion, boss de la semaine.
type Api = typeof import('../../cloud/guildCloud');
let api: Promise<Api> | null = null;
const gapi = () => (api ??= import('../../cloud/guildCloud'));
// Messages d'erreur en français : le code de Firebase passe avant son texte (en anglais).
const errMsg = (e: unknown) => {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'permission-denied' || /permission/i.test(String((e as Error)?.message))) return 'Action refusée par le serveur : ses règles ne sont pas à jour (fichier firestore.rules à republier dans la console Firebase).';
  if (code === 'unavailable' || /offline|network/i.test(String((e as Error)?.message))) return 'Serveur injoignable pour le moment.';
  return e instanceof Error && e.message && !/^[A-Za-z ,.:-]+$/.test(e.message) ? e.message : 'Serveur injoignable pour le moment.';
};
const avatar = (id: string) => (HERO_BY_ID[id] ? id : 'torvald');

export function Guild() {
  const save = useGame((s) => s.save)!;
  const user = useAccount((s) => s.user);
  const push = useUI((s) => s.push);
  if (!user) return (
    <Screen title="Clan">
      <Panel>
        <p className="muted" style={{ marginTop: 0 }}>Un clan réunit jusqu’à {GUILD_MAX} joueurs : une discussion, et chaque semaine un boss commun dont les dégâts de tous les membres s’additionnent. Chaque palier atteint ensemble donne une récompense à chacun.</p>
        <p className="muted">Il faut un compte pour rejoindre un clan.</p>
        <button className="btn block" onClick={() => push({ name: 'saves' })}>Créer un compte ou se connecter</button>
      </Panel>
    </Screen>
  );
  return save.guild.id ? <MyGuild gid={save.guild.id} uid={user.uid} /> : <FindGuild />;
}

function FindGuild() {
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [list, setList] = useState<GuildWithId[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [create, setCreate] = useState<{ name: string; desc: string; open: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<GuildWithId | null>(null);
  const load = useCallback((search: string) => {
    setErr(null); setList(null);
    gapi().then((g) => g.listGuilds(search)).then(setList).catch((e) => setErr(errMsg(e)));
  }, []);
  useEffect(() => { load(''); }, [load]);
  const enter = (g: GuildWithId) => { mutate((s) => { s.guild.id = g.id; s.guild.name = g.name; }); };
  const join = async (g: GuildWithId) => {
    setBusy(true);
    try { const a = await gapi(); await a.joinGuild(useGame.getState().save!, g.id); enter(g); play('claim'); toast(`Bienvenue dans ${g.name} !`, 'ok'); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  const doCreate = async () => {
    if (!create) return;
    setBusy(true);
    try { const a = await gapi(); const g = await a.createGuild(useGame.getState().save!, create.name, create.desc, create.open); enter(g); play('claim'); toast(`Clan « ${g.name} » créé.`, 'ok'); setCreate(null); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  return (
    <Screen title="Clan">
      <p className="muted" style={{ marginTop: 0 }}>Rejoins un clan ouvert, ou crée le tien.</p>
      <form className="row" style={{ gap: 8, marginBottom: 10 }} onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input className="text-input grow" placeholder="Chercher un clan par son nom" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher un clan" />
        <button className="btn secondary small" type="submit">Chercher</button>
      </form>
      <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setCreate({ name: '', desc: '', open: true })}>Créer un clan</button>
      {err && <p className="hint warn">{err}</p>}
      {!list && !err && <p className="faint" style={{ textAlign: 'center' }}>Chargement…</p>}
      {list && list.length === 0 && <p className="faint" style={{ textAlign: 'center' }}>{q ? 'Aucun clan de ce nom.' : 'Aucun clan ouvert pour l’instant : crée le premier !'}</p>}
      {list?.map((g) => (
        <div key={g.id} className="cl-card">
          <button className="cl-open" onClick={() => setPreview(g)} aria-label={`Voir le clan ${g.name}`} />
          <span className="cl-emb"><HeroArt heroId={avatar(g.emblem)} /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{g.name}</b> <span className="cl-tag">{g.tag}</span>
            <div className="faint">{g.count}/{GUILD_MAX} membres{g.open ? '' : ' · fermé'}</div>
            {g.description && <div className="faint cl-desc">{g.description}</div>}
          </div>
          <button className="btn small" disabled={busy || !g.open || g.count >= GUILD_MAX} onClick={() => void join(g)}>Rejoindre</button>
        </div>
      ))}
      {list && list.length > 0 && <p className="faint" style={{ textAlign: 'center' }}>Touche un clan pour voir ses membres.</p>}
      {preview && <ClanPreview g={preview} busy={busy} onClose={() => setPreview(null)} onJoin={() => { const g = preview; setPreview(null); void join(g); }} />}
      {create && (
        <Modal onClose={() => setCreate(null)}>
          <h3 style={{ marginTop: 0 }}>Nouveau clan</h3>
          <label className="faint">Nom<input className="text-input" maxLength={GUILD_NAME_MAX} value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} autoFocus /></label>
          <label className="faint" style={{ display: 'block', marginTop: 8 }}>Présentation<input className="text-input" maxLength={GUILD_DESC_MAX} value={create.desc} onChange={(e) => setCreate({ ...create, desc: e.target.value })} /></label>
          <label className="row" style={{ gap: 8, marginTop: 10 }}><input type="checkbox" checked={create.open} onChange={(e) => setCreate({ ...create, open: e.target.checked })} /> Ouverte : tout le monde peut rejoindre</label>
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn secondary grow" onClick={() => setCreate(null)}>Annuler</button>
            <button className="btn grow" disabled={busy} onClick={() => void doCreate()}>Créer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

function MyGuild({ gid, uid }: { gid: string; uid: string }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const [g, setG] = useState<GuildWithId | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'boss' | 'chat' | 'members'>('boss');
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  const refresh = useCallback(async () => {
    try {
      const a = await gapi();
      const cur = await a.syncMe(gid);
      if (!cur) { mutate((s) => { s.guild.id = ''; s.guild.name = ''; }); toast('Tu ne fais plus partie de ce clan.'); return; }
      setG(cur); setErr(null);
      if (cur.name !== useGame.getState().save!.guild.name) mutate((s) => { s.guild.name = cur.name; });
    } catch (e) { setErr(errMsg(e)); }
  }, [gid, mutate, toast]);
  useEffect(() => { void refresh(); }, [refresh]);
  if (!g) return <Screen title="Clan">{err ? <p className="hint warn">{err}</p> : <p className="faint" style={{ textAlign: 'center' }}>Chargement du clan…</p>}</Screen>;

  const leader = g.leader === uid;
  const total = bossTotal(g, now);
  const mine = myBossDamage(g, uid, now) + save.guild.pending;
  const claim = claimableTiers(save, g, uid, now);
  const tries = triesLeft(save, now);
  const act = async (fn: (a: Api) => Promise<unknown>, ok: string) => { try { await fn(await gapi()); toast(ok, 'ok'); await refresh(); } catch (e) { toast(errMsg(e), 'error'); } };
  const leave = () => setConfirm({ text: leader && g.count === 1 ? `Tu es le dernier membre : ${g.name} sera dissous.` : `Quitter ${g.name} ?`, run: async () => {
    try { const a = await gapi(); await a.leaveGuild(gid); mutate((s) => { s.guild.id = ''; s.guild.name = ''; }); toast('Tu as quitté le clan.'); } catch (e) { toast(errMsg(e), 'error'); }
  } });
  const next = GUILD_TIERS.find((t) => total < t.dmg);
  return (
    <Screen title={g.name} right={<button className="btn secondary small" onClick={() => void refresh()}>Actualiser</button>}>
      <div className="cl-head">
        <span className="cl-emb big"><HeroArt heroId={avatar(g.emblem)} /></span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div><span className="cl-tag">{g.tag}</span> <span className="faint">{g.count}/{GUILD_MAX} membres · {g.open ? 'ouvert' : 'fermé'}</span></div>
          {g.description && <div className="muted cl-desc">{g.description}</div>}
        </div>
      </div>
      <div className="seg" style={{ marginBottom: 10 }}>
        <button className={tab === 'boss' ? 'on' : ''} onClick={() => setTab('boss')}>Boss{claim.length > 0 && <span className="seg-dot" />}</button>
        <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>Discussion</button>
        <button className={tab === 'members' ? 'on' : ''} onClick={() => setTab('members')}>Membres · {g.count}</button>
      </div>

      {tab === 'boss' && (
        <>
          <Panel>
            <div className="row" style={{ gap: 10 }}>
              <span className="cl-boss"><EnemyArt enemyId={GUILD_BOSS.enemy} /></span>
              <div className="grow">
                <b>{GUILD_BOSS.name}</b>
                <div className="faint">Boss de la semaine · {GUILD_BOSS.turnLimit} actions par combat</div>
                <div className="faint">Essais aujourd’hui : <b style={{ color: 'var(--gold-hi)' }}>{tries}</b>/{GUILD_BOSS.triesPerDay}</div>
              </div>
            </div>
            <div className="row between" style={{ marginTop: 10 }}><span>Dégâts du clan</span><b>{fmt(total)}</b></div>
            <div className="progress" style={{ marginTop: 4 }}><div style={{ width: `${Math.min(100, (total / GUILD_TIERS[GUILD_TIERS.length - 1].dmg) * 100)}%` }} /></div>
            <div className="row between faint" style={{ marginTop: 4 }}><span>Tes dégâts : {fmt(mine)}</span><span>{next ? `Prochain palier : ${fmt(next.dmg)}` : 'Tous les paliers atteints !'}</span></div>
            <button className="btn block" style={{ marginTop: 12 }} disabled={tries <= 0} onClick={() => push({ name: 'prep', spec: { mode: 'guildboss' } })}>{tries > 0 ? 'Attaquer le boss' : 'Reviens demain'}</button>
          </Panel>
          <Panel title="Paliers du clan">
            {GUILD_TIERS.map((t, i) => {
              const reached = total >= t.dmg; const can = claim.includes(i);
              const got = save.guild.claimed.includes(i) && save.guild.week === g.boss.week;
              return (
                <div key={i} className={`stat-row ${reached ? '' : 'dim'}`} style={{ alignItems: 'center' }}>
                  <span style={{ minWidth: 0 }}><b>{fmt(t.dmg)}</b><RewardInline reward={t.reward} /></span>
                  {got ? <span className="faint">Récupéré</span> : can ? <button className="btn small" onClick={() => { let r = null as unknown; mutate((s) => { r = claimTier(s, g, uid, i, Date.now()); }); if (r) { play('claim'); toast('Récompense de clan récupérée.', 'ok'); } }}>Récupérer</button> : <span className="faint">{reached ? 'Attaque d’abord' : 'À atteindre'}</span>}
                </div>
              );
            })}
            <p className="hint" style={{ marginBottom: 0 }}>Chaque palier atteint par le clan récompense tous les membres qui ont attaqué au moins une fois cette semaine.</p>
          </Panel>
        </>
      )}

      {tab === 'chat' && <Chat gid={gid} uid={uid} leader={leader || roleOf(g, uid) === 'officer'} />}

      {tab === 'members' && <Members g={g} uid={uid} now={now} act={act} confirm={setConfirm} leave={leave} />}

      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <p style={{ marginTop: 0, textAlign: 'center' }}>{confirm.text}</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setConfirm(null)}>Annuler</button>
            <button className="btn grow" onClick={() => { const c = confirm; setConfirm(null); void c.run(); }}>Confirmer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

/** Discussion : les 50 derniers messages, actualisés toutes les 8 s tant que l'onglet est ouvert. */
function Chat({ gid, uid, leader }: { gid: string; uid: string; leader: boolean }) {
  const toast = useUI((s) => s.toast);
  const [msgs, setMsgs] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const blocked = useGame((s) => s.save?.blocked);
  const endRef = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => { try { setMsgs(await (await gapi()).listChat(gid)); } catch (e) { toast(errMsg(e), 'error'); } }, [gid, toast]);
  useEffect(() => { void load(); const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 8000); return () => clearInterval(t); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [msgs?.length]);
  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try { await (await gapi()).sendChat(gid, text); setText(''); await load(); } catch (e) { toast(errMsg(e), 'error'); } finally { setSending(false); }
  };
  return (
    <Panel>
      <div className="cl-chat">
        {msgs === null && <p className="faint" style={{ textAlign: 'center' }}>Chargement…</p>}
        {msgs?.length === 0 && <p className="faint" style={{ textAlign: 'center' }}>Aucun message. Dis bonjour à ton clan !</p>}
        {msgs?.filter((m) => !isBlockedUid(blocked, m.uid)).map((m) => (
          <div key={m.id} className={`cl-msg ${m.uid === uid ? 'me' : ''}`}>
            <div className="cl-msg-h"><b>{maskProfanity(m.name)}</b> <span className="faint">{new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              {m.uid !== uid && <button className="cl-del" aria-label={`Signaler le message de ${m.name}`} onClick={() => setReport({ uid: m.uid, name: m.name, kind: 'chat', text: m.text, where: 'Discussion de clan' })}>⚑</button>}
              {(m.uid === uid || leader) && <button className="cl-del" aria-label="Effacer le message" onClick={() => void (async () => { try { await (await gapi()).deleteChat(gid, m.id); await load(); } catch (e) { toast(errMsg(e), 'error'); } })()}>×</button>}
            </div>
            <div className="cl-msg-t">{maskProfanity(m.text)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {report && <ReportSheet target={report} onClose={() => setReport(null)} />}
      <form className="row" style={{ gap: 8, marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input className="text-input grow" maxLength={CHAT_MAX} placeholder="Écrire à ton clan…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        <button className="btn small" type="submit" disabled={sending || !text.trim()}>Envoyer</button>
      </form>
    </Panel>
  );
}

const ROLE_ORDER: Record<ClanRole, number> = { leader: 0, officer: 1, member: 2 };

/** Membres du clan : rôles, puissance, dégâts de la semaine ; toucher un membre ouvre sa fiche (actions selon ton rôle). */
function Members({ g, uid, now, act, confirm, leave }: {
  g: GuildWithId; uid: string; now: number;
  act: (fn: (a: Api) => Promise<unknown>, ok: string) => Promise<void>;
  confirm: (c: { text: string; run: () => Promise<void> }) => void; leave: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [desc, setDesc] = useState<string | null>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const me = roleOf(g, uid);
  const list = Object.entries(g.members).sort((a, b) => ROLE_ORDER[roleOf(g, a[0])] - ROLE_ORDER[roleOf(g, b[0])] || b[1].power - a[1].power);
  const officers = (g.officers ?? []).length;
  const m = sel ? g.members[sel] : null;
  const r = sel ? clanRights(g, uid, sel) : null;
  return (
    <>
      <Panel title="Les rôles du clan">
        {(['leader', 'officer', 'member'] as ClanRole[]).map((k) => (
          <div key={k} className="stat-row"><b className={`cl-role ${k}`}>{ROLE_NAMES[k]}{k === 'officer' ? ` · ${officers}/${OFFICERS_MAX}` : ''}</b><span className="faint" style={{ maxWidth: '62%', textAlign: 'right' }}>{ROLE_HELP[k]}</span></div>
        ))}
      </Panel>
      <Panel title={`Membres · ${g.count}/${GUILD_MAX}`}>
        <p className="faint" style={{ marginTop: 0 }}>Ton rôle : <b className={`cl-role ${me}`}>{ROLE_NAMES[me]}</b>{me === 'leader' ? ' · touche un membre pour le nommer adjoint, chef, ou l’exclure.' : me === 'officer' ? ' · touche un simple membre pour l’exclure.' : ''}</p>
        {list.map(([id, mm]) => {
          const role = roleOf(g, id);
          return (
            <button key={id} className="cl-member" onClick={() => setSel(id)} aria-label={`Fiche de ${mm.name}`}>
              <span className="xp-ava" style={{ width: 40, height: 40, flexShrink: 0 }}><HeroArt heroId={avatar(mm.avatar)} /></span>
              <span className="grow" style={{ minWidth: 0, textAlign: 'left' }}>
                <b>{mm.name}</b>{id === uid && <span className="faint"> (toi)</span>}
                <div className="faint">Puissance {fmt(mm.power)} · dégâts de la semaine {fmt(myBossDamage(g, id, now))}</div>
              </span>
              <span className={`cl-role ${role}`}>{ROLE_NAMES[role]}</span>
            </button>
          );
        })}
      </Panel>
      {clanRights(g, uid, uid).settings && (
        <Panel title="Réglages du clan">
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => void act((a) => a.updateSettings(g.id, { open: !g.open }), g.open ? 'Clan fermé.' : 'Clan ouvert.')}>{g.open ? 'Fermer le clan' : 'Ouvrir le clan'}</button>
            <button className="btn secondary grow" onClick={() => setDesc(g.description)}>Présentation</button>
          </div>
        </Panel>
      )}
      <button className="btn secondary block" style={{ marginBottom: 12 }} onClick={leave}>Quitter le clan</button>

      {m && sel && r && (
        <Modal onClose={() => setSel(null)}>
          <div className="row" style={{ gap: 12, marginBottom: 10 }}>
            <span className="xp-ava" style={{ width: 64, height: 64, flexShrink: 0 }}><HeroArt heroId={avatar(m.avatar)} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0 }}>{m.name}</h3>
              <span className={`cl-role ${roleOf(g, sel)}`}>{ROLE_NAMES[roleOf(g, sel)]}</span>
              <div className="faint" style={{ marginTop: 4 }}>{ROLE_HELP[roleOf(g, sel)]}</div>
            </div>
          </div>
          <div className="stat-row"><span>Puissance</span><b>{fmt(m.power)}</b></div>
          <div className="stat-row"><span>Dégâts du boss cette semaine</span><b>{fmt(myBossDamage(g, sel, now))}</b></div>
          <div className="stat-row"><span>Membre depuis</span><b>{new Date(m.joinedAt).toLocaleDateString('fr-FR')}</b></div>
          <div className="cl-actions">
            {r.officer && (roleOf(g, sel) === 'officer'
              ? <button className="btn secondary" onClick={() => { setSel(null); void act((a) => a.setOfficer(g.id, sel, false), `${m.name} redevient membre.`); }}>Retirer le rôle d’adjoint</button>
              : <button className="btn" onClick={() => { setSel(null); void act((a) => a.setOfficer(g.id, sel, true), `${m.name} est adjoint.`); }}>Nommer adjoint</button>)}
            {r.leader && <button className="btn secondary" onClick={() => { setSel(null); confirm({ text: `Nommer ${m.name} chef du clan ? Tu deviendras simple membre.`, run: () => act((a) => a.promoteLeader(g.id, sel), `${m.name} est le nouveau chef.`) }); }}>Nommer chef</button>}
            {sel !== uid && <button className="btn secondary" onClick={() => { const t = { uid: sel, name: m.name, kind: 'name' as const, where: 'Membres du clan' }; setSel(null); setReport(t); }}>Signaler ou bloquer</button>}
            {r.kick && <button className="btn danger" onClick={() => { setSel(null); confirm({ text: `Exclure ${m.name} du clan ?`, run: () => act((a) => a.kickMember(g.id, sel), `${m.name} a été exclu.`) }); }}>Exclure</button>}
            {!r.officer && !r.leader && !r.kick && <p className="faint" style={{ margin: 0, textAlign: 'center' }}>{sel === uid ? 'C’est toi !' : 'Seuls le chef et les adjoints gèrent les membres.'}</p>}
          </div>
          <button className="btn secondary block" style={{ marginTop: 10 }} onClick={() => setSel(null)}>Fermer</button>
        </Modal>
      )}
      {report && <ReportSheet target={report} onClose={() => setReport(null)} />}
      {desc != null && (
        <Modal onClose={() => setDesc(null)}>
          <h3 style={{ marginTop: 0 }}>Présentation du clan</h3>
          <input className="text-input" maxLength={GUILD_DESC_MAX} value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus aria-label="Présentation du clan" />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setDesc(null)}>Annuler</button>
            <button className="btn grow" onClick={() => { const d = desc; setDesc(null); void act((a) => a.updateSettings(g.id, { description: d }), 'Présentation enregistrée.'); }}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Aperçu d'un clan avant de le rejoindre : présentation et membres. */
export function ClanPreview({ g, onJoin, onClose, busy }: { g: GuildDoc & { id: string }; onJoin: () => void; onClose: () => void; busy: boolean }) {
  const list = Object.entries(g.members).sort((a, b) => ROLE_ORDER[roleOf(g, a[0])] - ROLE_ORDER[roleOf(g, b[0])] || b[1].power - a[1].power);
  const power = list.reduce((a, [, m]) => a + m.power, 0);
  return (
    <Modal onClose={onClose}>
      <div className="row" style={{ gap: 12, marginBottom: 8 }}>
        <span className="cl-emb big"><HeroArt heroId={avatar(g.emblem)} /></span>
        <div style={{ minWidth: 0 }}><h3 style={{ margin: 0 }}>{g.name} <span className="cl-tag">{g.tag}</span></h3><div className="faint">{g.count}/{GUILD_MAX} membres · puissance totale {fmt(power)}</div></div>
      </div>
      {g.description && <p className="muted" style={{ marginTop: 0 }}>{g.description}</p>}
      <div className="cl-preview-list">
        {list.map(([id, m]) => (
          <div key={id} className="stat-row" style={{ alignItems: 'center' }}>
            <span className="row" style={{ gap: 8, minWidth: 0 }}><span className="xp-ava" style={{ width: 32, height: 32, flexShrink: 0 }}><HeroArt heroId={avatar(m.avatar)} /></span><b>{m.name}</b></span>
            <span className="row" style={{ gap: 6 }}>{roleOf(g, id) !== 'member' && <span className={`cl-role ${roleOf(g, id)}`}>{ROLE_NAMES[roleOf(g, id)]}</span>}<span className="faint">{fmt(m.power)}</span></span>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn secondary grow" onClick={onClose}>Fermer</button>
        <button className="btn grow" disabled={busy || !g.open || g.count >= GUILD_MAX} onClick={onJoin}>{!g.open ? 'Clan fermé' : g.count >= GUILD_MAX ? 'Complet' : 'Rejoindre'}</button>
      </div>
    </Modal>
  );
}

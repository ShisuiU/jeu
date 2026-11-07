import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount } from '../../cloud/account';
import { GUILD_BOSS, GUILD_DESC_MAX, GUILD_MAX, GUILD_NAME_MAX, GUILD_TIERS, CHAT_MAX } from '../../data/guild';
import { bossTotal, claimTier, claimableTiers, myBossDamage, triesLeft, type ChatMessage } from '../../game/guild';
import { HERO_BY_ID } from '../../data/heroes';
import { play } from '../../audio/sfx';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { RewardInline } from '../components/RewardView';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import type { GuildWithId } from '../../cloud/guildCloud';

// GUILDE — trouver ou créer un clan, puis : membres, discussion, boss de la semaine.
type Api = typeof import('../../cloud/guildCloud');
let api: Promise<Api> | null = null;
const gapi = () => (api ??= import('../../cloud/guildCloud'));
const errMsg = (e: unknown) => (e instanceof Error && e.message && !/^[A-Z_]+$/.test(e.message) ? e.message : (e as { code?: string })?.code === 'permission-denied' ? 'Les clans ne sont pas encore ouverts sur le serveur.' : 'Serveur injoignable pour le moment.');
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
          <span className="cl-emb"><HeroArt heroId={avatar(g.emblem)} /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{g.name}</b> <span className="cl-tag">{g.tag}</span>
            <div className="faint">{g.count}/{GUILD_MAX} membres{g.open ? '' : ' · fermé'}</div>
            {g.description && <div className="faint cl-desc">{g.description}</div>}
          </div>
          <button className="btn small" disabled={busy || !g.open || g.count >= GUILD_MAX} onClick={() => void join(g)}>Rejoindre</button>
        </div>
      ))}
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
  const members = Object.entries(g.members).sort((a, b) => (a[1].role === 'leader' ? -1 : b[1].role === 'leader' ? 1 : b[1].power - a[1].power));
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
        <button className={tab === 'members' ? 'on' : ''} onClick={() => setTab('members')}>Membres</button>
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

      {tab === 'chat' && <Chat gid={gid} uid={uid} leader={leader} />}

      {tab === 'members' && (
        <Panel>
          {members.map(([id, m]) => (
            <div key={id} className="stat-row" style={{ alignItems: 'center' }}>
              <span className="row" style={{ gap: 8, minWidth: 0 }}>
                <span className="xp-ava" style={{ width: 36, height: 36, flexShrink: 0 }}><HeroArt heroId={avatar(m.avatar)} /></span>
                <span style={{ minWidth: 0 }}><b>{m.name}</b>{m.role === 'leader' && <span className="cl-tag" style={{ marginLeft: 6 }}>Chef</span>}{id === uid && <span className="faint"> (toi)</span>}
                  <div className="faint">Puissance {fmt(m.power)} · dégâts {fmt(myBossDamage(g, id, now))}</div></span>
              </span>
              {leader && id !== uid && (
                <span className="row" style={{ gap: 4 }}>
                  <button className="btn small secondary" onClick={() => setConfirm({ text: `Nommer ${m.name} chef du clan ? Tu deviendras membre.`, run: () => act((a) => a.promoteLeader(gid, id), `${m.name} est le nouveau chef.`) })}>Chef</button>
                  <button className="btn small secondary" onClick={() => setConfirm({ text: `Exclure ${m.name} du clan ?`, run: () => act((a) => a.kickMember(gid, id), `${m.name} a été exclu.`) })}>Exclure</button>
                </span>
              )}
            </div>
          ))}
          {leader && (
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn secondary grow" onClick={() => void act((a) => a.updateSettings(gid, { open: !g.open }), g.open ? 'Clan fermé.' : 'Clan ouvert.')}>{g.open ? 'Fermer le clan' : 'Ouvrir le clan'}</button>
            </div>
          )}
          <button className="btn secondary block" style={{ marginTop: 10 }} onClick={leave}>Quitter le clan</button>
        </Panel>
      )}

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
        {msgs?.map((m) => (
          <div key={m.id} className={`cl-msg ${m.uid === uid ? 'me' : ''}`}>
            <div className="cl-msg-h"><b>{m.name}</b> <span className="faint">{new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              {(m.uid === uid || leader) && <button className="cl-del" aria-label="Effacer le message" onClick={() => void (async () => { try { await (await gapi()).deleteChat(gid, m.id); await load(); } catch (e) { toast(errMsg(e), 'error'); } })()}>×</button>}
            </div>
            <div className="cl-msg-t">{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="row" style={{ gap: 8, marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input className="text-input grow" maxLength={CHAT_MAX} placeholder="Écrire à ton clan…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        <button className="btn small" type="submit" disabled={sending || !text.trim()}>Envoyer</button>
      </form>
    </Panel>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount } from '../../cloud/account';
import { HERO_BY_ID } from '../../data/heroes';
import { FRIENDS_MAX, GIFT_ENERGY, canGift, claimsLeft, giftWaiting, receiveGift } from '../../game/friends';
import { play } from '../../audio/sfx';
import { Panel, Screen, fmt } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';
import type { FriendRow } from '../../cloud/friendsCloud';

// AMIS — ton code ami, les demandes, et chaque jour : un cadeau d'énergie à envoyer à chaque ami,
// et leurs cadeaux à recevoir. Leur meilleur héros peut venir en renfort en campagne et en donjon.
type Api = typeof import('../../cloud/friendsCloud');
let api: Promise<Api> | null = null;
export const fapi = () => (api ??= import('../../cloud/friendsCloud'));
const errMsg = (e: unknown) => (e instanceof Error && e.message && !/^[A-Z_]+$/.test(e.message) && !/permission|PERMISSION/.test(e.message) ? e.message : (e as { code?: string })?.code === 'permission-denied' || /permission/i.test(String(e)) ? 'Les amis ne sont pas encore ouverts sur le serveur.' : 'Serveur injoignable pour le moment.');
const avatar = (id?: string) => (id && HERO_BY_ID[id] ? id : 'torvald');

export function Friends() {
  const user = useAccount((s) => s.user);
  const push = useUI((s) => s.push);
  if (!user) return (
    <Screen title="Amis">
      <Panel>
        <p className="muted" style={{ marginTop: 0 }}>Ajoute tes amis avec leur code : chaque jour, vous vous envoyez de l’énergie, et le meilleur héros d’un ami peut venir en renfort dans tes combats.</p>
        <p className="muted">Il faut un compte pour avoir des amis.</p>
        <button className="btn block" onClick={() => push({ name: 'saves' })}>Créer un compte ou se connecter</button>
      </Panel>
    </Screen>
  );
  return <FriendsBody uid={user.uid} />;
}

function FriendsBody({ uid }: { uid: string }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [code, setCode] = useState<string | null>(null);
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const a = await fapi();
      await a.publishProfile(useGame.getState().save!);
      setCode(await a.ensureCode());
      setRows(await a.listFriends()); setErr(null);
    } catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: (a: Api) => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { await fn(await fapi()); if (ok) toast(ok, 'ok'); await load(); } catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  const friends = rows?.filter((r) => r.f.status === 'ok') ?? [];
  const incoming = rows?.filter((r) => r.f.status === 'pending' && r.f.from !== uid) ?? [];
  const outgoing = rows?.filter((r) => r.f.status === 'pending' && r.f.from === uid) ?? [];
  const toSend = friends.filter((r) => canGift(r.f, uid, now));
  const toReceive = friends.filter((r) => giftWaiting(r.f, uid));
  const left = claimsLeft(save, now);

  const receive = async (list: FriendRow[]) => {
    let got = 0;
    for (const r of list.slice(0, left)) {
      try { await (await fapi()).markClaimed(r); let ok = false; mutate((s) => { ok = receiveGift(s, Date.now()); }); if (ok) got++; } catch (e) { toast(errMsg(e), 'error'); break; }
    }
    if (got) { play('claim'); toast(`+${got * GIFT_ENERGY} énergie reçue de tes amis.`, 'ok'); }
    await load();
  };
  const sendAll = () => run(async (a) => { for (const r of toSend) await a.sendGift(r.id); }, `Énergie envoyée à ${toSend.length} ami${toSend.length > 1 ? 's' : ''}.`);
  const copy = async () => { if (!code) return; try { await navigator.clipboard.writeText(code); toast('Code copié.', 'ok'); } catch { toast(`Ton code : ${code}`); } };

  return (
    <Screen title="Amis" right={<button className="btn secondary small" onClick={() => void load()}>Actualiser</button>}>
      <Panel title="Ton code ami">
        <div className="row between">
          <b className="fr-code">{code ?? '······'}</b>
          <button className="btn secondary small" disabled={!code} onClick={() => void copy()}>Copier</button>
        </div>
        <p className="faint" style={{ marginBottom: 0 }}>Donne-le à un ami : il l’entre ci-dessous de son côté, puis tu acceptes sa demande.</p>
        <form className="row" style={{ gap: 8, marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); if (!rows) return; const c = input; void run(async (a) => { const n = await a.addByCode(c, rows); toast(`Demande envoyée à ${n}.`, 'ok'); setInput(''); }); }}>
          <input className="text-input grow fr-input" placeholder="Code d’un ami" value={input} maxLength={8} onChange={(e) => setInput(e.target.value.toUpperCase())} aria-label="Code d’un ami" />
          <button className="btn small" type="submit" disabled={busy || input.trim().length < 6}>Ajouter</button>
        </form>
      </Panel>

      {err && <p className="hint warn">{err}</p>}
      {!rows && !err && <p className="faint" style={{ textAlign: 'center' }}>Chargement…</p>}

      {incoming.length > 0 && (
        <Panel title="Demandes reçues">
          {incoming.map((r) => (
            <div key={r.id} className="stat-row" style={{ alignItems: 'center' }}>
              <Who r={r} />
              <span className="row" style={{ gap: 4 }}>
                <button className="btn small" disabled={busy} onClick={() => void run((a) => a.accept(r.id), `Tu es ami avec ${r.profile?.name ?? 'ce joueur'}.`)}>Accepter</button>
                <button className="btn small secondary" disabled={busy} onClick={() => void run((a) => a.removeFriend(r.id))}>Refuser</button>
              </span>
            </div>
          ))}
        </Panel>
      )}

      {rows && (
        <Panel title={`Amis · ${friends.length}/${FRIENDS_MAX}`}>
          {friends.length === 0 && <p className="faint" style={{ margin: 0 }}>Pas encore d’amis. Partage ton code !</p>}
          {friends.length > 0 && (
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <button className="btn small grow" disabled={busy || !toSend.length} onClick={() => void sendAll()}><Icon.energy size={14} /> Tout envoyer ({toSend.length})</button>
              <button className="btn small grow" disabled={busy || !toReceive.length || left <= 0} onClick={() => void receive(toReceive)}><Icon.energy size={14} /> Tout recevoir ({Math.min(toReceive.length, left)})</button>
            </div>
          )}
          {friends.map((r) => (
            <div key={r.id} className="stat-row" style={{ alignItems: 'center' }}>
              <Who r={r} />
              <span className="row" style={{ gap: 4 }}>
                {giftWaiting(r.f, uid) && left > 0 && <button className="btn small" disabled={busy} onClick={() => void receive([r])} aria-label={`Recevoir l’énergie de ${r.profile?.name}`}>+{GIFT_ENERGY}<Icon.energy size={12} /></button>}
                <button className="btn small secondary" disabled={busy || !canGift(r.f, uid, now)} onClick={() => void run((a) => a.sendGift(r.id), 'Énergie envoyée.')} aria-label={`Envoyer de l’énergie à ${r.profile?.name}`}>{canGift(r.f, uid, now) ? 'Envoyer' : 'Envoyé'}</button>
              </span>
            </div>
          ))}
          {friends.length > 0 && <p className="hint" style={{ marginBottom: 0 }}>Chaque jour : un cadeau de {GIFT_ENERGY} énergie par ami, {claimsLeft(save, now)} cadeau{left > 1 ? 'x' : ''} encore à recevoir aujourd’hui. Le meilleur héros d’un ami peut te rejoindre en campagne et en donjon (une fois par jour et par ami).</p>}
        </Panel>
      )}

      {outgoing.length > 0 && (
        <Panel title="Demandes envoyées">
          {outgoing.map((r) => (
            <div key={r.id} className="stat-row" style={{ alignItems: 'center' }}>
              <Who r={r} />
              <button className="btn small secondary" disabled={busy} onClick={() => void run((a) => a.removeFriend(r.id))}>Annuler</button>
            </div>
          ))}
        </Panel>
      )}
      {friends.length > 0 && (
        <details className="fr-manage"><summary className="faint">Retirer un ami</summary>
          {friends.map((r) => <button key={r.id} className="btn secondary small" style={{ margin: 4 }} disabled={busy} onClick={() => void run((a) => a.removeFriend(r.id), `${r.profile?.name ?? 'Ami'} retiré.`)}>{r.profile?.name ?? '?'}</button>)}
        </details>
      )}
    </Screen>
  );
}

function Who({ r }: { r: FriendRow }) {
  const p = r.profile;
  return (
    <span className="row" style={{ gap: 8, minWidth: 0 }}>
      <span className="xp-ava" style={{ width: 38, height: 38, flexShrink: 0 }}><HeroArt heroId={avatar(p?.avatar)} /></span>
      <span style={{ minWidth: 0 }}>
        <b>{p?.name ?? 'Joueur'}</b>
        <div className="faint">{p ? `Niv. ${p.level} · puissance ${fmt(p.power)}${p.lend ? ` · prête ${HERO_BY_ID[p.lend.refId]?.name.split(/[ ,]/)[0] ?? '?'}` : ''}` : 'Fiche indisponible'}</div>
      </span>
    </span>
  );
}

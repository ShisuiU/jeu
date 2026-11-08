import { useState } from 'react';
import { useGame } from '../../state/store';
import { canClaimDaily } from '../../game/daily';
import { DailyBody } from './Daily';
import { useUI } from '../../state/ui';
import { MAIL, mailFlag } from '../../data/mail';
import { applyReward } from '../../game/rewards';
import { play } from '../../audio/sfx';
import { Panel, Screen } from '../components/common';
import { RewardView } from '../components/RewardView';
import { useEffect, useCallback } from 'react';
import { useAccount } from '../../cloud/account';
import { useGifts } from '../../state/gifts';
import { GIFT_ENERGY, canGift, claimsLeft, giftWaiting, receiveGift } from '../../game/friends';
import { fapi } from './Friends';
import { Icon } from '../art/Icons';
import type { FriendRow } from '../../cloud/friendsCloud';

// COURRIER — un seul endroit pour les cadeaux : la récompense de connexion du jour et les messages.
type MailTab = 'daily' | 'gifts' | 'messages';
export function Mail({ tab: initial }: { tab?: MailTab }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const user = useAccount((s) => s.user);
  const gifts = useGifts((s) => s.waiting);
  const [tab, setTab] = useState<MailTab>(initial ?? (canClaimDaily(save, now) ? 'daily' : gifts > 0 && user ? 'gifts' : unreadMail(save.flags) ? 'messages' : 'daily'));
  const unread = MAIL.filter((m) => !save.flags[mailFlag(m.id)]).length;
  return (
    <Screen title="Courrier">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Connexion{canClaimDaily(save, now) && <span className="seg-count">1</span>}</button>
        {user && <button className={tab === 'gifts' ? 'on' : ''} onClick={() => setTab('gifts')}>Cadeaux{gifts > 0 && <span className="seg-count">{gifts}</span>}</button>}
        <button className={tab === 'messages' ? 'on' : ''} onClick={() => setTab('messages')}>Messages{unread > 0 && <span className="seg-count">{unread}</span>}</button>
      </div>
      {tab === 'daily' && <DailyBody />}
      {tab === 'gifts' && user && <GiftInbox uid={user.uid} />}
      {tab === 'messages' && MAIL.map((m) => {
        const claimed = !!save.flags[mailFlag(m.id)];
        return (
          <Panel key={m.id} title={m.title}>
            <div className="faint">De : {m.from}</div>
            <p className="lore">{m.text}</p>
            <RewardView reward={m.reward} />
            <button className="btn block" style={{ marginTop: 12 }} disabled={claimed} onClick={() => {
              mutate((s) => { if (!s.flags[mailFlag(m.id)]) { applyReward(s, m.reward); s.flags[mailFlag(m.id)] = true; } });
              play('claim'); toast('Récompense récupérée.', 'ok');
            }}>{claimed ? 'Déjà récupéré' : 'Récupérer'}</button>
          </Panel>
        );
      })}
    </Screen>
  );
}

export const unreadMail = (flags: Record<string, boolean>) => MAIL.some((m) => !flags[mailFlag(m.id)]);

/** CADEAUX — l'énergie envoyée par les amis, à récupérer (et à leur rendre) sans passer par l'écran Amis. */
function GiftInbox({ uid }: { uid: string }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    try { const a = await fapi(); setRows(await a.listFriends()); void a.refreshGifts(); setErr(false); } catch { setErr(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const friends = rows?.filter((r) => r.f.status === 'ok') ?? [];
  const waiting = friends.filter((r) => giftWaiting(r.f, uid));
  const toSend = friends.filter((r) => canGift(r.f, uid, now));
  const left = claimsLeft(save, now);
  const receive = async () => {
    setBusy(true); let got = 0;
    try {
      const a = await fapi();
      for (const r of waiting.slice(0, left)) { await a.markClaimed(r); let ok = false; mutate((s) => { ok = receiveGift(s, Date.now()); }); if (ok) got++; }
      if (got) { play('claim'); toast(`+${got * GIFT_ENERGY} énergie reçue de tes amis.`, 'ok'); }
    } catch { toast('Serveur injoignable pour le moment.', 'error'); }
    finally { setBusy(false); await load(); }
  };
  const sendAll = async () => {
    setBusy(true);
    try { const a = await fapi(); for (const r of toSend) await a.sendGift(r.id); play('claim'); toast(`Énergie envoyée à ${toSend.length} ami${toSend.length > 1 ? 's' : ''}.`, 'ok'); }
    catch { toast('Serveur injoignable pour le moment.', 'error'); }
    finally { setBusy(false); await load(); }
  };
  if (err) return <p className="hint warn">Cadeaux indisponibles pour le moment (connexion ?).</p>;
  if (!rows) return <p className="faint" style={{ textAlign: 'center' }}>Chargement…</p>;
  if (!friends.length) return (
    <Panel title="Cadeaux d’amis">
      <p className="faint" style={{ marginTop: 0 }}>Chaque jour, tes amis peuvent t’envoyer {GIFT_ENERGY} énergie. Ajoute des amis avec leur code pour en recevoir.</p>
      <button className="btn block" onClick={() => push({ name: 'friends' })}>Mes amis</button>
    </Panel>
  );
  return (
    <>
      <Panel title={`Cadeaux reçus · ${waiting.length}`}>
        {waiting.length === 0 && <p className="faint" style={{ margin: 0 }}>Aucun cadeau en attente. Ils arrivent ici dès qu’un ami t’envoie de l’énergie.</p>}
        {waiting.map((r) => (
          <div key={r.id} className="stat-row" style={{ alignItems: 'center' }}>
            <b>{r.profile?.name ?? 'Un ami'}</b>
            <span className="row" style={{ gap: 4 }}>+{GIFT_ENERGY}<Icon.energy size={14} /></span>
          </div>
        ))}
        {waiting.length > 0 && <button className="btn block" style={{ marginTop: 10 }} disabled={busy || left <= 0} onClick={() => void receive()}>{left > 0 ? `Tout récupérer (+${Math.min(waiting.length, left) * GIFT_ENERGY} énergie)` : 'Limite du jour atteinte'}</button>}
        <p className="hint" style={{ marginBottom: 0 }}>Même avec l’énergie pleine, tu peux récupérer : le surplus est gardé. {left} cadeau{left > 1 ? 'x' : ''} encore récupérable{left > 1 ? 's' : ''} aujourd’hui.</p>
      </Panel>
      <Panel title="Rendre la pareille">
        <p className="faint" style={{ marginTop: 0 }}>{toSend.length ? `${toSend.length} ami${toSend.length > 1 ? 's n’ont' : ' n’a'} pas encore reçu ton énergie aujourd’hui.` : 'Tu as envoyé ton énergie à tous tes amis aujourd’hui.'}</p>
        <button className="btn secondary block" disabled={busy || !toSend.length} onClick={() => void sendAll()}><Icon.energy size={14} /> Tout envoyer ({toSend.length})</button>
      </Panel>
    </>
  );
}

import { useEffect, useState } from 'react';
import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { arenaTier } from '../../data/arena';
import { TOWER_FLOORS } from '../../data/tower';
import { loadCloud } from '../../cloud/account';
import type { RankEntry } from '../../game/ranks';
import type { ArenaDefense } from '../../game/arena';
import { maskProfanity } from '../../game/moderation';
import { HeroArt } from '../art/HeroArt';
import { useUI } from '../../state/ui';
import { Modal, fmt } from './common';

// APERÇU D'UN JOUEUR (v1.70.1) — touché dans un classement : avatar, nom, niveau, scores, et son équipe de défense
// d'Arène quand elle est en ligne. Signaler ou bloquer reste possible, en bas.
export function PlayerCard({ uid, entry, ghost, signedIn, self, canReport, onReport, onClose }: { uid: string; entry: RankEntry; ghost?: boolean; signedIn?: boolean; self?: boolean; canReport?: boolean; onReport?: () => void; onClose: () => void }) {
  const toast = useUI((s) => s.toast);
  // Demande d'ami (v1.75.1) : selon les amitiés déjà en place, bouton « Demander en ami », « Demande envoyée » ou « Déjà ami ».
  const [fr, setFr] = useState<'loading' | 'none' | 'pending' | 'ok' | 'off' | 'sending'>(ghost || !signedIn || self ? 'off' : 'loading');
  useEffect(() => {
    if (ghost || !signedIn || self) return;
    let alive = true;
    import('../../cloud/friendsCloud').then((m) => m.listFriends()).then((rows) => {
      if (!alive) return;
      const r = rows.find((x) => x.uid === uid);
      setFr(!r ? 'none' : r.f.status === 'ok' ? 'ok' : 'pending');
    }).catch(() => { if (alive) setFr('off'); });
    return () => { alive = false; };
  }, [uid, ghost, signedIn, self]);
  const askFriend = async () => {
    setFr('sending');
    try {
      const m = await import('../../cloud/friendsCloud');
      await m.addByUid(uid, await m.listFriends());
      setFr('pending'); toast(`Demande d’ami envoyée à ${maskProfanity(entry.name)}.`, 'ok');
    } catch (e) { setFr('none'); toast(e instanceof Error && e.message ? e.message : 'Serveur injoignable pour le moment.'); }
  };
  const [team, setTeam] = useState<ArenaDefense | null | 'loading'>(ghost || !signedIn ? null : 'loading');
  useEffect(() => {
    if (ghost || !signedIn) return;
    let alive = true;
    loadCloud().then((c) => c.fetchDefense(uid)).then((d) => { if (alive) setTeam(d && d.team?.length ? d : null); }).catch(() => { if (alive) setTeam(null); });
    return () => { alive = false; };
  }, [uid, ghost, signedIn]);
  const tier = arenaTier(entry.arena || 0);
  const avatar = HERO_BY_ID[entry.avatar] ? entry.avatar : 'aldric';
  return (
    <Modal onClose={onClose}>
      <div className="pc-head">
        <div className="pc-ava"><HeroArt heroId={avatar} /><span className="pf-lvl">{entry.level}</span></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="pc-name">{maskProfanity(entry.name)}</b>
          <div className="faint">{ghost ? 'Héritier imaginaire' : `Niveau de compte ${entry.level}`}</div>
          {entry.arena > 0 && <div className="pc-tier" style={{ color: tier.color }}>Ligue {tier.name}</div>}
        </div>
      </div>
      <div className="pf-grid pc-grid">
        <div><b>{entry.arena ? fmt(entry.arena) : '–'}</b><span>Arène · points</span></div>
        <div><b>{entry.tower ? <>{entry.tower}<small>/{TOWER_FLOORS}</small></> : '–'}</b><span>Tour des Âges</span></div>
        <div><b>{entry.boss ? fmt(entry.boss) : '–'}</b><span>Boss mondial · record</span></div>
        <div><b>{entry.power ? fmt(entry.power) : '–'}</b><span>Puissance d’équipe</span></div>
      </div>
      {!ghost && (
        <>
          <div className="pf-sub">Équipe de défense (Arène)</div>
          {team === 'loading' ? <p className="faint" style={{ margin: '4px 0' }}>Chargement…</p>
            : team ? (
              <div className="pc-team">
                {[...team.team].sort((a, b) => a.slot - b.slot).map((h) => (
                  <div key={h.slot} className="pc-hero" style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[h.refId].rarity].color }} title={HERO_BY_ID[h.refId].name}>
                    <HeroArt heroId={h.refId} /><span>{h.level}</span>
                  </div>
                ))}
              </div>
            ) : <p className="faint" style={{ margin: '4px 0' }}>{signedIn ? 'Pas d’équipe de défense en ligne.' : 'Crée un compte pour voir son équipe.'}</p>}
        </>
      )}
      {fr !== 'off' && (
        <button className="btn block" style={{ marginTop: 14 }} disabled={fr !== 'none'} onClick={() => void askFriend()}>
          {fr === 'loading' ? '…' : fr === 'sending' ? 'Envoi…' : fr === 'pending' ? 'Demande d’ami envoyée' : fr === 'ok' ? 'Déjà dans tes amis' : 'Demander en ami'}
        </button>
      )}
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button className="btn secondary grow" onClick={onClose}>Fermer</button>
        {canReport && onReport && <button className="btn danger grow" onClick={onReport}>Signaler ou bloquer</button>}
      </div>
    </Modal>
  );
}

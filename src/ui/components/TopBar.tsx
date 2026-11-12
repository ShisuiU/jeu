import { AccountXp } from './AccountXp';
import { useGame } from '../../state/store';
import { Counter } from './Counter';
import { useUI } from '../../state/ui';
import { BALANCE } from '../../data/balance';
import { energyMax, msToNextEnergy } from '../../game/energy';
import { formatDuration } from '../../core/time';
import { Icon } from '../art/Icons';
import { HeroArt } from '../art/HeroArt';
import { Modal } from './common';
import { useState } from 'react';
import { refillCost, refillEnergy } from '../../game/comfort';
import { play } from '../../audio/sfx';
import { isUnlocked } from '../../game/unlocks';
import avatarRing from '../../assets/home/avatar_ring.webp';

export function TopBar() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const e = save.energy;
  const eMax = energyMax(save.profile.level);
  const next = msToNextEnergy(e, now, eMax);
  const [open, setOpen] = useState(false);
  const mutate = useGame((s) => s.mutate);
  const cost = refillCost(save);
  return (
    <div className="topbar">
      {/* Kit SpriteCook (v1.72.4) : anneau d'avatar doré avec médaillon de niveau, compteurs à cadre peint (icône et « + » dans l'image). */}
      <button className="avatar-btn" onClick={() => push({ name: 'profile' })} aria-label="Mon profil">
        <div className="avatar-wrap kit"><div className="avatar"><HeroArt heroId={save.profile.avatarHeroId} /></div><img className="avatar-ring" src={avatarRing} alt="" draggable={false} /><span className="avatar-lvl" aria-hidden>{save.profile.level}</span></div>
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div className="player-name">{save.profile.name}</div>
          <AccountXp level={save.profile.level} xp={save.profile.xp} compact />
        </div>
      </button>
      <div className="pill-wrap">
        <button className="pill kit k-energy" onClick={() => setOpen(true)} aria-label="Énergie">
          <span className={e.current > eMax ? 'over-cap' : ''}><Counter id="energy" value={e.current} format={String} /></span><small>/{eMax}</small>
        </button>
        {e.current < eMax && <span className="pill-timer">{formatDuration(next)}</span>}
      </div>
      <button className="pill kit k-gold" onClick={() => push({ name: 'inventory' })} aria-label="Or"><Counter id="gold" value={save.resources.gold} />
        <span className="pill-plus" role="button" aria-label="Marché" onClick={(ev) => { ev.stopPropagation(); push(isUnlocked(save, 'market') ? { name: 'market' } : { name: 'inventory' }); }} /></button>
      {/* Diamants (v1.78.0) : la monnaie précieuse, extraite à la Mine des Bâtiments. */}
      <button className="pill kit k-diamond" onClick={() => push({ name: 'buildings' })} aria-label="Diamants"><Counter id="diamonds" value={save.resources.diamonds ?? 0} />
        <span className="pill-plus" role="button" aria-label="Bâtiments" onClick={(ev) => { ev.stopPropagation(); push({ name: 'buildings' }); }} /></button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2>Énergie</h2>
          <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 800 }}><Icon.energy size={30} /> {e.current}<span className="faint" style={{ fontSize: 16 }}> / {eMax}</span></div>
          <p className="faint" style={{ textAlign: 'center' }}>{e.current > eMax ? 'Bonus au-delà du maximum grâce aux récompenses (la régénération reprend sous le maximum).' : e.current >= eMax ? 'Énergie au maximum (la régénération est en pause).' : `+1 dans ${formatDuration(next)} · 1 point toutes les ${BALANCE.energy.regenMs / 60000} min, même jeu fermé.`}</p>
          <p className="faint" style={{ textAlign: 'center', marginTop: 0 }}>Ton maximum grandit de {BALANCE.energy.perLevel} à chaque niveau de compte (jusqu’à {BALANCE.energy.maxCap}), et chaque nouveau niveau recharge toute ton énergie.</p>
          <div className="panel" style={{ marginTop: 8 }}>
            <div className="row between"><b>Recharge +{BALANCE.energyRefill.amount}</b><span className="faint">{BALANCE.energyRefill.costs.length - save.shop.energyRefills} / {BALANCE.energyRefill.costs.length} aujourd’hui</span></div>
            <button className="btn block" style={{ marginTop: 10 }} disabled={cost === null || save.resources.crystals < (cost ?? 0)} onClick={() => { let r = { ok: false } as { ok: boolean; reason?: string }; mutate((d) => { r = refillEnergy(d); }); if (r.ok) { play('claim'); toast(`+${BALANCE.energyRefill.amount} énergie !`, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error'); }}>
              {cost === null ? 'Plus de recharge aujourd’hui' : <>Recharger · <Icon.crystal size={16} /> {cost}</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

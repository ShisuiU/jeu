import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BALANCE } from '../../data/balance';
import { msToNextEnergy } from '../../game/energy';
import { formatDuration } from '../../core/time';
import { Icon } from '../art/Icons';
import { HeroArt } from '../art/HeroArt';
import { fmt, Modal } from './common';
import { useState } from 'react';
import { refillCost, refillEnergy } from '../../game/comfort';
import { play } from '../../audio/sfx';

export function TopBar() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const e = save.energy;
  const next = msToNextEnergy(e, now);
  const [open, setOpen] = useState(false);
  const mutate = useGame((s) => s.mutate);
  const cost = refillCost(save);
  return (
    <div className="topbar">
      <button className="avatar-btn" onClick={() => push({ name: 'settings' })}>
        <div className="avatar"><HeroArt heroId={save.profile.avatarHeroId} /></div>
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div className="player-name">{save.profile.name}</div>
          <div className="player-lvl">Niveau {save.profile.level}</div>
        </div>
      </button>
      <button className="pill" onClick={() => setOpen(true)}>
        <Icon.energy size={20} /> {e.current}<small>/{BALANCE.energy.max}</small>
      </button>
      <button className="pill" onClick={() => push({ name: 'inventory' })}><Icon.coin size={20} />{fmt(save.resources.gold)}</button>
      <button className="pill" onClick={() => push({ name: 'inventory' })}><Icon.crystal size={20} />{fmt(save.resources.crystals)}</button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2>Énergie</h2>
          <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 800 }}><Icon.energy size={30} /> {e.current}<span className="faint" style={{ fontSize: 16 }}> / {BALANCE.energy.max}</span></div>
          <p className="faint" style={{ textAlign: 'center' }}>{e.current >= BALANCE.energy.max ? 'Énergie au maximum (la régénération est en pause).' : `+1 dans ${formatDuration(next)} · 1 point toutes les ${BALANCE.energy.regenMs / 60000} min, même jeu fermé.`}</p>
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

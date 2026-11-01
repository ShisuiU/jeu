import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BALANCE } from '../../data/balance';
import { msToNextEnergy } from '../../game/energy';
import { formatDuration } from '../../core/time';
import { Icon } from '../art/Icons';
import { HeroArt } from '../art/HeroArt';
import { fmt } from './common';

export function TopBar() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const e = save.energy;
  const next = msToNextEnergy(e, now);
  return (
    <div className="topbar">
      <button className="avatar-btn" onClick={() => push({ name: 'settings' })}>
        <div className="avatar"><HeroArt heroId={save.profile.avatarHeroId} /></div>
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div className="player-name">{save.profile.name}</div>
          <div className="player-lvl">Niveau {save.profile.level}</div>
        </div>
      </button>
      <button className="pill" onClick={() => toast(e.current >= BALANCE.energy.max ? 'Énergie au maximum.' : `+1 énergie dans ${formatDuration(next)} · 1 point / ${BALANCE.energy.regenMs / 60000} min`)}>
        <Icon.energy size={20} /> {e.current}<small>/{BALANCE.energy.max}</small>
      </button>
      <button className="pill" onClick={() => push({ name: 'inventory' })}><Icon.coin size={20} />{fmt(save.resources.gold)}</button>
      <button className="pill" onClick={() => push({ name: 'inventory' })}><Icon.crystal size={20} />{fmt(save.resources.crystals)}</button>
    </div>
  );
}

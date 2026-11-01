import type { Reward } from '../../data/resources';
import { RESOURCES } from '../../data/resources';
import { ResourceIcon, Icon } from '../art/Icons';
import { fmt } from './common';

export function RewardView({ reward }: { reward: Reward }) {
  return (
    <div className="reward-list">
      {Object.entries(reward).map(([k, v], i) => {
        const def = k === 'energy' ? null : RESOURCES[k as keyof typeof RESOURCES];
        return (
          <div key={k} className="reward-item" style={{ animationDelay: `${i * 0.08}s` }}>
            {def ? <ResourceIcon icon={def.icon} color={def.color} size={34} /> : <Icon.energy size={34} />}
            <b>{fmt(v ?? 0)}</b>
            <span className="muted">{def ? def.name : 'Énergie'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function rewardMainIcon(r: Reward, size = 20) {
  const k = Object.keys(r)[0];
  if (!k || k === 'energy') return <Icon.energy size={size} />;
  const def = RESOURCES[k as keyof typeof RESOURCES];
  return <ResourceIcon icon={def.icon} color={def.color} size={size} />;
}

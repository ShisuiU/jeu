import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { DAILY_REWARDS, type DailyRewardDef } from '../../data/dailyRewards';
import { canClaimDaily } from '../../game/daily';
import { formatDuration, msUntilReset } from '../../core/time';
import { play } from '../../audio/sfx';
import { Modal, Panel, Screen } from '../components/common';
import { RewardView, rewardMainIcon } from '../components/RewardView';

export function Daily() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const rollback = useGame((s) => s.clockRollback);
  const claim = useGame((s) => s.claimDaily);
  const toast = useUI((s) => s.toast);
  const [got, setGot] = useState<DailyRewardDef | null>(null);
  const can = canClaimDaily(save, now);
  const idx = save.daily.cycleIndex;
  // Cases réclamées : celles avant l'index courant (ou toutes jusqu'à l'index si on vient de réclamer).
  const current = can ? idx : -1;

  const onClaim = () => {
    const r = claim();
    if (r) { play('claim'); setGot(r); } else toast('Déjà réclamée aujourd’hui.', 'error');
  };

  return (
    <Screen title="Connexion quotidienne">
      <Panel>
        <div className="row between" style={{ marginBottom: 10, alignItems: 'baseline' }}>
          <span className="muted" style={{ whiteSpace: 'nowrap' }}><b style={{ color: 'var(--gold-hi)', fontSize: 18 }}>{save.daily.totalLogins}</b> jour(s)</span>
          <span className="faint" style={{ whiteSpace: 'nowrap' }}>Prochain dans {formatDuration(msUntilReset(now))}</span>
        </div>
        <div className="daily-grid">
          {DAILY_REWARDS.map((d, i) => (
            <div key={d.day} className={`daily-cell ${i < idx ? 'claimed' : ''} ${i === current ? 'current' : ''} ${d.major ? 'major' : ''}`}>
              <span className="d">J{d.day}</span>
              {rewardMainIcon(d.reward)}
              <span>{Object.values(d.reward)[0]}</span>
            </div>
          ))}
        </div>
        <p className="faint" style={{ marginTop: 10, marginBottom: 0 }}>Manquer un jour ne fait rien perdre. Grosses récompenses les jours 7, 14, 21 et 28.</p>
      </Panel>
      {rollback && <div className="hint warn" style={{ marginTop: 12 }}>L’horloge de l’appareil semble avoir reculé. Les récompenses temporelles reprendront quand l’heure aura rattrapé la dernière heure connue.</div>}
      <Panel title={can ? `Récompense du jour ${DAILY_REWARDS[idx].day}` : 'Prochaine récompense'}>
        <RewardView reward={DAILY_REWARDS[idx].reward} />
        <button className="btn block" style={{ marginTop: 14 }} disabled={!can} onClick={onClaim}>
          {can ? <>Réclamer<span className="shine" /></> : `Revenez dans ${formatDuration(msUntilReset(now))}`}
        </button>
      </Panel>
      {got && (
        <Modal onClose={() => setGot(null)}>
          <h2>Récompense obtenue</h2>
          <RewardView reward={got.reward} />
          <button className="btn block" style={{ marginTop: 16 }} onClick={() => setGot(null)}>Continuer</button>
        </Modal>
      )}
    </Screen>
  );
}

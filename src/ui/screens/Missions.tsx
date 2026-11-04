import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { DAILY_BONUS, DAILY_MISSIONS, WEEKLY_BONUS, WEEKLY_MISSIONS } from '../../data/missions';
import { ACHIEVEMENTS } from '../../data/achievements';
import { bonusAvailable, claimableByTab, claimAchievement, claimBonus, claimMission, missionState, type MissionKind } from '../../game/missions';
import { formatDuration, msUntilReset, msUntilWeekReset } from '../../core/time';
import { play } from '../../audio/sfx';
import { RESOURCES } from '../../data/resources';
import { Panel, Screen } from '../components/common';
import { RewardView, rewardMainIcon } from '../components/RewardView';

function Row({ title, value, target, reward, claimed, onClaim }: { title: string; value: number; target: number; reward: Parameters<typeof rewardMainIcon>[0]; claimed: boolean; onClaim: () => void }) {
  const done = value >= target;
  return (
    <div className={`mission ${claimed ? 'claimed' : ''}`}>
      <div className="m-ic">{rewardMainIcon(reward, 24)}</div>
      <div className="grow">
        <div className="m-title">{title}</div>
        <div className="progress" style={{ margin: '5px 0 3px' }}><div style={{ width: `${Math.min(100, (value / target) * 100)}%` }} /></div>
        <div className="faint">{Object.entries(reward).map(([k, v]) => `+${v} ${k === 'energy' ? 'énergie' : RESOURCES[k as keyof typeof RESOURCES]?.name ?? k}`).join(' · ')}</div>
      </div>
      {claimed ? <span className="m-done">✓</span> : done ? <button className="btn small" onClick={onClaim}>Réclamer</button> : <span className="m-count">{Math.min(value, target)}/{target}</span>}
    </div>
  );
}

export function Missions() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [tab, setTab] = useState<'daily' | 'weekly' | 'progress'>('daily');
  const claim = (fn: (s: typeof save) => boolean) => { let ok = false; mutate((s) => { ok = fn(s); }); if (ok) { play('claim'); toast('Récompense obtenue !', 'ok'); } };
  const kind = tab as MissionKind;
  const list = tab === 'daily' ? DAILY_MISSIONS : WEEKLY_MISSIONS;
  const counts = claimableByTab(save);
  return (
    <Screen title="Missions">
      <div className="seg" style={{ marginBottom: 12 }}>
        {([['daily', 'Journalières'], ['weekly', 'Hebdo'], ['progress', 'Progression']] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}{counts[id] > 0 && <span className="seg-count">{counts[id]}</span>}
          </button>
        ))}
      </div>
      {tab !== 'progress' && (
        <>
          <p className="faint" style={{ marginTop: 0 }}>Renouvellement dans {formatDuration(tab === 'daily' ? msUntilReset(now) : msUntilWeekReset(now))}</p>
          <Panel>
            {list.map((m) => { const st = missionState(save, kind, m.id); return <Row key={m.id} title={m.title} value={st.value} target={m.target} reward={m.reward} claimed={st.claimed} onClaim={() => claim((s) => claimMission(s, kind, m.id))} />; })}
          </Panel>
          <Panel title={tab === 'daily' ? 'Coffre du jour (toutes les missions)' : 'Coffre de la semaine (toutes les missions)'}>
            <RewardView reward={tab === 'daily' ? DAILY_BONUS : WEEKLY_BONUS} />
            <button className="btn block" style={{ marginTop: 10 }} disabled={!bonusAvailable(save, kind)} onClick={() => claim((s) => claimBonus(s, kind))}>{save.missions[kind].bonus ? 'Déjà ouvert' : 'Ouvrir le coffre'}</button>
          </Panel>
        </>
      )}
      {tab === 'progress' && (
        <Panel>
          {ACHIEVEMENTS.map((a) => { const [v, t] = a.progress(save); return <Row key={a.id} title={a.title} value={v} target={t} reward={a.reward} claimed={save.achievements.includes(a.id)} onClaim={() => claim((s) => claimAchievement(s, a.id))} />; })}
        </Panel>
      )}
    </Screen>
  );
}

import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { DAILY_BONUS, DAILY_MISSIONS, WEEKLY_BONUS, WEEKLY_MISSIONS } from '../../data/missions';
import { ACHIEVEMENTS } from '../../data/achievements';
import { bonusAvailable, claimAchievement, claimBonus, claimMission, missionState, type MissionKind, claimEventTask, eventTaskState } from '../../game/missions';
import { activeEvents, bannerAvailable } from '../../game/events';
import { canStart } from '../../game/modes';
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
        <div className="faint">{Math.min(value, target)} / {target} · {Object.entries(reward).map(([k, v]) => `+${v} ${k === 'energy' ? 'énergie' : RESOURCES[k as keyof typeof RESOURCES]?.name ?? k}`).join(' · ')}</div>
      </div>
      {claimed ? <span className="chip">Reçu</span> : <button className="btn small" disabled={!done} onClick={onClaim}>{done ? 'Réclamer' : 'En cours'}</button>}
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
  return (
    <Screen title="Missions">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Journalières</button>
        <button className={tab === 'weekly' ? 'on' : ''} onClick={() => setTab('weekly')}>Hebdo</button>
        <button className={tab === 'progress' ? 'on' : ''} onClick={() => setTab('progress')}>Progression</button>
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

export function Events() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const { push, toast } = useUI.getState();
  const list = activeEvents(now);
  return (
    <Screen title="Événements">
      {list.length === 0 && <div className="hint">Aucun événement en cours. De nouveaux événements apparaîtront ici automatiquement (connexion Internet nécessaire pour les recevoir).</div>}
      {list.map((e) => {
        const p = save.events[e.id];
        const chal = e.challenge ? canStart(save, { mode: 'challenge', eventId: e.id }) : null;
        return (
          <div key={e.id}>
            <div className="event-card" style={{ ['--mc' as string]: e.color ?? '#b98cff' }}>
              <div className="faint">ÉVÉNEMENT · se termine dans {formatDuration(Date.parse(e.end) - now)}</div>
              <h2 style={{ fontSize: 22, color: e.color }}>{e.name}</h2>
              <p className="muted" style={{ fontSize: 13 }}>{e.description}</p>
              <div className="row wrap" style={{ gap: 6 }}>
                {e.dungeonBonus && e.dungeonBonus > 1 && <span className="chip active">Donjons ×{e.dungeonBonus}</span>}
                {e.banners?.filter((b) => bannerAvailable(b, now)).map((b) => <button key={b} className="chip active" onClick={() => push({ name: 'summon' })}>Invocation spéciale ›</button>)}
              </div>
            </div>
            {e.tasks && e.tasks.length > 0 && (
              <Panel title="Objectifs de l’événement">
                {e.tasks.map((t) => { const st = eventTaskState(save, e.id, t.id)!; return <Row key={t.id} title={t.title} value={st.value} target={t.target} reward={t.reward} claimed={st.claimed} onClaim={() => { let ok = false; mutate((s) => { ok = claimEventTask(s, e.id, t.id); }); if (ok) { play('claim'); toast('Récompense obtenue !', 'ok'); } }} />; })}
              </Panel>
            )}
            {e.challenge && (
              <Panel title="Défi spécial">
                <b>{e.challenge.name}</b>
                <p className="faint">{e.challenge.description}</p>
                <RewardView reward={e.challenge.reward} />
                <button className="btn block" style={{ marginTop: 10 }} disabled={!chal?.ok} onClick={() => push({ name: 'prep', spec: { mode: 'challenge', eventId: e.id } })}>{p?.challengeDone ? 'Défi réussi ✓' : 'Relever le défi'}</button>
              </Panel>
            )}
          </div>
        );
      })}
    </Screen>
  );
}

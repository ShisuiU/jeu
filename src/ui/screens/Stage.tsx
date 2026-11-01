import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { STAGE_BY_ID } from '../../data/campaign';
import { ENEMIES } from '../../data/enemies';
import { HERO_BY_ID } from '../../data/heroes';
import { AFFINITIES } from '../../data/affinities';
import { ROLES } from '../../data/roles';
import { payStage, stageProgress } from '../../game/campaign';
import { computeStats, powerOf } from '../../game/stats';
import { msToNextEnergy } from '../../game/energy';
import { formatDuration } from '../../core/time';
import { Panel, Screen, fmt } from '../components/common';
import { RewardView } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';

export function Stage({ stageId }: { stageId: string }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const setActiveTeam = useGame((s) => s.setActiveTeam);
  const { push, replace, toast } = useUI.getState();
  const stage = STAGE_BY_ID[stageId];
  const prog = stageProgress(save, 'normal', stageId);
  const [teamId, setTeamId] = useState(save.activeTeamId);
  const team = save.teams.find((t) => t.id === teamId) ?? save.teams[0];
  const members = team.slots.map((u) => save.heroes.find((h) => h.uid === u));
  const power = members.reduce((a, h) => a + (h ? powerOf(computeStats(HERO_BY_ID[h.heroId], h)) : 0), 0);
  const count = members.filter(Boolean).length;
  const enough = save.energy.current >= stage.energy;
  const { heroes: newHeroes, ...firstReward } = stage.firstClear;

  const start = () => {
    if (!count) { toast('Votre équipe est vide : ajoutez des héros dans l’écran Équipe.', 'error'); return; }
    let ok = false;
    mutate((d) => { ok = payStage(d, stage, now); });
    if (!ok) { toast('Énergie insuffisante.', 'error'); return; }
    if (team.id !== save.activeTeamId) setActiveTeam(team.id);
    replace({ name: 'battle', stageId, teamId: team.id, difficulty: 'normal', seed: Date.now() });
  };

  return (
    <Screen title={`${stage.id} · ${stage.name}`}>
      {stage.boss && <div className="hint warn" style={{ marginBottom: 12 }}><b>Combat de boss.</b> Le Héraut est immunisé à l’étourdissement et au gel, et devient furieux sous 50 % de PV.</div>}
      {stage.waves.map((w, i) => (
        <Panel key={i} title={`Vague ${i + 1}`}>
          <div className="enemy-row">
            {w.map((e, j) => {
              const d = ENEMIES[e.enemy];
              return (
                <div key={j} className={`enemy-chip ${d.boss ? 'boss' : ''}`}>
                  <div className="ec-art"><EnemyArt enemyId={d.id} /><span className="u-lvl">{e.level}</span></div>
                  <div className="ec-name">{d.name}</div>
                  <div className="faint" style={{ color: AFFINITIES[d.affinity].color }}>{ROLES[d.role].name}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}

      <Panel title={prog.clears ? 'Récompenses' : 'Première victoire'}>
        <RewardView reward={prog.clears ? stage.repeat : firstReward} />
        {!prog.clears && newHeroes?.map((id) => <p key={id} className="hint" style={{ marginTop: 10 }}>Nouvel héros débloqué : <b>{HERO_BY_ID[id].name}</b></p>)}
        <p className="faint" style={{ marginTop: 8 }}>+{stage.heroXp} XP par héros participant · ★★★ si aucun héros n’est mis K.O.{prog.clears ? ` · Terminé ${prog.clears} fois` : ''}</p>
      </Panel>

      <Panel title="Équipe">
        <div className="seg" style={{ marginBottom: 10 }}>
          {save.teams.map((t) => <button key={t.id} className={t.id === team.id ? 'on' : ''} onClick={() => setTeamId(t.id)}>{t.name}</button>)}
        </div>
        <div className="mini-team">
          {members.map((h, i) => (
            <div key={i} className="mini-slot">{h ? <HeroCard heroId={h.heroId} level={h.level} /> : <span className="faint">Vide</span>}{h && team.leader === h.uid && <span className="leader-crown">CHEF</span>}</div>
          ))}
        </div>
        <div className="row between" style={{ marginTop: 10 }}>
          <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(power)}</b></span>
          <button className="btn secondary small" onClick={() => push({ name: 'team' })}>Modifier</button>
        </div>
      </Panel>

      <button className="btn block" style={{ marginTop: 16, minHeight: 56, fontSize: 18 }} disabled={!enough || !count} onClick={start}>
        Combattre <Icon.energy size={18} /> {stage.energy}<span className="shine" />
      </button>
      {!enough && <p className="faint" style={{ textAlign: 'center', marginTop: 8 }}>Énergie insuffisante ({save.energy.current}/{stage.energy}) · +1 dans {formatDuration(msToNextEnergy(save.energy, now))}</p>}
    </Screen>
  );
}

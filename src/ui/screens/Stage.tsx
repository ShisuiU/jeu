import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { ENEMIES } from '../../data/enemies';
import { HERO_BY_ID } from '../../data/heroes';
import { AFFINITIES } from '../../data/affinities';
import { ROLES } from '../../data/roles';
import { STAGE_BY_ID } from '../../data/campaign';
import { heroTotalStats } from '../../game/heroStats';
import { powerOf } from '../../game/stats';
import { msToNextEnergy } from '../../game/energy';
import { canStart, payMode, resolveMode, type BattleSpec } from '../../game/modes';
import { formatDuration } from '../../core/time';
import { Panel, Screen, fmt } from '../components/common';
import { RewardView } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';
import { EnemyArt } from '../art/EnemyArt';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';

/** Écran de préparation commun à tous les modes : ennemis, récompenses, équipe, coût. */
export function Prep({ spec }: { spec: BattleSpec }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const setActiveTeam = useGame((s) => s.setActiveTeam);
  const { push, replace, toast } = useUI.getState();
  const info = resolveMode(save, spec);
  const start = canStart(save, spec);
  const [teamId, setTeamId] = useState(save.activeTeamId);
  const team = save.teams.find((t) => t.id === teamId) ?? save.teams[0];
  const members = team.slots.map((u) => save.heroes.find((h) => h.uid === u));
  const power = members.reduce((a, h) => a + (h ? powerOf(heroTotalStats(save, h).total) : 0), 0);
  const count = members.filter(Boolean).length;
  const energyShort = info.cost.kind === 'energy' && save.energy.current < info.cost.amount;
  const newHeroes = spec.mode === 'campaign' && info.firstTime ? STAGE_BY_ID[spec.stageId].firstClear.heroes : undefined;
  const boss = info.waves.flat().some((w) => w.kind === 'enemy' && ENEMIES[w.refId]?.boss);

  const go = () => {
    if (!count) { toast('Votre équipe est vide : ajoutez des héros dans l’écran Équipe.', 'error'); return; }
    let r: { ok: boolean; reason?: string } = { ok: false };
    mutate((d) => { r = payMode(d, spec, now); });
    if (!r.ok) { toast(r.reason ?? 'Impossible.', 'error'); return; }
    if (team.id !== save.activeTeamId) setActiveTeam(team.id);
    replace({ name: 'battle', spec, teamId: team.id, seed: Date.now() });
  };

  return (
    <Screen title={info.title}>
      <p className="muted" style={{ marginTop: 0 }}>{info.subtitle}</p>
      {boss && spec.mode !== 'arena' && <div className="hint warn" style={{ marginBottom: 12 }}><b>Boss.</b> Immunisé à l’étourdissement et au gel, furieux sous 50 % de PV.</div>}
      {info.waves.map((w, i) => (
        <Panel key={i} title={spec.mode === 'arena' ? 'Équipe adverse' : `Vague ${i + 1}`}>
          <div className="enemy-row">
            {w.map((e, j) => {
              const isHero = e.kind === 'hero';
              const name = isHero ? HERO_BY_ID[e.refId].name : ENEMIES[e.refId].name;
              const role = isHero ? HERO_BY_ID[e.refId].role : ENEMIES[e.refId].role;
              const aff = isHero ? HERO_BY_ID[e.refId].affinity : ENEMIES[e.refId].affinity;
              return (
                <div key={j} className={`enemy-chip ${!isHero && ENEMIES[e.refId].boss ? 'boss' : ''}`}>
                  <div className="ec-art">{isHero ? <HeroArt heroId={e.refId} /> : <EnemyArt enemyId={e.refId} />}<span className="u-lvl">{e.level}</span></div>
                  <div className="ec-name">{name}</div>
                  <div className="faint" style={{ color: AFFINITIES[aff].color }}>{ROLES[role].name}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}

      <Panel title={info.rewardLabel}>
        <RewardView reward={info.rewardPreview} />
        {newHeroes?.map((id) => <p key={id} className="hint" style={{ marginTop: 10 }}>Nouveau héros débloqué : <b>{HERO_BY_ID[id].name}</b></p>)}
        {info.notes.map((n, i) => <p key={i} className="faint" style={{ margin: '6px 0 0' }}>{n}</p>)}
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

      <button className="btn block" style={{ marginTop: 16, minHeight: 56, fontSize: 18 }} disabled={!start.ok || energyShort || !count} onClick={go}>
        Combattre {info.cost.kind === 'energy' && <><Icon.energy size={18} /> {info.cost.amount}</>}{info.cost.kind === 'key' && '· 1 clé'}{info.cost.kind === 'ticket' && '· 1 ticket'}<span className="shine" />
      </button>
      {!start.ok && <p className="faint" style={{ textAlign: 'center', marginTop: 8 }}>{start.reason}</p>}
      {energyShort && <p className="faint" style={{ textAlign: 'center', marginTop: 8 }}>Énergie insuffisante ({save.energy.current}/{info.cost.amount}) · +1 dans {formatDuration(msToNextEnergy(save.energy, now))}</p>}
    </Screen>
  );
}

/** Ancienne route « stage » (campagne Normal). */
export function Stage({ stageId }: { stageId: string }) {
  return <Prep spec={{ mode: 'campaign', stageId, difficulty: 'normal' }} />;
}

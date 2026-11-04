import { Coach } from '../components/Coach';
import { AffinityIcon, RoleIcon } from '../art/Identity';
import type { AffinityId } from '../../data/types';
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
import { canSweep, sweep, type SweepSummary } from '../../game/comfort';
import { Modal } from '../components/common';
import { GearCard } from '../components/GearCard';
import { play } from '../../audio/sfx';
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
  const [summary, setSummary] = useState<(SweepSummary & { count: number }) | null>(null);
  const sweepOk = canSweep(save, spec);
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

  const doSweep = (count: number) => {
    if (!count) return;
    let r: SweepSummary | null = null;
    mutate((d) => { r = sweep(d, spec, team.id, count, Date.now()); });
    play('claim');
    setSummary({ ...(r as unknown as SweepSummary), count });
  };
  const maxRuns = info.cost.kind === 'energy' && info.cost.amount > 0 ? Math.floor(save.energy.current / info.cost.amount) : 0;

  return (
    <Screen title={info.title}>
      <Coach id="prep_fight" target=".fight-btn" text="Voici les ennemis et la récompense. Lance le combat !" />
      <p className="muted" style={{ marginTop: 0 }}>{info.subtitle}</p>
      {boss && spec.mode !== 'arena' && <div className="hint warn" style={{ marginBottom: 12 }}><b>Boss.</b> Immunisé à l’étourdissement et au gel, furieux sous 50 % de PV.</div>}
      <AffinityAdvice waves={info.waves} />
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
                  <div className="ec-art">{isHero ? <HeroArt heroId={e.refId} /> : <EnemyArt enemyId={e.refId} />}<span className="u-lvl">{e.level}</span><span className="u-aff"><AffinityIcon id={aff} size={15} /></span></div>
                  <div className="ec-name">{name}</div>
                  <div className="faint ec-role"><RoleIcon id={role} size={11} />{ROLES[role].name}</div>
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

      <button className="btn block fight-btn" style={{ marginTop: 16, minHeight: 56, fontSize: 18 }} disabled={!start.ok || energyShort || !count} onClick={go}>
        Combattre {info.cost.kind === 'energy' && <><Icon.energy size={18} /> {info.cost.amount}</>}{info.cost.kind === 'key' && '· 1 clé'}{info.cost.kind === 'ticket' && '· 1 ticket'}<span className="shine" />
      </button>
      {(spec.mode === 'campaign' || spec.mode === 'dungeon') && (
        <Panel title="Balayage">
          {sweepOk.ok ? (
            <>
              <div className="row" style={{ gap: 6 }}>
                {[1, 5, 10].map((n) => <button key={n} className="btn secondary small grow" disabled={maxRuns < 1 || !count} onClick={() => doSweep(Math.min(n, maxRuns))}>×{n}</button>)}
                <button className="btn small grow" disabled={maxRuns < 1 || !count} onClick={() => doSweep(maxRuns)}>Max ({maxRuns})</button>
              </div>
            </>
          ) : <p className="faint" style={{ margin: 0 }}>{sweepOk.reason}</p>}
        </Panel>
      )}
      {summary && (
        <Modal onClose={() => setSummary(null)}>
          <h2>Balayage terminé</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{summary.wins} victoire(s) sur {summary.runs} combat(s){summary.stopReason ? ` · ${summary.stopReason}` : ''}</p>
          <RewardView reward={summary.reward} />
          {summary.gear.length > 0 && <div className="gear-grid" style={{ marginTop: 10 }}>{summary.gear.slice(0, 8).map((g) => <GearCard key={g.uid} g={g} />)}</div>}
          {summary.gear.length > 8 && <p className="faint">+ {summary.gear.length - 8} autre(s) équipement(s)</p>}
          {summary.levelUps.length > 0 && <p className="hint" style={{ marginTop: 10 }}>Niveau supérieur : {summary.levelUps.map((l) => `${HERO_BY_ID[l.heroId].name.split(' ')[0]} (${l.to})`).join(', ')}</p>}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setSummary(null)}>Fermer</button>
            <button className="btn grow" disabled={maxRuns < 1} onClick={() => doSweep(Math.min(summary.count, maxRuns))}>Encore ×{Math.min(summary.count, Math.max(1, maxRuns))}</button>
          </div>
        </Modal>
      )}
      {!start.ok && <p className="faint" style={{ textAlign: 'center', marginTop: 8 }}>{start.reason}</p>}
      {energyShort && <p className="faint" style={{ textAlign: 'center', marginTop: 8 }}>Énergie insuffisante ({save.energy.current}/{info.cost.amount}) · +1 dans {formatDuration(msToNextEnergy(save.energy, now))}</p>}
    </Screen>
  );
}

/** Ancienne route « stage » (campagne Normal). */
export function Stage({ stageId }: { stageId: string }) {
  return <Prep spec={{ mode: 'campaign', stageId, difficulty: 'normal' }} />;
}

/** Conseil d'affinité : l'affinité ennemie la plus présente, et celle qui la bat. */
function AffinityAdvice({ waves }: { waves: { kind: string; refId: string }[][] }) {
  const count: Partial<Record<AffinityId, number>> = {};
  for (const w of waves) for (const e of w) {
    const a = (e.kind === 'hero' ? HERO_BY_ID[e.refId].affinity : ENEMIES[e.refId].affinity) as AffinityId;
    count[a] = (count[a] ?? 0) + 1;
  }
  const main = (Object.entries(count) as [AffinityId, number][]).filter(([a]) => a !== 'void').sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!main) return null;
  const counter = (Object.values(AFFINITIES).find((x) => x.strongAgainst === main))?.id as AffinityId | undefined;
  return (
    <div className="aff-advice">
      <span>Ennemis surtout <AffinityIcon id={main} size={16} /> <b style={{ color: AFFINITIES[main].color }}>{AFFINITIES[main].name}</b></span>
      {counter && <span>· conseillé <AffinityIcon id={counter} size={16} /> <b style={{ color: AFFINITIES[counter].color }}>{AFFINITIES[counter].name}</b></span>}
    </div>
  );
}

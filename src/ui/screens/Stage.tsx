import { Coach } from '../components/Coach';
import { AffinityIcon } from '../art/Identity';
import type { AffinityId } from '../../data/types';
import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { ENEMIES } from '../../data/enemies';
import { HERO_BY_ID } from '../../data/heroes';
import { AFFINITIES } from '../../data/affinities';
import { STAGE_BY_ID } from '../../data/campaign';
import { stageProgress } from '../../game/campaign';
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
import { RewardInline, RewardView } from '../components/RewardView';
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
  const [sweepOpen, setSweepOpen] = useState(false);
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

  // Ennemis regroupés : chaque type une seule fois (avec le nombre), le boss en premier.
  const foes = (() => {
    const m = new Map<string, { refId: string; isHero: boolean; level: number; n: number; boss: boolean }>();
    for (const w of info.waves) for (const e of w) {
      const isHero = e.kind === 'hero';
      const k = `${e.kind}:${e.refId}`;
      const cur = m.get(k);
      if (cur) { cur.n += 1; cur.level = Math.max(cur.level, e.level); }
      else m.set(k, { refId: e.refId, isHero, level: e.level, n: 1, boss: !isHero && !!ENEMIES[e.refId]?.boss });
    }
    return [...m.values()].sort((x, y) => Number(y.boss) - Number(x.boss));
  })();
  const blocked = !start.ok || energyShort || !count;

  return (
    <Screen title={info.title}>
      <Coach id="prep_fight" target=".fight-btn" text="Voici les ennemis et la récompense. Lance le combat !" />
      <Coach id="battle_target" target=".aff-advice" when={Object.values(save.progress.campaign).some((p) => p.clears > 0)} text="Les affinités comptent : Solaire bat Tellurique, qui bat Lunaire, qui bat Solaire. Un héros avantagé (▲) frappe 30 % plus fort. Regarde ici combien ton équipe en a." />
      <div className="prep-sub"><span className="muted">{info.subtitle}</span></div>
      {spec.mode === 'campaign' && <StarRules best={stageProgress(save, spec.difficulty, spec.stageId).stars} />}
      <AffinityAdvice waves={info.waves} team={members.filter(Boolean).map((h) => h!.heroId)} />

      <Panel title={spec.mode === 'arena' ? 'Équipe adverse' : `Ennemis · ${info.waves.length} vague${info.waves.length > 1 ? 's' : ''}`}>
        <div className="foe-row">
          {foes.map((f) => {
            const d = f.isHero ? HERO_BY_ID[f.refId] : ENEMIES[f.refId];
            return (
              <div key={f.refId} className={`foe ${f.boss ? 'boss' : ''}`} title={d.name}>
                <div className="foe-art">{f.isHero ? <HeroArt heroId={f.refId} /> : <EnemyArt enemyId={f.refId} />}<span className="u-lvl">{f.level}</span><span className="u-aff"><AffinityIcon id={d.affinity} size={13} /></span>{f.n > 1 && <span className="foe-n">×{f.n}</span>}</div>
                <div className="foe-name">{f.boss ? 'Boss' : d.name.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
        {boss && spec.mode !== 'arena' && <p className="faint" style={{ margin: '8px 0 0' }}>Boss : insensible à l’étourdissement et au gel, plus fort sous 50 % de PV.</p>}
      </Panel>

      <Panel>
        <div className="row between" style={{ marginBottom: 8 }}>
          {save.teams.length > 1 ? (
            <select className="prep-team" value={team.id} onChange={(e) => setTeamId(e.target.value)} aria-label="Équipe">
              {save.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : <b>{team.name}</b>}
          <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(power)}</b></span>
        </div>
        <button className="mini-team prep-team-strip" onClick={() => push({ name: 'team' })} aria-label="Modifier l’équipe">
          {members.map((h, i) => (
            <div key={i} className="mini-slot">{h ? <HeroCard heroId={h.heroId} level={h.level} /> : <span className="faint">+</span>}{h && team.leader === h.uid && <span className="leader-crown">CHEF</span>}</div>
          ))}
        </button>
      </Panel>

      <Panel title={info.rewardLabel}>
        <RewardInline reward={info.rewardPreview} />
        {newHeroes?.map((id) => <p key={id} className="hint" style={{ marginTop: 8 }}>Nouveau héros : <b>{HERO_BY_ID[id].name}</b></p>)}
        {info.notes.filter(Boolean).map((n, i) => <p key={i} className="faint" style={{ margin: '6px 0 0' }}>{n}</p>)}
      </Panel>

      {/* Barre d'action : toujours visible en bas, au-dessus de la navigation. */}
      <div className="prep-bar">
        {blocked && <div className="prep-why">{!count ? 'Équipe vide : touche l’équipe pour ajouter des héros.' : !start.ok ? start.reason : `Énergie ${save.energy.current}/${info.cost.amount} · +1 dans ${formatDuration(msToNextEnergy(save.energy, now))}`}</div>}
        <div className="row" style={{ gap: 8 }}>
          {(spec.mode === 'campaign' || spec.mode === 'dungeon') && (
            <button className="btn secondary prep-sweep" disabled={!sweepOk.ok || maxRuns < 1 || !count} onClick={() => setSweepOpen(true)} title={sweepOk.ok ? 'Rejouer automatiquement sans combat' : sweepOk.reason}>Balayer</button>
          )}
          <button className="btn grow fight-btn" disabled={blocked} onClick={go}>
            Combattre {info.cost.kind === 'energy' && <><Icon.energy size={18} /> {info.cost.amount}</>}{info.cost.kind === 'key' && '· 1 clé'}{info.cost.kind === 'ticket' && '· 1 ticket'}<span className="shine" />
          </button>
        </div>
      </div>
      {sweepOpen && (
        <Modal onClose={() => setSweepOpen(false)}>
          <h2>Balayer</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Rejoue ce niveau sans combattre, autant de fois que tu veux, contre de l’énergie.</p>
          <div className="row" style={{ gap: 6 }}>
            {[1, 5, 10].map((n) => <button key={n} className="btn secondary small grow" disabled={maxRuns < 1} onClick={() => { setSweepOpen(false); doSweep(Math.min(n, maxRuns)); }}>×{n}</button>)}
            <button className="btn small grow" disabled={maxRuns < 1} onClick={() => { setSweepOpen(false); doSweep(maxRuns); }}>Max ({maxRuns})</button>
          </div>
          <button className="btn secondary block" style={{ marginTop: 10 }} onClick={() => setSweepOpen(false)}>Annuler</button>
        </Modal>
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
    </Screen>
  );
}

/** Ancienne route « stage » (campagne Normal). */
export function Stage({ stageId }: { stageId: string }) {
  return <Prep spec={{ mode: 'campaign', stageId, difficulty: 'normal' }} />;
}

/** Conseil d'affinité : l'affinité ennemie la plus présente, et celle qui la bat. */
function AffinityAdvice({ waves, team }: { waves: { kind: string; refId: string }[][]; team: string[] }) {
  const count: Partial<Record<AffinityId, number>> = {};
  for (const w of waves) for (const e of w) {
    const a = (e.kind === 'hero' ? HERO_BY_ID[e.refId].affinity : ENEMIES[e.refId].affinity) as AffinityId;
    count[a] = (count[a] ?? 0) + 1;
  }
  const main = (Object.entries(count) as [AffinityId, number][]).filter(([a]) => a !== 'void').sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!main) return null;
  const counter = (Object.values(AFFINITIES).find((x) => x.strongAgainst === main))?.id as AffinityId | undefined;
  // Ce qui fait la différence : combien de tes héros frappent fort (▲) ou faiblement (▼) contre ces ennemis.
  const up = team.filter((id) => AFFINITIES[HERO_BY_ID[id].affinity].strongAgainst === main).length;
  const down = team.filter((id) => AFFINITIES[main].strongAgainst === HERO_BY_ID[id].affinity).length;
  return (
    <div className="aff-advice">
      <div>
        <span>Ennemis surtout <AffinityIcon id={main} size={16} /> <b style={{ color: AFFINITIES[main].color }}>{AFFINITIES[main].name}</b></span>
        {counter && <span> · conseillé <AffinityIcon id={counter} size={16} /> <b style={{ color: AFFINITIES[counter].color }}>{AFFINITIES[counter].name}</b></span>}
      </div>
      {team.length > 0 && (
        <div className="aff-team">
          Ton équipe : <b className="aff-up">{up} avantagé{up > 1 ? 's' : ''} ▲</b> · <b className={down ? 'aff-down' : ''}>{down} désavantagé{down > 1 ? 's' : ''} ▼</b>
          <span className="faint"> (▲ +30 % de dégâts, ▼ −20 %)</span>
        </div>
      )}
    </div>
  );
}

/** Conditions des étoiles, affichées avant le combat (et le meilleur résultat déjà obtenu). */
function StarRules({ best }: { best: number }) {
  const rules = ['Victoire', '1 KO max', 'Aucun KO'];
  return (
    <div className="star-rules" aria-label={`Étoiles : meilleur résultat ${best} sur 3`}>
      {rules.map((r, i) => (
        <span key={i} className={`sr ${best > i ? 'got' : ''}`}>
          <span className="sr-stars">{Array.from({ length: i + 1 }, (_, k) => <Icon.star key={k} size={11} color={best > i ? '#ffd36b' : '#7a7266'} />)}</span>
          {r}
        </span>
      ))}
    </div>
  );
}

import { useEffect } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { DUNGEONS, DUNGEON_BY_ID, DUNGEON_FLOORS, dungeonEnergy, dungeonLevel } from '../../data/dungeons';
import { TOWER_FLOORS, towerLevel, towerReward } from '../../data/tower';
import { BOSS_TIERS, DAMAGE_CHESTS, WORLD_BOSS } from '../../data/worldBoss';
import { ARENA, ARENA_TIERS, arenaTier } from '../../data/arena';
import { HERO_BY_ID } from '../../data/heroes';
import { generateOpponents } from '../../game/arena';
import { seededRand } from '../../game/gear';
import { dungeonBonus } from '../../game/events';
import { formatDuration, msUntilReset } from '../../core/time';
import { InfoButton, Panel, Screen, fmt } from '../components/common';
import { RewardInline, rewardMainIcon } from '../components/RewardView';
import { EnemyArt } from '../art/EnemyArt';
import { HeroArt } from '../art/HeroArt';
import { Icon, ResourceIcon } from '../art/Icons';

const DICON = { forge: 'ore', flask: 'flask', potion: 'potion', book: 'book' } as const;

export function Dungeons() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const bonus = dungeonBonus(now);
  return (
    <Screen title="Donjons">
      {bonus > 1 && <div className="hint" style={{ marginBottom: 12 }}>Événement en cours : butin des donjons <b>×{bonus}</b>.</div>}
      <div className="stack">
        {DUNGEONS.map((d) => {
          const best = save.progress.dungeons[d.id]?.bestFloor ?? 0;
          return (
            <button key={d.id} className="mode-card" style={{ ['--mc' as string]: d.color }} onClick={() => push({ name: 'dungeon', dungeonId: d.id })}>
              <div className="mc-art"><EnemyArt enemyId={d.boss} /></div>
              <div className="grow" style={{ textAlign: 'left' }}>
                <div className="mc-name">{d.name}</div>
                <div className="faint">{d.description}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <ResourceIcon icon={DICON[d.icon]} color={d.color} size={16} />
                  <span className="faint">Étage {Math.min(best + 1, DUNGEON_FLOORS)} / {DUNGEON_FLOORS}{best >= DUNGEON_FLOORS ? ' · terminé' : ''}</span>
                </div>
              </div>
              <span className="muted">›</span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

export function Dungeon({ dungeonId }: { dungeonId: string }) {
  const save = useGame((s) => s.save)!;
  const { push, toast } = useUI.getState();
  const d = DUNGEON_BY_ID[dungeonId];
  const best = save.progress.dungeons[d.id]?.bestFloor ?? 0;
  return (
    <Screen title={d.name}>
      <div className="mode-hero" style={{ ['--mc' as string]: d.color }}>
        <div className="mh-art"><EnemyArt enemyId={d.boss} /></div>
        <div className="mh-info"><b>{d.description}</b></div>
      </div>
      <div className="stage-path">
        {Array.from({ length: DUNGEON_FLOORS }, (_, i) => i + 1).map((f) => {
          const open = f <= best + 1;
          return (
            <button key={f} className={`stage-node ${open ? '' : 'locked'} ${f <= best ? 'cleared' : ''} ${f === DUNGEON_FLOORS ? 'boss' : ''}`}
              onClick={() => (open ? push({ name: 'prep', spec: { mode: 'dungeon', dungeonId: d.id, floor: f } }) : toast('Terminez l’étage précédent.'))}>
              <span className="sn-idx">{f}</span>
              <div className="grow" style={{ textAlign: 'left' }}>
                <div className="sn-name">Étage {f}</div>
                <div className="faint">Ennemis niv. {dungeonLevel(f)} · <Icon.energy size={11} /> {dungeonEnergy(f)}</div>
              </div>
              <span className="row" style={{ gap: 4 }}>{rewardMainIcon(d.reward(f), 18)}</span>
              {!open && <Icon.lock size={16} />}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

export function Tower() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const cur = save.progress.tower.floor;
  const next = Math.min(cur + 1, TOWER_FLOORS);
  const done = cur >= TOWER_FLOORS;
  const floors = Array.from({ length: 8 }, (_, i) => next + 3 - i).filter((f) => f >= 1 && f <= TOWER_FLOORS);
  return (
    <Screen title="Tour des Âges" right={<RanksBtn tab="tower" />}>
      <Panel>
        <div className="row between"><span>Étage atteint : <b style={{ color: 'var(--gold-hi)' }}>{cur}</b> / {TOWER_FLOORS}</span><span className="row" style={{ gap: 6 }}><span className="faint">Sans énergie</span><InfoButton title="Tour des Âges">Chaque étage se conquiert une seule fois. Tous les 10 étages, une Sentinelle garde le passage avec de grosses récompenses.</InfoButton></span></div>
        <div className="progress" style={{ marginTop: 8 }}><div style={{ width: `${(cur / TOWER_FLOORS) * 100}%` }} /></div>
      </Panel>
      <div className="tower">
        {floors.map((f) => (
          <div key={f} className={`tower-floor ${f <= cur ? 'done' : f === next && !done ? 'next' : 'future'} ${f % 10 === 0 ? 'boss' : ''}`}>
            <span className="tf-n">{f}</span>
            <span className="grow">{f % 10 === 0 ? 'Sentinelle' : `Ennemis niv. ${towerLevel(f)}`}</span>
            <span className="row" style={{ gap: 4 }}>{rewardMainIcon(towerReward(f), 18)}</span>
            {f <= cur && <span className="chip active">✓</span>}
          </div>
        ))}
      </div>
      {!done ? (
        <button className="btn block" style={{ marginTop: 14, minHeight: 54 }} onClick={() => push({ name: 'prep', spec: { mode: 'tower', floor: next } })}>Monter à l’étage {next}<span className="shine" /></button>
      ) : <div className="hint" style={{ marginTop: 14 }}>Vous avez conquis la Tour des Âges !</div>}
    </Screen>
  );
}

export function WorldBoss() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const keys = WORLD_BOSS.keysPerDay - save.worldBoss.keysUsed;
  return (
    <Screen title="Boss mondial" right={<RanksBtn tab="boss" />}>
      <div className="mode-hero boss" style={{ ['--mc' as string]: '#ffcc66' }}>
        <div className="mh-art"><EnemyArt enemyId={WORLD_BOSS.enemy} /></div>
        <div className="mh-info"><div className="faint">BOSS MONDIAL</div><b style={{ fontSize: 18 }}>{WORLD_BOSS.name}</b></div>
      </div>
      <Panel>
        <div className="row between"><span>Clés : <b style={{ color: 'var(--gold-hi)' }}>{keys}</b> / {WORLD_BOSS.keysPerDay}</span><span className="faint">Renouvellement dans {formatDuration(msUntilReset(now))}</span></div>
        <div className="row" style={{ marginTop: 6, gap: 6 }}><span className="faint grow">{WORLD_BOSS.turnLimit} actions pour frapper le plus fort possible</span><InfoButton title={WORLD_BOSS.name}>Infligez un maximum de dégâts en {WORLD_BOSS.turnLimit} actions. Paliers de récompense à {DAMAGE_CHESTS.join(', ')} % de ses PV. Le Colosse est immunisé à l’étourdissement et au gel.</InfoButton></div>
      </Panel>
      {BOSS_TIERS.map((t) => {
        const best = save.worldBoss.best[t.id] ?? 0;
        return (
          <Panel key={t.id}>
            <div className="row between" style={{ gap: 10 }}>
              <div className="grow">
                <b>{t.name}</b> <span className="faint">· niveau {t.level}</span>
                <div className="faint" style={{ fontSize: 12 }}>Meilleur score <b style={{ color: 'var(--gold-hi)' }}>{best.toFixed(1)} %</b></div>
              </div>
              <button className="btn" disabled={keys <= 0} onClick={() => push({ name: 'prep', spec: { mode: 'worldboss', tier: t.id } })}>Affronter</button>
            </div>
            <div className="chests">{DAMAGE_CHESTS.map((c) => <span key={c} className={best >= c ? 'on' : ''}>{c}%</span>)}</div>
            <RewardInline reward={t.reward} />
          </Panel>
        );
      })}
    </Screen>
  );
}

export function Arena() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const push = useUI((s) => s.push);
  const tier = arenaTier(save.arena.rating);
  const tickets = ARENA.ticketsPerDay - save.arena.ticketsUsed;
  useEffect(() => {
    if (save.arena.opponents.length === 0) mutate((s) => { s.arena.opponents = generateOpponents(s, seededRand(Date.now())); });
  }, [save.arena.opponents.length, mutate]);
  return (
    <Screen title="Arène" right={<RanksBtn tab="arena" />}>
      <Panel>
        <div className="row between">
          <div><div className="faint">LIGUE</div><b style={{ fontSize: 20, color: tier.color }}>{tier.name}</b></div>
          <div style={{ textAlign: 'right' }}><div className="faint">CLASSEMENT</div><b style={{ fontSize: 20 }}>{save.arena.rating}</b></div>
        </div>
        <div className="row between" style={{ marginTop: 8 }}>
          <span className="faint">{save.arena.wins} victoires · {save.arena.losses} défaites</span>
          <span>Tickets : <b style={{ color: 'var(--gold-hi)' }}>{tickets}</b>/{ARENA.ticketsPerDay}</span>
        </div>
        <p className="faint" style={{ marginBottom: 0 }}>Nouveaux tickets dans {formatDuration(msUntilReset(now))}</p>
      </Panel>
      {save.arena.opponents.map((o, i) => (
        <Panel key={o.id}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div><b>{o.name}</b><div className="faint">{['Accessible', 'Équilibré', 'Redoutable'][i]} · puissance {fmt(o.power)}</div></div>
            <button className="btn small" disabled={tickets <= 0} onClick={() => push({ name: 'prep', spec: { mode: 'arena', opponentId: o.id } })}>Défier</button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {o.heroes.map((h) => (
              <div key={h.slot} className="xp-ava" style={{ width: 46, height: 46, position: 'relative' }}><HeroArt heroId={h.heroId} /><span className="u-lvl">{h.level}</span></div>
            ))}
          </div>
          <div className="faint" style={{ marginTop: 4 }}>{o.heroes.map((h) => HERO_BY_ID[h.heroId].name.split(' ')[0]).join(', ')}</div>
        </Panel>
      ))}
      <Panel title="Ligues et récompenses de victoire">
        {ARENA_TIERS.map((t) => (
          <div key={t.id} className="stat-row"><b style={{ color: t.color }}>{t.name}</b><span className="faint">dès {t.min} · {Object.entries(t.reward).map(([k, v]) => `${v} ${k === 'gold' ? 'or' : k === 'crystals' ? 'cristaux' : k === 'shardAeon' ? 'éclat d’Aeon' : 'éclat terne'}`).join(', ')}</span></div>
        ))}
      </Panel>
    </Screen>
  );
}

/** Raccourci vers le classement du mode. */
function RanksBtn({ tab }: { tab: 'arena' | 'tower' | 'boss' }) {
  return <button className="btn secondary small" onClick={() => useUI.getState().push({ name: 'ranks', tab })}>Classement</button>;
}

import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { DUNGEONS, DUNGEON_BY_ID, DUNGEON_DIFF_OPEN, DUNGEON_FLOORS, dungeonEnergy, dungeonLevel, dungeonRewardMult } from '../../data/dungeons';
import { DIFFICULTIES, DIFFICULTY_ORDER, type DifficultyId } from '../../data/campaign';
import { dungeonBest, dungeonDiffOpen, dungeonTopDiff } from '../../game/dungeons';
import { usePersisted } from '../components/ListControls';
import { scaleReward } from '../../game/modes';
import { TOWER_FLOORS, towerLevel, towerReward, towerStatMult } from '../../data/tower';
import { sweepTower, towerSweepMax } from '../../game/towerSweep';
import type { Reward } from '../../data/resources';
import { BOSS_TIERS, DAMAGE_CHESTS, WORLD_BOSS } from '../../data/worldBoss';
import { ARENA, ARENA_TIERS, arenaTier } from '../../data/arena';
import { HERO_BY_ID } from '../../data/heroes';
import { applyDefenseLog, arenaDefenses, defenseTeam, generateOpponents, opponentFromDefense, playerTeamPower, setArenaDefenses } from '../../game/arena';
import type { ArenaLogEntry } from '../../save/schema';
import { ReportSheet, type ReportTarget } from '../components/ReportSheet';
import { maskProfanity } from '../../game/moderation';
import { loadCloud, useAccount } from '../../cloud/account';
import { seededRand } from '../../game/gear';
import { dungeonBonus } from '../../game/events';
import { formatDuration, msUntilReset } from '../../core/time';
import { InfoButton, Panel, Screen, fmt } from '../components/common';
import { RewardInline, rewardMainIcon } from '../components/RewardView';
import { EnemyArt } from '../art/EnemyArt';
import { play } from '../../audio/sfx';
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
          const top = dungeonTopDiff(save, d.id);
          return (
            <button key={d.id} className="mode-card" style={{ ['--mc' as string]: d.color }} onClick={() => push({ name: 'dungeon', dungeonId: d.id })}>
              <div className="mc-art"><EnemyArt enemyId={d.boss} /></div>
              <div className="grow" style={{ textAlign: 'left' }}>
                <div className="mc-name">{d.name}</div>
                <div className="faint">{d.description}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <ResourceIcon icon={DICON[d.icon]} color={d.color} size={16} />
                  <span className="faint">{top === 'normal' ? <>Étage {Math.min(best + 1, DUNGEON_FLOORS)} / {DUNGEON_FLOORS}{best >= DUNGEON_FLOORS ? ' · terminé' : ''}</> : <>{DIFFICULTIES[top].name} · étage {Math.min(dungeonBest(save, d.id, top) + 1, DUNGEON_FLOORS)} / {DUNGEON_FLOORS}</>}</span>
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
  // Difficulté choisie (retenue par donjon) ; par défaut, la plus haute ouverte.
  const [pick, setPick] = usePersisted<Record<string, DifficultyId>>('dungeonDiff', {});
  const chosen = pick[d.id] ?? dungeonTopDiff(save, d.id);
  const diff: DifficultyId = dungeonDiffOpen(save, d.id, chosen) ? chosen : 'normal';
  const best = dungeonBest(save, d.id, diff);
  const mult = dungeonRewardMult(diff);
  return (
    <Screen title={d.name}>
      <div className="mode-hero" style={{ ['--mc' as string]: d.color }}>
        <div className="mh-art"><EnemyArt enemyId={d.boss} /></div>
        <div className="mh-info"><b>{d.description}</b></div>
      </div>
      <div className="seg camp-diff" style={{ margin: '10px 0' }}>
        {DIFFICULTY_ORDER.map((k) => {
          const open = dungeonDiffOpen(save, d.id, k);
          const prev = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(k) - 1];
          return <button key={k} className={`${diff === k ? 'on' : ''} ${open ? '' : 'locked'}`} aria-disabled={!open}
            onClick={() => { if (!open) { toast(`${DIFFICULTIES[k].name} : termine d’abord l’étage ${DUNGEON_DIFF_OPEN} en ${DIFFICULTIES[prev].name}.`); return; } setPick({ ...pick, [d.id]: k }); }}>{DIFFICULTIES[k].name}</button>;
        })}
      </div>
      {diff !== 'normal' && <p className="faint" style={{ textAlign: 'center', margin: '0 0 10px' }}>Ennemis +{DIFFICULTIES[diff].levelAdd} niveaux et plus puissants · récompenses ×{mult}{d.gear ? ' · meilleur équipement' : ''}</p>}
      <div className="stage-path">
        {Array.from({ length: DUNGEON_FLOORS }, (_, i) => i + 1).map((f) => {
          const open = f <= best + 1;
          return (
            <button key={f} className={`stage-node ${open ? '' : 'locked'} ${f <= best ? 'cleared' : ''} ${f === DUNGEON_FLOORS ? 'boss' : ''}`}
              onClick={() => (open ? push({ name: 'prep', spec: { mode: 'dungeon', dungeonId: d.id, floor: f, ...(diff !== 'normal' ? { difficulty: diff } : {}) } }) : toast('Termine l’étage précédent.'))}>
              <span className="sn-idx">{f}</span>
              <div className="grow" style={{ textAlign: 'left' }}>
                <div className="sn-name">Étage {f}</div>
                <div className="faint">Ennemis niv. {dungeonLevel(f, diff)} · <Icon.energy size={11} /> {dungeonEnergy(f, diff)}</div>
              </div>
              <span className="row" style={{ gap: 4 }}>{rewardMainIcon(scaleReward(d.reward(f), mult), 18)}</span>
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
  const sweepTo = towerSweepMax(save);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  return (
    <Screen title="Tour des Âges" right={<RanksBtn tab="tower" />}>
      <Panel>
        <div className="row between"><span>Étage atteint : <b style={{ color: 'var(--gold-hi)' }}>{cur}</b> / {TOWER_FLOORS}</span><span className="row" style={{ gap: 6 }}><span className="faint">Sans énergie</span><InfoButton title="Tour des Âges">Chaque étage se conquiert une seule fois. Tous les 10 étages, une Sentinelle garde le passage avec de grosses récompenses. Au-delà du 50ᵉ, les Sommets : les ennemis de toutes les régions, plus forts à chaque étage, et un boss de chapitre tous les 10 étages.</InfoButton></span></div>
        <div className="progress" style={{ marginTop: 8 }}><div style={{ width: `${(cur / TOWER_FLOORS) * 100}%` }} /></div>
      </Panel>
      <div className="tower">
        {floors.map((f) => (
          <div key={f} className={`tower-floor ${f <= cur ? 'done' : f === next && !done ? 'next' : 'future'} ${f % 10 === 0 ? 'boss' : ''}`}>
            <span className="tf-n">{f}</span>
            <span className="grow">{f % 10 === 0 ? (f > 50 ? 'Boss des Sommets' : 'Sentinelle') : `Ennemis niv. ${towerLevel(f)}${f > 50 ? ` · puissance +${Math.round((towerStatMult(f) - 1) * 100)} %` : ''}`}</span>
            <span className="row" style={{ gap: 4 }}>{rewardMainIcon(towerReward(f), 18)}</span>
            {f <= cur && <span className="chip active">✓</span>}
          </div>
        ))}
      </div>
      {sweepTo > 0 && (
        <div className="hint" style={{ marginTop: 14 }}>
          Les étages {cur + 1} à {sweepTo} sont bien en dessous du niveau de ton équipe.
          <button className="btn secondary block" style={{ marginTop: 8 }} onClick={() => { let res = { floors: 0, reward: {} as Reward }; mutate((d) => { res = sweepTower(d); }); if (res.floors) { play('claim'); toast(`Montée rapide : ${res.floors} étages gravis, récompenses récupérées.`, 'ok'); } }}>Monter d’un coup jusqu’à l’étage {sweepTo}</button>
        </div>
      )}
      {!done ? (
        <button className="btn block" style={{ marginTop: 14, minHeight: 54 }} onClick={() => push({ name: 'prep', spec: { mode: 'tower', floor: next } })}>Monter à l’étage {next}<span className="shine" /></button>
      ) : <div className="hint" style={{ marginTop: 14 }}>Tu as conquis la Tour des Âges !</div>}
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
        <div className="row" style={{ marginTop: 6, gap: 6 }}><span className="faint grow">{WORLD_BOSS.turnLimit} actions pour frapper le plus fort possible</span><InfoButton title={WORLD_BOSS.name}>Inflige un maximum de dégâts en {WORLD_BOSS.turnLimit} actions. Paliers de récompense à {DAMAGE_CHESTS.join(', ')} % de ses PV. Le Colosse est immunisé à l’étourdissement et au gel.</InfoButton></div>
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
            {/* Un seul repère : le prochain palier (les six paliers sont dans le ⓘ). */}
            {(() => { const got = DAMAGE_CHESTS.filter((c) => best >= c).length; const next = DAMAGE_CHESTS[got]; return (
              <div className="wb-next">
                <div className="progress"><div style={{ width: `${Math.min(100, best)}%` }} /></div>
                <span className="faint">{next ? <>Prochain palier : <b>{next} %</b> · {got}/{DAMAGE_CHESTS.length} atteints</> : <>Tous les paliers atteints</>}</span>
              </div>
            ); })()}
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
  const toast = useUI((s) => s.toast);
  const tier = arenaTier(save.arena.rating);
  const tickets = ARENA.ticketsPerDay - save.arena.ticketsUsed;
  const user = useAccount((s) => s.user);
  const [online, setOnline] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  useEffect(() => {
    if (save.arena.opponents.length === 0) mutate((s) => { s.arena.opponents = generateOpponents(s, seededRand(Date.now())); });
  }, [save.arena.opponents.length, mutate]);
  // Avec un compte : publication de ta défense, journal des attaques reçues, et vraies équipes adverses.
  useEffect(() => {
    if (!user || !navigator.onLine) return;
    let alive = true;
    setOnline('loading');
    loadCloud().then(async (c) => {
      await c.publishDefenseNow();
      const log = await c.fetchMyLog();
      if (alive && log.length) {
        let r = { won: 0, lost: 0, delta: 0 };
        mutate((s) => { r = applyDefenseLog(s, log); });
        if (r.won + r.lost) toast(`Ta défense : ${r.won} victoire${r.won > 1 ? 's' : ''}, ${r.lost} défaite${r.lost > 1 ? 's' : ''} (${r.delta >= 0 ? '+' : ''}${r.delta} points).`, r.delta >= 0 ? 'ok' : 'info');
      }
      if (!arenaDefenses().length) {
        const bl = useGame.getState().save!.blocked ?? [];
        setArenaDefenses((await c.fetchDefenses(playerTeamPower(useGame.getState().save!))).filter((d) => !bl.some((b) => b.uid === d.uid)));
        const cur = useGame.getState().save!.arena.opponents;
        if (alive && arenaDefenses().length && !cur.some((o) => o.real)) mutate((s) => { s.arena.opponents = generateOpponents(s, seededRand(Date.now())); });
      }
      if (alive) setOnline('ok');
    }).catch(() => { if (alive) setOnline('error'); });
    return () => { alive = false; };
  }, [user, mutate]); // eslint-disable-line react-hooks/exhaustive-deps
  const anyReal = save.arena.opponents.some((o) => o.real);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const defTeam = defenseTeam(save);
  const setDefense = (id: string) => {
    mutate((s) => { s.arena.defenseTeamId = id; });
    if (user) void loadCloud().then((c) => c.publishDefenseNow()).then(() => toast('Défense publiée.', 'ok')).catch(() => toast('Défense enregistrée ; elle sera publiée à la prochaine connexion.'));
  };
  const revenge = async (e: ArenaLogEntry) => {
    if (tickets <= 0) { toast('Plus de tickets aujourd’hui.', 'error'); return; }
    try {
      const c = await loadCloud();
      const d = await c.fetchDefense(e.attacker);
      if (!d) { toast(`${e.name} n’a plus d’équipe de défense en ligne.`); return; }
      const op = opponentFromDefense(d, e.id);
      mutate((s) => { s.arena.opponents = [...s.arena.opponents.filter((o) => !o.revenge), op]; });
      push({ name: 'prep', spec: { mode: 'arena', opponentId: op.id } });
    } catch { toast('Serveur injoignable pour le moment.', 'error'); }
  };
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
      <p className="hint" style={{ margin: '0 0 10px' }}>
        {anyReal
          ? 'Les adversaires « Joueur » sont les vraies équipes de défense d’autres joueurs : leurs héros, niveaux, rangs, compétences et équipement.'
          : user ? (online === 'loading' ? 'Recherche de joueurs de ta puissance…' : online === 'error' ? 'Serveur injoignable : l’Arène t’oppose des Héritiers imaginaires.' : 'Aucun joueur en ligne de ta puissance pour l’instant : l’Arène t’oppose des Héritiers imaginaires, calibrés sur ta puissance.')
            : 'Ces adversaires sont des Héritiers imaginaires. Crée un compte (Menu → Sauvegarde) pour affronter les vraies équipes d’autres joueurs, et publier la tienne.'}
      </p>
      {save.arena.opponents.map((o, i) => (
        <Panel key={o.id}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div><b>{maskProfanity(o.name)}</b> <span className={`ar-tag ${o.real ? 'real' : ''}`}>{o.revenge ? 'Vengeance' : o.real ? 'Joueur' : 'Imaginaire'}</span><div className="faint">{o.revenge ? 'A battu ta défense' : ['Accessible', 'Équilibré', 'Redoutable'][i]} · puissance {fmt(o.power)}</div></div>
            <button className="btn small" disabled={tickets <= 0} onClick={() => push({ name: 'prep', spec: { mode: 'arena', opponentId: o.id } })}>Défier</button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {o.heroes.map((h) => (
              <div key={h.slot} className="xp-ava" style={{ width: 46, height: 46, position: 'relative' }}><HeroArt heroId={h.heroId} /><span className="u-lvl">{h.level}</span></div>
            ))}
          </div>
          <div className="faint" style={{ marginTop: 4 }}>{o.heroes.map((h) => HERO_BY_ID[h.heroId].name.split(/[ ,]/)[0]).join(', ')}{o.real && o.uid && <button className="acc-link" style={{ marginLeft: 8 }} onClick={() => setReport({ uid: o.uid!, name: o.name, kind: 'name', where: 'Arène' })}>Signaler</button>}</div>
        </Panel>
      ))}
      <Panel title="Ta défense">
        <p className="faint" style={{ marginTop: 0 }}>{user ? 'L’équipe que les autres joueurs affrontent quand ils te défient. Une défense qui gagne te rapporte des points ; une défaite t’en coûte un peu.' : 'Avec un compte, cette équipe sera publiée : les autres joueurs l’affronteront.'}</p>
        <div className="seg" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
          {save.teams.map((t) => <button key={t.id} className={t.id === defTeam.id ? 'on' : ''} onClick={() => setDefense(t.id)}>{t.name}</button>)}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {defTeam.slots.map((u, k) => { const h = save.heroes.find((x) => x.uid === u); return h ? <div key={k} className="xp-ava" style={{ width: 46, height: 46, position: 'relative' }}><HeroArt heroId={h.heroId} /><span className="u-lvl">{h.level}</span></div> : null; })}
        </div>
        {!save.settings.showInRanks && user && <p className="hint" style={{ marginBottom: 0 }}>Tu as choisi de ne pas apparaître dans les classements : ta défense n’est pas publiée.</p>}
      </Panel>
      {save.arena.log.length > 0 && (
        <Panel title="Journal de défense">
          {save.arena.log.slice(0, 10).map((e) => (
            <div key={e.id} className="stat-row" style={{ alignItems: 'center' }}>
              <span className="row" style={{ gap: 8, minWidth: 0 }}>
                <span className="xp-ava" style={{ width: 34, height: 34, flexShrink: 0 }}><HeroArt heroId={HERO_BY_ID[e.avatar] ? e.avatar : 'torvald'} /></span>
                <span style={{ minWidth: 0 }}><b>{e.name}</b><div className="faint">{e.won ? `a battu ta défense · −${e.points}` : `a perdu contre ta défense · +${e.points}`} · {ago(now - e.at)}</div></span>
              </span>
              {e.won && (save.arena.revenged.includes(e.id) ? <span className="faint">Vengé</span> : <button className="btn small secondary" onClick={() => void revenge(e)}>Venger</button>)}
            </div>
          ))}
        </Panel>
      )}
      {report && <ReportSheet target={report} onClose={() => setReport(null)} />}
      <Panel title="Ligues et récompenses de victoire">
        {ARENA_TIERS.map((t) => (
          <div key={t.id} className="stat-row"><b style={{ color: t.color }}>{t.name}</b><span className="faint">dès {t.min} · {Object.entries(t.reward).map(([k, v]) => `${v} ${k === 'gold' ? 'or' : k === 'crystals' ? 'cristaux' : k === 'shardAeon' ? 'éclat d’Aeon' : 'éclat terne'}`).join(', ')}</span></div>
        ))}
      </Panel>
    </Screen>
  );
}

const ago = (ms: number) => { const m = Math.floor(ms / 60000); return m < 60 ? `il y a ${Math.max(1, m)} min` : m < 1440 ? `il y a ${Math.floor(m / 60)} h` : `il y a ${Math.floor(m / 1440)} j`; };

/** Raccourci vers le classement du mode. */
function RanksBtn({ tab }: { tab: 'arena' | 'tower' | 'boss' }) {
  return <button className="btn secondary small" onClick={() => useUI.getState().push({ name: 'ranks', tab })}>Classement</button>;
}

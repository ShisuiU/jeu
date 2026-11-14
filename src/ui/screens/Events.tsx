import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { activeEvents, bannerAvailable, claimMilestone, eventPoints, loginState, milestoneState, nextWeekly, trialsDone } from '../../game/events';
import { claimLoginDay } from '../../game/loginEvent';
import { goFor } from '../../game/goTo';
import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { HeroArt } from '../art/HeroArt';
import { msUntilReset } from '../../core/time';
import { Modal } from '../components/common';
import { claimEventTask, eventClaimable, eventTaskState } from '../../game/missions';
import { canStart } from '../../game/modes';
import { BONUS_LABEL, BONUS_SHORT } from '../../data/eventCycle';
import { RESOURCES, normalizeReward } from '../../data/resources';
import type { GameEvent } from '../../data/events';
import { formatDuration } from '../../core/time';
import { play } from '../../audio/sfx';
import { Panel, Screen } from '../components/common';
import { RewardView, rewardMainIcon } from '../components/RewardView';
import { EnemyArt } from '../art/EnemyArt';
import { BattleBackdrop } from '../art/BattleBackdrop';

// ÉVÉNEMENTS — l'événement de la semaine (thème, bonus, épreuve, objectifs, paliers) et les événements spéciaux.

const left = (ms: number) => { const d = Math.floor(ms / 86_400_000); return d >= 1 ? `${d} j ${Math.floor((ms % 86_400_000) / 3_600_000)} h` : formatDuration(ms); };
const fmtMult = (m: number) => `×${String(m).replace('.', ',')}`;
const rewardText = (r: Record<string, number | undefined>) => Object.entries(normalizeReward(r)).map(([k, v]) => `+${(v ?? 0).toLocaleString('fr-FR')} ${RESOURCES[k as keyof typeof RESOURCES]?.name ?? k}`).join(' · ');

export function Events() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const list = activeEvents(now);
  const [sel, setSel] = useState(list[0]?.id);
  const e = list.find((x) => x.id === sel) ?? list[0];

  // L'événement a été vu : la pastille « nouveau » disparaît.
  useEffect(() => { if (e && !save.flags[`seen_${e.id}`]) mutate((s) => { s.flags[`seen_${e.id}`] = true; }); }, [e?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen title="Événements">
      {list.length > 1 && (
        <div className="seg" style={{ marginBottom: 12 }}>
          {list.map((x) => { const n = eventClaimable(save, now, x.id); return <button key={x.id} className={x.id === e?.id ? 'on' : ''} onClick={() => setSel(x.id)}>{x.cycle ? 'Semaine' : x.short ?? x.name}{n > 0 && <span className="seg-count">{n}</span>}</button>; })}
        </div>
      )}
      {!e && <div className="hint">Aucun événement en cours.</div>}
      {e?.cycle ? <Weekly e={e} /> : e ? <Special e={e} /> : null}
    </Screen>
  );
}

function useClaim() {
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  return (fn: (s: NonNullable<ReturnType<typeof useGame.getState>['save']>) => boolean) => {
    let ok = false; mutate((s) => { ok = fn(s); });
    if (ok) { play('claim'); toast('Récompense obtenue !', 'ok'); }
  };
}

function Tasks({ e }: { e: GameEvent }) {
  const save = useGame((s) => s.save)!;
  const claim = useClaim();
  if (!e.tasks?.length) return null;
  return (
    <Panel title="Objectifs">
      {e.tasks.map((t) => {
        const st = eventTaskState(save, e.id, t.id)!;
        return (
          <div key={t.id} className={`mission ${st.claimed ? 'claimed' : ''}`}>
            {t.points ? <div className="wk-pts">+{t.points}</div> : <div className="m-ic">{rewardMainIcon(t.reward, 24)}</div>}
            <div className="grow">
              <div className="m-title">{t.title}</div>
              <div className="progress" style={{ margin: '5px 0 3px' }}><div style={{ width: `${Math.min(100, (st.value / t.target) * 100)}%` }} /></div>
              <div className="faint">{rewardText(t.reward)}</div>
            </div>
            {st.claimed ? <span className="m-done">✓</span> : st.done ? <button className="btn small" onClick={() => claim((s) => claimEventTask(s, e.id, t.id))}>Réclamer</button> : (() => { const go = goFor(save, t.key); return <span className="m-side"><span className="m-count">{st.value}/{t.target}</span>{go && ('route' in go ? <button className="m-go" onClick={() => useUI.getState().push(go.route)}>Y aller ›</button> : <span className="m-lock">{go.locked}</span>)}</span>; })()}
          </div>
        );
      })}
    </Panel>
  );
}

function Weekly({ e }: { e: GameEvent }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const claim = useClaim();
  const c = e.cycle!;
  const pts = eventPoints(save, e);
  const max = c.milestones[c.milestones.length - 1].points;
  const done = trialsDone(save, e);
  const nxt = nextWeekly(now);
  const [tier, setTier] = useState<number | null>(null);
  const tierSt = tier != null ? milestoneState(save, e, tier) : null;
  return (
    <>
      <div className="wk-hero" style={{ ['--mc' as string]: e.color }}>
        <div className="wk-bg"><BattleBackdrop region={c.region} /></div>
        <div className="wk-art"><EnemyArt enemyId={c.art} /></div>
        <div className="wk-text">
          <div className="wk-when">Fin dans {left(Date.parse(e.end) - now)}</div>
          <h2>{e.name}</h2>
          <p>{c.tagline}</p>
          <span className="wk-bonus" title={BONUS_LABEL[c.bonus.kind]}>Bonus {BONUS_SHORT[c.bonus.kind]} {fmtMult(c.bonus.mult)}</span>
        </div>
      </div>

      <Panel>
        <div className="wk-head"><b>{pts}</b><span className="faint"> / {max} points</span></div>
        <div className="wk-track">
          <div className="wk-fill" style={{ width: `${Math.min(100, (pts / max) * 100)}%` }} />
          {c.milestones.map((m, i) => {
            const st = milestoneState(save, e, i)!;
            return (
              <button key={i} className={`wk-node ${st.claimed ? 'claimed' : st.ready ? 'ready' : ''}`} style={{ left: `${(m.points / max) * 100}%` }} aria-label={`Palier ${m.points} points`}
                onClick={() => (st.ready ? claim((s) => claimMilestone(s, e.id, i, now)) : setTier(tier === i ? null : i))}>
                {st.claimed ? '✓' : rewardMainIcon(m.reward, 16)}
                <span>{m.points}</span>
              </button>
            );
          })}
        </div>
        {tierSt && !tierSt.ready && <div className="wk-tip"><span className="faint">Palier {tierSt.points} points{tierSt.claimed ? ' (réclamé)' : ''}</span><RewardView reward={tierSt.reward} /></div>}
      </Panel>

      <Panel title="Épreuve">
        {c.trials.map((t, i) => {
          const state = i < done ? 'done' : i === done ? 'open' : 'locked';
          const ok = state === 'open' && canStart(save, { mode: 'challenge', eventId: e.id, trial: i }).ok;
          return (
            <div key={t.id} className={`wk-trial ${state}`}>
              <div className="wk-step">{state === 'done' ? '✓' : i + 1}</div>
              <div className="grow">
                <div className="m-title">{t.name}</div>
                <div className="faint">+{t.points} points</div>
              </div>
              {state === 'open' && <button className="btn small" disabled={!ok} onClick={() => push({ name: 'prep', spec: { mode: 'challenge', eventId: e.id, trial: i } })}>Combattre</button>}
            </div>
          );
        })}
      </Panel>

      <Tasks e={e} />
      <p className="faint" style={{ textAlign: 'center' }}>La semaine prochaine : {nxt.theme.name}</p>
    </>
  );
}

function Special({ e }: { e: GameEvent }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const p = save.events[e.id];
  const chal = e.challenge ? canStart(save, { mode: 'challenge', eventId: e.id }) : null;
  return (
    <>
      <div className="event-card" style={{ ['--mc' as string]: e.color ?? '#b98cff' }}>
        <div className="faint">Fin dans {left(Date.parse(e.end) - now)}</div>
        <h2 style={{ fontSize: 22, color: e.color }}>{e.name}</h2>
        <p className="muted" style={{ fontSize: 13 }}>{e.description}</p>
        <div className="row wrap" style={{ gap: 6 }}>
          {e.dungeonBonus && e.dungeonBonus > 1 && <span className="chip active">Donjons {fmtMult(e.dungeonBonus)}</span>}
          {e.banners?.filter((b) => bannerAvailable(b, now)).map((b) => <button key={b} className="chip active" onClick={() => push({ name: 'summon' })}>Invocation spéciale ›</button>)}
        </div>
      </div>
      {e.login && <LoginCalendar e={e} />}
      <Tasks e={e} />
      {e.challenge && (
        <Panel title="Défi spécial">
          <b>{e.challenge.name}</b>
          <p className="faint">{e.challenge.description}</p>
          <RewardView reward={e.challenge.reward} />
          <button className="btn block" style={{ marginTop: 10 }} disabled={!chal?.ok} onClick={() => push({ name: 'prep', spec: { mode: 'challenge', eventId: e.id } })}>{p?.challengeDone ? 'Défi réussi ✓' : 'Relever le défi'}</button>
        </Panel>
      )}
    </>
  );
}

/** Calendrier de connexion : un cadeau par jour de jeu, le héros exclusif au dernier jour. */
function LoginCalendar({ e }: { e: GameEvent }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const [got, setGot] = useState<{ day: number; hero?: string; duplicate?: boolean } | null>(null);
  const st = loginState(save, e, now);
  const days = e.login!.days;
  const heroDay = days.find((d) => d.hero);
  const hero = heroDay?.hero ? HERO_BY_ID[heroDay.hero] : null;
  const claim = () => { let r: ReturnType<typeof claimLoginDay> = { ok: false }; mutate((s) => { r = claimLoginDay(s, e.id, now); }); if (r.ok) { play(r.hero ? 'rare' : 'claim'); setGot({ day: r.day!, hero: r.hero, duplicate: r.duplicate }); } };
  return (
    <Panel title={`Connexion · ${st.claimed}/${st.total} jours`}>
      {hero && (
        <div className="login-hero" style={{ ['--rc' as string]: RARITIES[hero.rarity].color }}>
          <div className="lh-art"><HeroArt heroId={hero.id} kind="portrait" /></div>
          <div className="lh-text">
            <span className="lh-tag">Exclusif · jour {days.indexOf(heroDay!) + 1}</span>
            <b>{hero.name}</b>
            <span className="faint">{RARITIES[hero.rarity].name} · ne s’obtient pas par invocation</span>
          </div>
        </div>
      )}
      <div className="daily-grid login-grid">
        {days.map((d, i) => (
          <div key={i} className={`daily-cell ${i < st.claimed ? 'claimed' : ''} ${i === st.claimed && st.ready ? 'current' : ''} ${d.hero ? 'major' : ''}`}>
            <span className="d">J{i + 1}</span>
            {d.hero ? <span className="lg-hero"><HeroArt heroId={d.hero} kind="portrait" /></span> : rewardMainIcon(d.reward)}
            <span>{d.hero ? 'Héros' : Object.values(d.reward)[0]}</span>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 12 }} disabled={!st.ready} onClick={claim}>
        {st.claimed >= st.total ? 'Tous les cadeaux sont réclamés' : st.ready ? `Réclamer le jour ${st.claimed + 1}` : `Reviens demain · dans ${formatDuration(msUntilReset(now))}`}
      </button>
      {got && (
        <Modal onClose={() => setGot(null)}>
          {got.hero ? (
            <>
              <div className="login-won" style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[got.hero].rarity].color }}><HeroArt heroId={got.hero} kind="portrait" /></div>
              <h2>{HERO_BY_ID[got.hero].name}</h2>
              <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{got.duplicate ? 'Déjà à tes côtés : +1 doublon.' : 'rejoint tes Héritiers !'}</p>
            </>
          ) : (
            <>
              <h2>Jour {got.day}</h2>
              <RewardView reward={days[got.day - 1].reward} />
            </>
          )}
          <button className="btn block" style={{ marginTop: 14 }} onClick={() => setGot(null)}>Continuer</button>
        </Modal>
      )}
    </Panel>
  );
}

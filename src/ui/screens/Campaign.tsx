import { Coach } from '../components/Coach';
import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CHAPTERS, DIFFICULTIES, DIFFICULTY_ORDER, type DifficultyId } from '../../data/campaign';
import { HERO_BY_ID } from '../../data/heroes';
import { chapterStars, isStageUnlocked, stageEnergy, stageProgress } from '../../game/campaign';
import { InfoButton, Screen } from '../components/common';
import { Icon } from '../art/Icons';
import { BattleBackdrop } from '../art/BattleBackdrop';
import { EnemyArt } from '../art/EnemyArt';
import { STAR_STEPS, anyStarChest, claimStarChest, starChestClaimed, starChestReward, starChestsReady } from '../../game/starChests';
import { RewardInline } from '../components/RewardView';
import { play } from '../../audio/sfx';

export function Campaign() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const mutate = useGame((s) => s.mutate);
  const [diff, setDiff] = useState<DifficultyId>('normal');
  const latest = (d: DifficultyId) => [...CHAPTERS].reverse().find((c) => isStageUnlocked(save, d, c.stages[0]))?.n ?? 1;
  const [chap, setChap] = useState<number>(() => latest('normal'));
  const c = CHAPTERS.find((x) => x.n === chap)!;
  const st = chapterStars(save, diff, c.n);
  const bossStage = c.stages[c.stages.length - 1];
  const bossId = bossStage.waves[bossStage.waves.length - 1].find((w) => w.hpMult)?.enemy;
  const reward = bossStage.firstClear.heroes?.[0];

  return (
    <Screen title="Campagne">
      <Coach id="campaign_stage" target=".stage-node:not(.locked)" text="Choisis le premier niveau." />
      <div className="seg camp-diff" style={{ marginBottom: 10 }}>
        {DIFFICULTY_ORDER.map((d) => {
          const open = isStageUnlocked(save, d, CHAPTERS[0].stages[0]);
          return <button key={d} className={`${diff === d ? 'on' : ''} ${open ? '' : 'locked'}`} aria-disabled={!open} onClick={() => { if (!open) { toast(`${DIFFICULTIES[d].name} : termine d’abord le chapitre 1 en ${DIFFICULTIES[DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(d) - 1]].name}.`); return; } setDiff(d); setChap(latest(d)); }}>{DIFFICULTIES[d].name}{open && anyStarChest(save, d) && <span className="seg-dot" />}</button>;
        })}
      </div>
      <div className="chips camp-chaps" style={{ marginBottom: 12 }} ref={(el) => { const a = el?.querySelector<HTMLElement>('.chip.active'); if (a && el && (a.offsetLeft + a.offsetWidth > el.scrollLeft + el.clientWidth || a.offsetLeft < el.scrollLeft)) el.scrollLeft = a.offsetLeft - el.clientWidth / 2 + a.offsetWidth / 2; }}>
        {CHAPTERS.map((x) => {
          const open = isStageUnlocked(save, diff, x.stages[0]);
          const done = stageProgress(save, diff, x.stages[9].id).clears > 0;
          return (
            <button key={x.n} className={`chip ${chap === x.n ? 'active' : ''}`} style={open ? undefined : { opacity: 0.45 }}
              onClick={() => (open ? setChap(x.n) : toast(`Chapitre ${x.n} : bats d’abord le boss du chapitre ${x.n - 1}.`))}>
              {!open && <Icon.lock size={12} />}Ch. {x.n}{done && ' ✓'}{open && starChestsReady(save, diff, x.n).length > 0 && <span className="chip-dot" />}
            </button>
          );
        })}
      </div>

      <div className="chapter-card">
        <BattleBackdrop region={c.backdrop} />
        {bossId && <div className="chapter-boss"><EnemyArt enemyId={bossId} /></div>}
        <div className="chapter-info">
          <div className="faint" style={{ color: 'var(--gold)' }}>CHAPITRE {c.n} · {c.region.toUpperCase()}</div>
          <h2 style={{ fontSize: 22 }}>{c.name}</h2>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>{c.intro}</p>
          <div className="row chap-meta"><span className="nowrap"><Icon.star size={16} /> <b>{st.stars}</b><span className="faint"> / {st.max}</span></span>
            {reward && <span className="faint chap-reward">Récompense : {HERO_BY_ID[reward].name.split(/[ ,]/)[0]}</span>}
            <span className="chip" style={{ marginLeft: 'auto' }}>{DIFFICULTIES[diff].name}{DIFFICULTIES[diff].levelAdd ? ` · +${DIFFICULTIES[diff].levelAdd}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Coffres d'étoiles du chapitre (10, 20, 30 étoiles), propres à chaque difficulté. */}
      <div className="star-chests">
        <div className="sc-bar"><i style={{ width: `${Math.min(100, (st.stars / st.max) * 100)}%` }} />{STAR_STEPS.map((n) => <b key={n} style={{ left: `${(n / st.max) * 100}%` }} />)}</div>
        <div className="sc-row">
          {STAR_STEPS.map((n) => {
            const claimed = starChestClaimed(save, diff, c.n, n);
            const ready = !claimed && st.stars >= n;
            return (
              <button key={n} className={`sc-chest ${ready ? 'ready' : ''} ${claimed ? 'claimed' : ''}`}
                onClick={() => {
                  if (claimed) { toast('Coffre déjà récupéré.'); return; }
                  if (!ready) { toast(`Encore ${n - st.stars} étoile${n - st.stars > 1 ? 's' : ''} pour ouvrir ce coffre.`); return; }
                  let got: ReturnType<typeof claimStarChest> = null;
                  mutate((d) => { got = claimStarChest(d, diff, c.n, n); });
                  if (got) { play('claim'); toast(`Coffre de ${n} étoiles récupéré !`, 'ok'); }
                }}>
                <span className="scc-head"><Icon.star size={13} /> {n}{claimed ? ' ✓' : ''}</span>
                <RewardInline reward={starChestReward(diff, n)} />
                {ready && <span className="scc-go">Récupérer</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="stage-path">
        {c.stages.map((stage) => {
          const unlocked = isStageUnlocked(save, diff, stage);
          const p = stageProgress(save, diff, stage.id);
          const lv = Math.max(...stage.waves.flat().map((w) => w.level)) + DIFFICULTIES[diff].levelAdd;
          return (
            <button key={stage.id} className={`stage-node ${unlocked ? '' : 'locked'} ${p.clears ? 'cleared' : ''} ${stage.boss ? 'boss' : ''}`}
              onClick={() => unlocked ? push({ name: 'prep', spec: { mode: 'campaign', stageId: stage.id, difficulty: diff } }) : toast('Termine d’abord le niveau précédent.')}>
              <span className="sn-idx">{stage.boss ? <Icon.skull size={20} /> : stage.index}</span>
              <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                <div className="sn-name">{stage.name}</div>
                <div className="faint">{stage.id} · niv. {Math.min(70, lv)} · <Icon.energy size={11} /> {stageEnergy(stage, diff)}{stage.before && !p.clears && diff === 'normal' ? ' · Dialogue' : ''}</div>
              </div>
              {unlocked ? <span className="sn-stars">{[1, 2, 3].map((n) => <Icon.star key={n} size={14} color={n <= p.stars ? '#ffd36b' : '#3a3442'} />)}</span> : <Icon.lock size={18} />}
            </button>
          );
        })}
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 6, marginTop: 6 }}><span className="faint">Difficultés</span><InfoButton title="Difficultés">Difficile, Expert et Cauchemar : ennemis de niveau +15 / +30 / +45 (max. 70), plus puissants. Récompenses ×1,6 / ×2,4 / ×3,5.</InfoButton></div>
    </Screen>
  );
}

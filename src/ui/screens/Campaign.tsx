import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CHAPTERS, DIFFICULTIES, DIFFICULTY_ORDER, type DifficultyId } from '../../data/campaign';
import { useState } from 'react';
import { CHAPTERS_PLANNED as CHAPTERS_PLANNED_FALLBACK } from '../../data/lore';
import { chapterStars, isStageUnlocked, stageEnergy, stageProgress } from '../../game/campaign';
import { Panel, Screen } from '../components/common';
import { Icon } from '../art/Icons';
import { BattleBackdrop } from '../art/BattleBackdrop';

export function Campaign() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const [diff, setDiff] = useState<DifficultyId>('normal');
  return (
    <Screen title="Campagne">
      <div className="seg" style={{ marginBottom: 12 }}>
        {DIFFICULTY_ORDER.map((d) => {
          const open = isStageUnlocked(save, d, CHAPTERS[0].stages[0]);
          return <button key={d} className={diff === d ? 'on' : ''} style={open ? undefined : { opacity: 0.45 }} onClick={() => open ? setDiff(d) : toast(`${DIFFICULTIES[d].name} : terminez d’abord le chapitre en ${DIFFICULTIES[DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(d) - 1]].name}.`)}>{DIFFICULTIES[d].name}</button>;
        })}
      </div>
      {CHAPTERS.map((c) => {
        const st = chapterStars(save, diff, c.n);
        return (
          <div key={c.n}>
            <div className="chapter-card">
              <BattleBackdrop region={c.backdrop} />
              <div className="chapter-info">
                <div className="faint" style={{ color: 'var(--gold)' }}>CHAPITRE {c.n} · {c.region.toUpperCase()}</div>
                <h2 style={{ fontSize: 22 }}>{c.name}</h2>
                <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>{c.intro}</p>
                <div className="row"><Icon.star size={16} /> <b>{st.stars}</b><span className="faint">/ {st.max}</span><span className="chip" style={{ marginLeft: 'auto' }}>{DIFFICULTIES[diff].name}{DIFFICULTIES[diff].levelAdd ? ` · niv. +${DIFFICULTIES[diff].levelAdd}` : ''}</span></div>
              </div>
            </div>
            <div className="stage-path">
              {c.stages.map((stage) => {
                const unlocked = isStageUnlocked(save, diff, stage);
                const p = stageProgress(save, diff, stage.id);
                return (
                  <button key={stage.id} className={`stage-node ${unlocked ? '' : 'locked'} ${p.clears ? 'cleared' : ''} ${stage.boss ? 'boss' : ''}`}
                    onClick={() => unlocked ? push({ name: 'prep', spec: { mode: 'campaign', stageId: stage.id, difficulty: diff } }) : toast('Terminez d’abord le niveau précédent.')}>
                    <span className="sn-idx">{stage.boss ? <Icon.skull size={20} /> : stage.index}</span>
                    <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="sn-name">{stage.name}</div>
                      <div className="faint">{stage.id} · <Icon.energy size={11} /> {stageEnergy(stage, diff)}{stage.before && !p.clears && diff === 'normal' ? ' · Dialogue' : ''}</div>
                    </div>
                    {unlocked ? (
                      <span className="sn-stars">{[1, 2, 3].map((n) => <Icon.star key={n} size={14} color={n <= p.stars ? '#ffd36b' : '#3a3442'} />)}</span>
                    ) : <Icon.lock size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <Panel title="Chapitres à venir">
        {CHAPTERS_PLANNED_FALLBACK.filter((c) => !CHAPTERS.some((x) => x.n === c.n)).map((c) => (
          <div key={c.n} className="stat-row" style={{ opacity: 0.6 }}><span>Chapitre {c.n} · {c.name}</span><span className="faint">{c.region}</span></div>
        ))}
        <p className="faint" style={{ marginTop: 8 }}>Difficile, Expert et Cauchemar : ennemis de niveau +15 / +30 / +45, plus puissants, récompenses ×1,6 / ×2,4 / ×3,5.</p>
      </Panel>
    </Screen>
  );
}

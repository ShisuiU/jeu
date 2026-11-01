import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CHAPTERS } from '../../data/campaign';
import { CHAPTERS_PLANNED as CHAPTERS_PLANNED_FALLBACK } from '../../data/lore';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { Panel, Screen } from '../components/common';
import { Icon } from '../art/Icons';
import { BattleBackdrop } from '../art/BattleBackdrop';

export function Campaign() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const diff = 'normal' as const;
  return (
    <Screen title="Campagne">
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
                <div className="row"><Icon.star size={16} /> <b>{st.stars}</b><span className="faint">/ {st.max}</span><span className="chip" style={{ marginLeft: 'auto' }}>Normal</span></div>
              </div>
            </div>
            <div className="stage-path">
              {c.stages.map((stage) => {
                const unlocked = isStageUnlocked(save, diff, stage);
                const p = stageProgress(save, diff, stage.id);
                return (
                  <button key={stage.id} className={`stage-node ${unlocked ? '' : 'locked'} ${p.clears ? 'cleared' : ''} ${stage.boss ? 'boss' : ''}`}
                    onClick={() => unlocked ? push({ name: 'stage', stageId: stage.id }) : toast('Terminez d’abord le niveau précédent.')}>
                    <span className="sn-idx">{stage.boss ? <Icon.skull size={20} /> : stage.index}</span>
                    <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="sn-name">{stage.name}</div>
                      <div className="faint">{stage.id} · <Icon.energy size={11} /> {stage.energy}{stage.before && !p.clears ? ' · Dialogue' : ''}</div>
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
        <p className="faint" style={{ marginTop: 8 }}>Les difficultés Difficile, Expert et Cauchemar arrivent en phase 4.</p>
      </Panel>
    </Screen>
  );
}

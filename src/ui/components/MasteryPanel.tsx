import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { MASTERIES, MASTERY_BRANCHES, MASTERY_RESET_GOLD, MASTERY_TIERS, MAX_ULTIMATES, type MasteryDef } from '../../data/masteries';
import { RESOURCES } from '../../data/resources';
import { heroMasteries, learnMastery, masteryBlock, masteryScrollsSpent, resetMasteries } from '../../game/masteries';
import { play } from '../../audio/sfx';
import { Modal, fmt } from './common';
import { Icon, ResourceIcon } from '../art/Icons';
import type { HeroInstance } from '../../save/schema';

// MAÎTRISES — 3 colonnes (Offensive, Défensive, Soutien), 4 paliers chacune, du bas vers le haut de la puissance.
export function MasteryPanel({ h }: { h: HeroInstance }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [sel, setSel] = useState<MasteryDef | null>(null);
  const [reset, setReset] = useState(false);
  const have = heroMasteries(h);
  const ult = have.filter((id) => id.endsWith('4')).length;

  const learn = () => {
    if (!sel) return;
    let r: ReturnType<typeof learnMastery> = { ok: false };
    mutate((s) => { r = learnMastery(s, h.uid, sel.id); });
    if (r.ok) { play('rare'); toast(`${sel.name} apprise.`, 'ok'); setSel(null); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const doReset = () => {
    let r: ReturnType<typeof resetMasteries> = { ok: false };
    mutate((s) => { r = resetMasteries(s, h.uid); });
    setReset(false);
    if (r.ok) toast(`Maîtrises réinitialisées : ${r.scrolls} parchemins rendus.`, 'ok'); else toast(r.reason ?? 'Impossible.', 'error');
  };
  const scroll = RESOURCES.masteryScroll;

  return (
    <>
      <p className="faint" style={{ margin: '0 0 8px' }}>Chaque branche se débloque palier par palier. Ultimes (en haut) : {ult}/{MAX_ULTIMATES}.</p>
      <div className="ms-tree">
        {MASTERY_BRANCHES.map((b) => (
          <div key={b.id} className="ms-col" style={{ ['--mc' as string]: b.color }}>
            <div className="ms-head">{b.name}</div>
            {MASTERIES.filter((m) => m.branch === b.id).sort((x, y) => y.tier - x.tier).map((m) => {
              const on = have.includes(m.id);
              const why = on ? null : masteryBlock(save, h, m);
              const ready = !on && !why;
              const locked = !on && !!why && !/insuffisant/.test(why);
              return (
                <button key={m.id} className={`ms-node t${m.tier} ${on ? 'on' : ''} ${ready ? 'ready' : ''} ${locked ? 'locked' : ''}`} onClick={() => setSel(m)} aria-label={`${m.name} : ${m.text}${on ? ' (apprise)' : ''}`}>
                  <span className="ms-tier">{m.tier === 4 ? '★' : m.tier}</span>
                  <span className="ms-name">{m.name}</span>
                  <span className="ms-text">{m.text}</span>
                  {locked && <span className="ms-lock"><Icon.lock size={11} /></span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {have.length > 0 && (
        <button className="btn secondary small block" style={{ marginTop: 10 }} onClick={() => setReset(true)}>Réinitialiser ({masteryScrollsSpent(h)} parchemins rendus)</button>
      )}

      {sel && (
        <Modal onClose={() => setSel(null)}>
          <h2>{sel.name}</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{sel.text}{sel.tier === 4 ? ` · Maîtrise ultime (${MAX_ULTIMATES} au plus par héros)` : ''}</p>
          {have.includes(sel.id) ? <p style={{ textAlign: 'center' }}><b>Déjà apprise.</b></p> : (
            <>
              <div className="mk-cost">
                <span className="muted">Coût · niveau {MASTERY_TIERS[sel.tier].minLevel} requis</span>
                <span className="row" style={{ gap: 10 }}>
                  <span className={`mk-price ${save.resources.masteryScroll < MASTERY_TIERS[sel.tier].scrolls ? 'lack' : ''}`}><ResourceIcon icon={scroll.icon} color={scroll.color} size={16} />{MASTERY_TIERS[sel.tier].scrolls}</span>
                  <span className={`mk-price ${save.resources.gold < MASTERY_TIERS[sel.tier].gold ? 'lack' : ''}`}><Icon.coin size={15} />{fmt(MASTERY_TIERS[sel.tier].gold)}</span>
                </span>
              </div>
              {masteryBlock(save, h, sel) && <p className="faint" style={{ textAlign: 'center', marginBottom: 0 }}>{masteryBlock(save, h, sel)}</p>}
            </>
          )}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setSel(null)}>Fermer</button>
            {!have.includes(sel.id) && <button className="btn grow" disabled={!!masteryBlock(save, h, sel)} onClick={learn}>Apprendre</button>}
          </div>
        </Modal>
      )}
      {reset && (
        <Modal onClose={() => setReset(false)}>
          <h2>Réinitialiser les maîtrises ?</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Les {masteryScrollsSpent(h)} parchemins sont rendus (pas l’or). Coût : {MASTERY_RESET_GOLD.toLocaleString('fr-FR')} or.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setReset(false)}>Annuler</button>
            <button className="btn grow" disabled={save.resources.gold < MASTERY_RESET_GOLD} onClick={doReset}>Réinitialiser</button>
          </div>
        </Modal>
      )}
    </>
  );
}

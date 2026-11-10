import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BG_RUN_MS, clearBackground, stopBackground } from '../../game/background';
import { resolveMode } from '../../game/modes';
import { Icon } from '../art/Icons';
import { Modal } from './common';
import { RewardView } from './RewardView';
import { GearCard } from './GearCard';
import { play } from '../../audio/sfx';

// COMBATS EN ARRIÈRE-PLAN — une pastille au-dessus de la navigation, sur tous les écrans :
// progression de la série ; on la touche pour voir le butin, arrêter, ou fermer le résumé.
export function BgIndicator() {
  const run = useGame((s) => s.save?.bgRun);
  const save = useGame((s) => s.save);
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [open, setOpen] = useState(false);
  // Fin de série : un petit message, une seule fois.
  const endedRef = useRef(run?.endedReason);
  useEffect(() => {
    if (run?.endedReason && !endedRef.current) { play('claim'); toast(`Combats en arrière-plan : ${run.wins} victoire${run.wins > 1 ? 's' : ''} sur ${run.done}. ${run.endedReason}`, 'ok'); }
    endedRef.current = run?.endedReason;
  }, [run?.endedReason]);
  if (!run || !save) return null;
  const ended = !!run.endedReason;
  let title = 'Combat';
  try { title = resolveMode(save, run.spec).title; } catch { /* mode introuvable */ }
  const left = Math.max(0, Math.ceil((run.nextAt - now) / 1000));
  const status = ended ? run.endedReason : run.waiting ? 'En attente d’énergie' : left > 0 ? `Prochain combat dans ${left} s` : 'Combat en cours…';
  return (
    <>
      <button className={`bg-pill ${ended ? 'done' : ''}`} onClick={() => setOpen(true)} aria-label={`Combats en arrière-plan : ${run.done} sur ${run.total}`}>
        <Icon.loop size={15} />
        <span className="bgp-t">{ended ? 'Série terminée' : title}</span>
        <b>{run.done}/{run.total}</b>
        <i style={{ width: `${(run.done / run.total) * 100}%` }} />
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="unl-tag">Combats en arrière-plan</div>
          <h2>{title}</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
            {run.done} combat{run.done > 1 ? 's' : ''} sur {run.total} · {run.wins} victoire{run.wins > 1 ? 's' : ''}<br />{status}
          </p>
          {!ended && <div className="progress" style={{ margin: '4px 0 12px' }}><div style={{ width: `${(run.done / run.total) * 100}%` }} /></div>}
          {Object.keys(run.reward).length > 0 ? <RewardView reward={run.reward} /> : <p className="faint" style={{ textAlign: 'center' }}>Pas encore de butin.</p>}
          {run.gear.length > 0 && <div className="gear-grid" style={{ marginTop: 10 }}>{run.gear.slice(0, 8).map((g) => <GearCard key={g.uid} g={g} />)}</div>}
          {run.gear.length > 8 && <p className="faint">+ {run.gear.length - 8} autre(s) équipement(s)</p>}
          {!ended && <p className="faint" style={{ textAlign: 'center', fontSize: 12 }}>Un combat toutes les {BG_RUN_MS / 1000} s, même jeu fermé. Le butin arrive au fur et à mesure.</p>}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            {ended ? (
              <button className="btn block" onClick={() => { mutate((d) => clearBackground(d)); setOpen(false); play('claim'); }}>Fermer le résumé</button>
            ) : (
              <>
                <button className="btn secondary grow" onClick={() => setOpen(false)}>Continuer</button>
                <button className="btn danger grow" onClick={() => { mutate((d) => stopBackground(d)); toast('Série arrêtée. Le butin déjà gagné est à toi.', 'info'); }}>Arrêter</button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

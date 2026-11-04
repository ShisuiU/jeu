import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../state/store';
import type { SaveData } from '../../save/schema';
import { play } from '../../audio/sfx';

// TUTORIEL EN SITUATION — met en lumière l'élément à toucher, assombrit le reste, une phrase courte.
// Chaque étape ne s'affiche qu'une fois (drapeau coach_<id>), dans l'ordre (après l'étape « after »).
// Toucher l'élément éclairé valide l'étape ; « Passer le tutoriel » coupe tout.

export const COACH_ORDER = ['home_campaign', 'campaign_stage', 'prep_fight', 'battle_skill', 'battle_target', 'battle_auto',
  'home_summon', 'summon_call', 'home_sanct', 'sanct_level', 'hero_gear'] as const;
export type CoachId = typeof COACH_ORDER[number];

/** Joueur déjà avancé avant l'arrivée du tutoriel : on ne l'embête pas (sauf relance depuis les paramètres). */
function veteran(s: SaveData): boolean {
  if (s.flags.coach_force) return false;
  const clears = Object.values(s.progress.campaign).filter((p) => p.clears > 0).length;
  return clears >= 3 && !COACH_ORDER.some((id) => s.flags[`coach_${id}`]);
}

export function coachActive(s: SaveData, id: CoachId): boolean {
  if (s.flags.coach_off || s.flags[`coach_${id}`] || !s.flags.guide_done || veteran(s)) return false;
  const i = COACH_ORDER.indexOf(id);
  return i === 0 || !!s.flags[`coach_${COACH_ORDER[i - 1]}`];
}

/** Le tutoriel du début est-il encore en cours (pas de message par-dessus) ? */
export function inTutorial(s: SaveData): boolean {
  return s.flags.guide_done !== true || (!s.flags.coach_off && !s.flags.coach_home_summon && Object.values(s.progress.campaign).filter((p) => p.clears > 0).length < 3);
}

export function resetCoach(s: SaveData) {
  for (const id of COACH_ORDER) delete s.flags[`coach_${id}`];
  delete s.flags.coach_off;
  s.flags.coach_force = true;
}

type Rect = { x: number; y: number; w: number; h: number };

export function Coach({ id, target, text, when = true }: { id: CoachId; target: string; text: string; when?: boolean }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const active = when && coachActive(save, id);
  const [rect, setRect] = useState<Rect | null>(null);

  // Suit la position de l'élément (il peut bouger : défilement, animation, chargement).
  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(target);
      let r = el?.getBoundingClientRect();
      // Élément hors de l'écran (bas de page) : on le fait venir au centre, une fois.
      if (el && r && r.width && !scrolled && (r.bottom > window.innerHeight - 70 || r.top < 0)) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        r = el.getBoundingClientRect();
      }
      setRect((prev) => {
        if (!r || r.width === 0) return null;
        const n = { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 };
        return prev && Math.abs(prev.x - n.x) < 1 && Math.abs(prev.y - n.y) < 1 && Math.abs(prev.w - n.w) < 1 && Math.abs(prev.h - n.h) < 1 ? prev : n;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  // Toucher l'élément éclairé valide l'étape (sans bloquer le geste).
  useEffect(() => {
    if (!active) return;
    // Validé après le « click » (doigt relevé) : rien ne doit apparaître sous le doigt pendant le geste.
    const onClick = (e: MouseEvent) => {
      const el = document.querySelector(target);
      if (el && e.target instanceof Node && el.contains(e.target)) setTimeout(() => mutate((s) => { s.flags[`coach_${id}`] = true; }), 0);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active, target, id, mutate]);

  useEffect(() => { if (active && rect) play('open'); }, [active, !!rect]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !rect) return null;
  const vw = window.innerWidth, vh = window.innerHeight;
  const below = rect.y + rect.h / 2 < vh * 0.55;
  const bubbleTop = below ? Math.min(vh - 150, rect.y + rect.h + 12) : undefined;
  const bubbleBottom = below ? undefined : Math.min(vh - 60, vh - rect.y + 12);
  const arrowX = Math.max(24, Math.min(vw - 24, rect.x + rect.w / 2));
  return createPortal(
    <div className="coach" aria-live="polite">
      {/* quatre voiles autour du trou : l'élément éclairé reste touchable */}
      <div className="coach-veil" style={{ left: 0, top: 0, width: vw, height: Math.max(0, rect.y) }} />
      <div className="coach-veil" style={{ left: 0, top: rect.y + rect.h, width: vw, height: Math.max(0, vh - rect.y - rect.h) }} />
      <div className="coach-veil" style={{ left: 0, top: rect.y, width: Math.max(0, rect.x), height: rect.h }} />
      <div className="coach-veil" style={{ left: rect.x + rect.w, top: rect.y, width: Math.max(0, vw - rect.x - rect.w), height: rect.h }} />
      <div className="coach-ring" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
      <div className={`coach-bubble ${below ? 'below' : 'above'}`} style={{ top: bubbleTop, bottom: bubbleBottom, ['--ax' as string]: `${arrowX}px` }}>
        <p>{text}</p>
        <div className="coach-actions">
          <button onClick={() => mutate((s) => { s.flags.coach_off = true; })}>Passer le tutoriel</button>
          <button className="coach-ok" onClick={() => mutate((s) => { s.flags[`coach_${id}`] = true; })}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

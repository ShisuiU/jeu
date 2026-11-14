import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import { useGame } from '../../state/store';
import type { Unit } from '../../game/battle/types';
import { Stage25, type Pt } from '../fx/stage25';
import { regionAmbient } from '../art/BattleBackdrop';
import { CAM_AMP } from './layout';

// MISE EN SCÈNE DU COMBAT (extrait de Battle.tsx, v1.98.0) : position des cartes, couche de particules,
// caméra 2,5D (zoom vers l'action, décor en plans), lumière dynamique, assauts au corps à corps, réaction aux coups.
export function useStageFx(battleRef: RefObject<HTMLDivElement | null>, speedRef: MutableRefObject<number>, region: string) {
  const posOf = (id: string) => {
    const host = battleRef.current?.getBoundingClientRect();
    const el = battleRef.current?.querySelector(`[data-uid="${id}"] .u-art`)?.getBoundingClientRect();
    if (!host || !el) return null;
    return { x: el.left - host.left + el.width / 2, y: el.top - host.top + el.height / 2, w: el.width, top: el.top - host.top };
  };
  // ─── Mise en scène 2,5D (v1.81.0) : caméra, assauts au corps à corps, impacts, dissolution ───
  const camRef = useRef<HTMLDivElement>(null);
  const stageCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage25 | null>(null);
  const camScale = useRef(1);
  const motionOn = () => !useGame.getState().save?.settings.reducedMotion;
  useEffect(() => {
    const cv = stageCanvas.current;
    if (!cv || !motionOn()) return;
    const amb = regionAmbient(region);
    const st = new Stage25(cv, () => speedRef.current, amb.colors, amb.count, amb.cfg);
    st.start(); stage.current = st;
    return () => { st.stop(); stage.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const center = (id: string): Pt | null => { const p = posOf(id); return p ? { x: p.x, y: p.y } : null; };
  /** Caméra : zoom léger vers l'action, le décor bouge moins vite (profondeur). */
  const camTo = (p: Pt | null, z = 1, ms = 420) => {
    const el = camRef.current, host = battleRef.current;
    if (!el || !host || !motionOn()) return;
    const spd = speedRef.current;
    const bgs = host.querySelectorAll<HTMLElement>('.painted-bg img, .battle-bg, [data-depth]');
    // En accéléré, la caméra garde des mouvements doux : durée réduite moins vite que le reste,
    // et amplitude réduite (×2 : 55 %, ×3 : 30 %) pour éviter les allers-retours brusques.
    const amp = CAM_AMP[spd] ?? 1;
    z = 1 + (z - 1) * amp;
    const tr = `transform ${Math.round(Math.max(ms / Math.sqrt(spd), 260))}ms cubic-bezier(.25,.6,.3,1)`;
    el.style.transition = tr;
    if (!p) { el.style.transform = ''; camScale.current = 1; bgs.forEach((b) => { b.style.transition = tr; b.style.transform = ''; }); return; }
    const c = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
    const k = 0.6; // la cible fait un peu plus de la moitié du chemin vers le centre
    // Presque aucun panoramique gauche-droite (15 %) : la caméra avance surtout en profondeur.
    const tx = amp * (k - z) * (p.x - c.x) * 0.15, ty = amp * (k - z) * (p.y - c.y) * 0.6;
    el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${z})`;
    camScale.current = z;
    // Profondeur : chaque plan suit la caméra selon sa distance (décor 0,22 ; rais 0,2 ; brume 0,3).
    bgs.forEach((b) => { const d = Number(b.dataset.depth ?? 0.22); b.style.transition = tr; b.style.transform = `translate(${(tx * d).toFixed(1)}px, ${(ty * d).toFixed(1)}px) scale(${1 + (z - 1) * d * 1.6})`; });
  };
  /** Lumière dynamique : un halo de la couleur du sort éclaire le décor à cet endroit, puis s'éteint. */
  const flashLight = (p: Pt | null, color: string, power = 0.5, ms = 520) => {
    const el = battleRef.current?.querySelector<HTMLElement>('.bs-light');
    if (!el || !p || !motionOn()) return;
    const sz = el.offsetWidth;
    el.style.setProperty('--lc', color);
    el.style.transform = `translate(${(p.x - sz / 2).toFixed(0)}px, ${(p.y - sz / 2).toFixed(0)}px)`;
    el.animate([{ opacity: 0 }, { opacity: power * 0.55, offset: 0.25 }, { opacity: 0 }], { duration: ms / Math.sqrt(speedRef.current), easing: 'ease-out' });
  };
  /** Assaut : la carte s'élance vers sa cible (petit recul, ruée), puis revient à sa place. */
  const lungeTo = async (actor: Unit, from: { x: number; y: number; w: number }, to: { x: number; y: number; w: number }) => {
    const el = battleRef.current?.querySelector<HTMLElement>(`[data-uid="${actor.id}"]`);
    if (!el) return null;
    const sc = camScale.current || 1;
    const dir = actor.side === 'ally' ? 1 : -1; // l'allié monte vers l'ennemi et s'arrête juste devant lui
    const dx = (to.x - from.x) / sc, dy = (to.y - from.y + dir * to.w * 0.62) / sc;
    const depth = actor.side === 'ally' ? 0.9 : 1.1; // plus loin = plus petit
    const field = el.closest<HTMLElement>('.field');
    if (field) { field.style.position = 'relative'; field.style.zIndex = '6'; }
    el.style.zIndex = '6';
    const cur = getComputedStyle(el).transform;
    const b = cur && cur !== 'none' ? ` ${cur}` : '';
    const spd = speedRef.current;
    const away = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)${b} scale(${depth})`;
    const go = el.animate([
      { transform: `translate(0px, 0px)${b}` },
      { transform: `translate(${(-dx * 0.04).toFixed(1)}px, ${dir * 12}px)${b}`, offset: 0.3 },
      { transform: away },
    ], { duration: 330 / spd, easing: 'cubic-bezier(.45,0,.85,.45)', fill: 'forwards' });
    await go.finished.catch(() => undefined);
    return async () => {
      const back = el.animate([{ transform: away }, { transform: `translate(0px, 0px)${b}` }], { duration: 300 / speedRef.current, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
      go.cancel();
      await back.finished.catch(() => undefined);
      back.cancel();
      el.style.zIndex = '';
      if (field) { field.style.zIndex = ''; field.style.position = ''; }
    };
  };
  /** Réaction au coup : éclair blanc et recul dans le sens du coup. */
  const knock = (targetId: string, sourceId: string, color: string, heavy: boolean) => {
    if (!motionOn()) return;
    const tp = center(targetId); if (!tp) return;
    const sp = center(sourceId);
    let kx = 0, ky = 0;
    if (sp && (sp.x !== tp.x || sp.y !== tp.y)) { const l = Math.hypot(tp.x - sp.x, tp.y - sp.y); kx = (tp.x - sp.x) / l; ky = (tp.y - sp.y) / l; }
    const st = stage.current;
    if (st) {
      st.burst(tp, color, heavy ? 30 : 18, heavy ? 0.44 : 0.32); st.burst(tp, '#ffffff', 7, 0.24);
      st.slash(tp, color, Math.atan2(ky, kx) + Math.PI / 2 + (Math.random() - 0.5) * 0.6, 40);
    }
    const art = battleRef.current?.querySelector<HTMLElement>(`[data-uid="${targetId}"] .u-art`);
    const m = heavy ? 13 : 8;
    art?.animate([
      { transform: 'translate(0px, 0px)', filter: 'brightness(1)' },
      { transform: `translate(${(kx * m).toFixed(1)}px, ${(ky * m).toFixed(1)}px) rotate(${(kx * 4).toFixed(1)}deg)`, filter: 'brightness(2.3) saturate(0.3)', offset: 0.18 },
      { transform: 'translate(0px, 0px)', filter: 'brightness(1)' },
    ], { duration: 360 / speedRef.current, easing: 'ease-out' });
  };
  return { camRef, stageCanvas, stage, posOf, center, camTo, flashLight, lungeTo, knock, motionOn };
}

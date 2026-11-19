import { RESOURCES, normalizeReward, type Reward } from '../../data/resources';
import { RES_ART } from '../art/Icons';
import { useGame } from '../../state/store';

// RÉCOMPENSE QUI S'ENVOLE (v1.115.0) — au moment de réclamer, quelques icônes de la récompense partent du bouton touché
// vers le haut de l'écran (là où sont les ressources), et le message dit exactement ce qui a été reçu.
// Rien ne bouge avec « Animations réduites » ou si le système le demande ; seul le message reste.

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

/** « +3 000 Or · +3 Élixirs d'expérience » (au plus 3 lignes, puis « … »). */
export function rewardSummary(raw: Reward): string {
  const r = normalizeReward(raw);
  const parts = Object.entries(r).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `+${fmt(v ?? 0)} ${RESOURCES[k as keyof typeof RESOURCES]?.name ?? k}`);
  return parts.length > 3 ? `${parts.slice(0, 3).join(' · ')} …` : parts.join(' · ');
}

export function flyReward(raw: Reward, from?: Element | null): void {
  if (typeof document === 'undefined' || !from) return;
  const reduced = useGame.getState().save?.settings.reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const r = normalizeReward(raw);
  const kinds = Object.entries(r).filter(([k, v]) => (v ?? 0) > 0 && RES_ART[k]).slice(0, 3);
  if (!kinds.length) return;
  const a = from.getBoundingClientRect();
  const target = document.querySelector('.top-bar, .wallet, .screen-header')?.getBoundingClientRect();
  const tx = target ? target.left + target.width * 0.7 : window.innerWidth * 0.75;
  const ty = target ? target.top + target.height / 2 : 30;
  let n = 0;
  for (const [k] of kinds) {
    for (let i = 0; i < 4; i++, n++) {
      const img = document.createElement('img');
      img.src = RES_ART[k]; img.alt = ''; img.className = 'reward-fly';
      const x0 = a.left + a.width / 2 + (Math.random() - 0.5) * 40, y0 = a.top + a.height / 2 + (Math.random() - 0.5) * 16;
      img.style.left = `${x0}px`; img.style.top = `${y0}px`;
      document.body.appendChild(img);
      const dx = tx - x0, dy = ty - y0, mid = { x: dx * 0.35 + (Math.random() - 0.5) * 70, y: dy * 0.2 - 50 - Math.random() * 40 };
      const anim = img.animate([
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${mid.x}px), calc(-50% + ${mid.y}px)) scale(1.1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`, opacity: 0.2 },
      ], { duration: 700 + Math.random() * 160, delay: n * 55, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' });
      anim.onfinish = () => img.remove();
      setTimeout(() => img.remove(), 2500); // filet de sécurité
    }
  }
}

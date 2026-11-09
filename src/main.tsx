import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles/global.css';
import './styles/home.css';
import './styles/battle.css';
import './styles/phase3.css';
import './styles/craft.css';
import './styles/fx.css';
import './styles/summon.css';
import './styles/theme-v2.css';
import './styles/desktop.css';
import App from './App';
import { setupPWA } from './pwa';
import { fixViewport } from './viewport';

fixViewport();


createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
setupPWA();

// Onde dorée sous le doigt sur les boutons et tuiles (rien avec « Animations réduites »).
document.addEventListener('pointerdown', (e) => {
  const el = (e.target as HTMLElement | null)?.closest?.('.btn, .menu-tile, .combat-card, .hp-tile') as HTMLElement | null;
  if (!el || (el as HTMLButtonElement).disabled || document.querySelector('.reduced-motion')) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.6;
  const dot = document.createElement('span');
  dot.className = 'tap-ripple';
  dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  el.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
}, { passive: true });

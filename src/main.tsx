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
import App from './App';
import { setupPWA } from './pwa';
import { fixViewport } from './viewport';

fixViewport();


createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
setupPWA();

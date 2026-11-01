import { useEffect, useRef, useState } from 'react';
import { useGame } from './state/store';
import { useUI, type Route } from './state/ui';
import { initSaveSystem } from './save/saveManager';
import { configureAudio, play, unlockAudio } from './audio/sfx';
import { canClaimDaily } from './game/daily';
import { BottomNav } from './ui/components/BottomNav';
import { Toasts } from './ui/components/Toasts';
import { Title } from './ui/screens/Title';
import { Home } from './ui/screens/Home';
import { Collection } from './ui/screens/Collection';
import { HeroDetail } from './ui/screens/HeroDetail';
import { Team } from './ui/screens/Team';
import { Inventory } from './ui/screens/Inventory';
import { Menu } from './ui/screens/Menu';
import { Daily } from './ui/screens/Daily';
import { Settings } from './ui/screens/Settings';
import { Saves } from './ui/screens/Saves';
import { Codex } from './ui/screens/Codex';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'home': return <Home />;
    case 'collection': return <Collection />;
    case 'hero': return <HeroDetail key={r.uid ?? r.heroId} uid={r.uid} heroId={r.heroId} />;
    case 'team': return <Team />;
    case 'inventory': return <Inventory />;
    case 'menu': return <Menu />;
    case 'daily': return <Daily />;
    case 'settings': return <Settings />;
    case 'saves': return <Saves />;
    case 'codex': return <Codex />;
  }
}

export default function App() {
  const save = useGame((s) => s.save);
  const route = useUI((s) => s.stack[s.stack.length - 1]);
  const depth = useUI((s) => s.stack.length);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    initSaveSystem()
      .then(() => setReady(true))
      .catch((e) => setError(`Impossible d’accéder au stockage : ${e instanceof Error ? e.message : e}. Désactivez la navigation privée.`));
  }, []);

  // Horloge du jeu : énergie, renouvellements quotidiens.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => useGame.getState().tick(), 1000);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => { if (save) configureAudio({ enabled: save.settings.sound, volume: save.settings.volume }); }, [save?.settings.sound, save?.settings.volume]);

  const start = () => {
    unlockAudio();
    setStarted(true);
    setTimeout(() => play('claim'), 50);
    const s = useGame.getState();
    if (s.save && canClaimDaily(s.save, s.now)) useUI.getState().push({ name: 'daily' });
  };

  return (
    <div className={`app ${save?.settings.reducedMotion ? 'reduced-motion' : ''}`} onPointerDown={unlockAudio}>
      {!started || !save ? (
        <Title ready={ready && !!save} onStart={start} error={error} />
      ) : (
        <>
          <div key={`${depth}-${route.name}`} style={{ position: 'absolute', inset: 0 }}>{renderRoute(route)}</div>
          <BottomNav />
        </>
      )}
      <Toasts />
    </div>
  );
}

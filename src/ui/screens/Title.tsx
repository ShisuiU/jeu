import { GAME_SUBTITLE, GAME_TITLE } from '../../data/lore';
import { WorldScene, Particles } from '../art/Scene';

export function Title({ ready, onStart, error }: { ready: boolean; onStart: () => void; error?: string | null }) {
  return (
    <button className="title-screen" onClick={() => ready && onStart()} aria-label="Commencer">
      <div className="home-scene"><WorldScene /><Particles count={24} /></div>
      <div className="logo">
        <div className="name">{GAME_TITLE.toUpperCase()}</div>
        <div className="sub">{GAME_SUBTITLE}</div>
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        {error ? <div className="hint warn" style={{ margin: '0 24px' }}>{error}</div>
          : <div className="tap-start">{ready ? 'TOUCHER POUR COMMENCER' : 'CHARGEMENT…'}</div>}
        <div className="faint" style={{ marginTop: 14 }}>v{__APP_VERSION__}</div>
      </div>
    </button>
  );
}

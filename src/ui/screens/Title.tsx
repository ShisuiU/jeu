import { GAME_SUBTITLE, GAME_TITLE } from '../../data/lore';
import { WorldScene, Particles } from '../art/Scene';
import { heroArtUrl } from '../art/HeroArt';
import { PaintedBackdrop } from '../art/BattleBackdrop';

const KEY_ART = ['aldric', 'vaelshira', 'azhar', 'solenne', 'idris'];

export function Title({ ready, onStart, error }: { ready: boolean; onStart: () => void; error?: string | null }) {
  const art = heroArtUrl(KEY_ART[new Date().getDate() % KEY_ART.length], 'full');
  return (
    <button className="title-screen" onClick={() => ready && onStart()} aria-label="Commencer">
      <div className="home-scene">
        {art ? <PaintedBackdrop src={art} blur={0} dim={0.55} position="center top" /> : <WorldScene />}
        <Particles count={18} />
        <div className="title-shade" />
      </div>
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

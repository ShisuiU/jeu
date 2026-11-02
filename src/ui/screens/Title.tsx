import { GAME_SUBTITLE, GAME_TITLE } from '../../data/lore';
import { Particles } from '../art/Scene';
import worldArt from '../../assets/title/world.webp';

// ÉCRAN D'OUVERTURE — le Monde Cousu : forteresse de Valcrest, cité de bronze d'Akkar,
// flèches de verre du Prisme, forêts de Sylvaran et failles de cendre, sous le Cœur d'Aeon brisé.
// Animations : lent travelling de caméra, pulsation du Cœur, braises, apparition du logo.
export function Title({ ready, onStart, error }: { ready: boolean; onStart: () => void; error?: string | null }) {
  return (
    <button className="title-screen" onClick={() => ready && onStart()} aria-label="Commencer">
      <div className="title-art" aria-hidden>
        <img src={worldArt} alt="" draggable={false} />
        <div className="title-heart" />
        <Particles count={22} />
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

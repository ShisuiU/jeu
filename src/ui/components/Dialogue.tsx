import { useEffect, useState } from 'react';
import type { DialogueLine } from '../../data/campaign';
import { HERO_BY_ID } from '../../data/heroes';
import { ENEMIES } from '../../data/enemies';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { play } from '../../audio/sfx';

// Scène de dialogue : portrait de l'orateur, texte qui s'écrit, toucher pour continuer.
export function Dialogue({ lines, onDone }: { lines: DialogueLine[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[i];
  const full = line?.text ?? '';
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => setShown((n) => { if (n >= full.length) { clearInterval(id); return n; } return n + 2; }), 22);
    return () => clearInterval(id);
  }, [i, full]);
  if (!line) return null;
  const hero = HERO_BY_ID[line.speaker];
  const enemy = ENEMIES[line.speaker];
  const narrator = !hero && !enemy;
  const name = hero?.name ?? enemy?.name ?? '';
  const next = () => {
    if (shown < full.length) { setShown(full.length); return; }
    play('tap');
    if (i + 1 >= lines.length) onDone(); else setI(i + 1);
  };
  return (
    <div className="dialogue" onClick={next}>
      {!narrator && (
        <div className={`dlg-portrait ${enemy ? 'enemy' : ''}`} key={line.speaker}>
          {hero ? <HeroArt heroId={hero.id} kind="full" /> : <EnemyArt enemyId={enemy!.id} />}
        </div>
      )}
      <div className={`dlg-box ${narrator ? 'narrator' : ''}`}>
        {!narrator && <div className="dlg-name">{name}{hero && <span> · {hero.title}</span>}</div>}
        <div className="dlg-text">{full.slice(0, shown)}<span style={{ opacity: 0 }}>{full.slice(shown)}</span></div>
        <div className="dlg-foot"><span>{i + 1}/{lines.length}</span><span className="tap-start" style={{ fontSize: 11 }}>TOUCHER ▸</span></div>
      </div>
      <button className="dlg-skip" onClick={(e) => { e.stopPropagation(); onDone(); }}>Passer »</button>
    </div>
  );
}

import { useState } from 'react';
import { useGame } from '../../state/store';
import { isStandalone } from '../../pwa';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';

// GUIDE DE DÉMARRAGE — quelques écrans au premier lancement (relançable depuis les paramètres).
const STEPS: { icon: keyof typeof Icon; title: string; text: string }[] = [
  { icon: 'portal', title: 'Bienvenue, Lien', text: 'Le Cœur d’Aeon s’est brisé et le Néant efface le monde. Vous seul pouvez appeler les Héritiers à travers les failles. Suivez le guide : on vous montre tout en jouant.' },
];

export function Guide() {
  const mutate = useGame((s) => s.mutate);
  const [i, setI] = useState(0);
  const done = () => { play('claim'); mutate((s) => { s.flags.guide_done = true; }); };
  const st = STEPS[i];
  const I = Icon[st.icon] as (p: { size?: number }) => JSX.Element;
  const last = i === STEPS.length - 1;
  return (
    <div className="modal-backdrop" style={{ zIndex: 55 }}>
      <div className="modal guide" key={i}>
        <div className="guide-ic"><I size={40} /></div>
        <h2>{st.title}</h2>
        <p className="lore" style={{ textAlign: 'center' }}>{st.text}</p>
        {last && !isStandalone() && <div className="hint">Astuce : dans Safari, Partager → « Sur l’écran d’accueil » pour jouer en plein écran et hors ligne.</div>}
        <div className="guide-dots">{STEPS.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="row" style={{ gap: 8 }}>
          {!last && <button className="btn secondary grow" onClick={done}>Passer</button>}
          <button className="btn grow" onClick={() => { play('tap'); if (last) done(); else setI(i + 1); }}>{last ? 'C’est parti !' : 'Suivant'}</button>
        </div>
      </div>
    </div>
  );
}

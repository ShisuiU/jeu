import { useState } from 'react';
import { useGame } from '../../state/store';
import { isStandalone } from '../../pwa';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';

// GUIDE DE DÉMARRAGE — quelques écrans au premier lancement (relançable depuis les paramètres).
const STEPS: { icon: keyof typeof Icon; title: string; text: string }[] = [
  { icon: 'portal', title: 'Bienvenue dans le Monde Cousu', text: 'Le Cœur d’Aeon s’est brisé et le Néant efface le monde. Toi, tu es le Lien : la seule personne capable d’appeler les Héritiers, des héros venus de toutes les époques, à travers les failles. On te montre tout en jouant.' },
];

export function Guide() {
  const mutate = useGame((s) => s.mutate);
  const current = useGame((s) => s.save?.profile.name ?? '');
  const [i, setI] = useState(0);
  // Nom du joueur : le jeu l'appelle par son nom (ou « Lien » s'il ne choisit rien).
  const [name, setName] = useState(current === 'Héritier' ? '' : current);
  const done = () => { play('claim'); mutate((s) => { s.flags.guide_done = true; s.profile.name = name.trim().slice(0, 18) || 'Lien'; }); };
  const st = STEPS[i];
  const I = Icon[st.icon] as (p: { size?: number }) => JSX.Element;
  const last = i === STEPS.length - 1;
  return (
    <div className="modal-backdrop" style={{ zIndex: 55 }}>
      <div className="modal guide" key={i}>
        <div className="guide-ic"><I size={40} /></div>
        <h2>{st.title}</h2>
        <p className="lore" style={{ textAlign: 'center' }}>{st.text}</p>
        {last && (
          <label className="guide-name">
            <span>Ton nom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lien" maxLength={18} autoComplete="nickname" />
          </label>
        )}
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

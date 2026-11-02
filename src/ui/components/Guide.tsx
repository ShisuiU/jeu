import { useState } from 'react';
import { useGame } from '../../state/store';
import { isStandalone } from '../../pwa';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';

// GUIDE DE DÉMARRAGE — quelques écrans au premier lancement (relançable depuis les paramètres).
const STEPS: { icon: keyof typeof Icon; title: string; text: string }[] = [
  { icon: 'portal', title: 'Bienvenue, Lien', text: 'Le Cœur d’Aeon s’est brisé et les époques se sont mélangées. Le Néant efface le Monde Cousu. Vous seul pouvez appeler les Héritiers à travers les failles.' },
  { icon: 'sword', title: 'Combattre', text: 'Touchez CAMPAGNE sur l’accueil. En combat, choisissez une compétence puis touchez un ennemi. Vous pouvez aussi activer AUTO et accélérer avec ×2 / ×3. Chaque combat coûte de l’énergie, qui se recharge même jeu fermé.' },
  { icon: 'team', title: 'Votre équipe', text: '5 héros : 3 en première ligne (exposés), 2 en seconde ligne (protégés). Un défenseur devant, un soigneur derrière. Le chef donne un bonus à toute l’équipe.' },
  { icon: 'heroes', title: 'Progresser', text: 'Invoquez de nouveaux héros, puis améliorez-les depuis leur fiche : élixirs, rang, ascension, compétences et équipement. Les doublons deviennent des fragments.' },
  { icon: 'scroll', title: 'Chaque jour', text: 'Récompense de connexion, missions, donjons pour les ressources, Tour des Âges, boss mondial (3 clés) et arène (5 tickets). Quinze minutes suffisent ; une heure, c’est encore mieux.' },
  { icon: 'save', title: 'Votre progression', text: 'Tout est sauvegardé automatiquement sur l’iPhone. Exportez de temps en temps une copie (Menu → Sauvegarde) pour ne jamais rien perdre.' },
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

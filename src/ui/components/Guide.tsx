import { useState } from 'react';
import { useUI } from '../../state/ui';
import { useGame } from '../../state/store';
import { isStandalone } from '../../pwa';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';
import { NAME_MAX, cleanName, nameError } from '../../game/profile';

// GUIDE DE DÉMARRAGE — quelques écrans au premier lancement (relançable depuis les paramètres).
const STEPS: { icon: keyof typeof Icon; title: string; text: string }[] = [
  { icon: 'portal', title: 'Bienvenue dans le Monde Cousu', text: 'Le Cœur d’Aeon s’est brisé et le Néant efface le monde. Toi, tu es le Lien : la seule personne capable d’appeler les Héritiers, des héros venus de toutes les époques, à travers les failles. On te montre tout en jouant.' },
];

export function Guide() {
  const mutate = useGame((s) => s.mutate);
  const current = useGame((s) => s.save?.profile.name ?? '');
  const [i, setI] = useState(0);
  // Premier écran : nouveau joueur (l'histoire commence) ou ancien joueur (retrouver sa partie).
  const [who, setWho] = useState<'ask' | 'new' | 'old'>('ask');
  const push = useUI((s) => s.push);
  // Nom du joueur : obligatoire (il apparaît dans l'histoire et chez les autres joueurs).
  const [name, setName] = useState(nameError(current) ? '' : current);
  const [tried, setTried] = useState(false);
  const err = nameError(name);
  const done = () => {
    setTried(true);
    if (err) { play('error'); return; }
    play('claim'); mutate((s) => { s.flags.guide_done = true; s.flags.name_chosen = true; s.profile.name = cleanName(name); });
  };
  if (who !== 'new') return (
    <div className="modal-backdrop" style={{ zIndex: 55 }}>
      <div className="modal guide first-choice">
        <div className="guide-ic"><Icon.portal size={40} /></div>
        <h2>Bienvenue dans Aeonfall</h2>
        {who === 'ask' ? (
          <>
            <p className="lore" style={{ textAlign: 'center' }}>As-tu déjà joué à Aeonfall ?</p>
            <button className="btn block" onClick={() => { play('tap'); setWho('new'); }}>Nouveau joueur<small>L’aventure commence</small></button>
            <button className="btn secondary block" style={{ marginTop: 10 }} onClick={() => { play('tap'); setWho('old'); }}>Ancien joueur<small>Retrouver ma partie</small></button>
          </>
        ) : (
          <>
            <p className="lore" style={{ textAlign: 'center' }}>Retrouve ta partie : avec ton compte (Google ou e-mail), ou avec un fichier de sauvegarde enregistré auparavant.</p>
            <button className="btn block" onClick={() => { play('tap'); push({ name: 'saves' }); }}>Me connecter à mon compte</button>
            <button className="btn secondary block" style={{ marginTop: 10 }} onClick={() => { play('tap'); push({ name: 'saves' }); }}>J’ai un fichier de sauvegarde</button>
            <button className="acc-link" style={{ display: 'block', margin: '14px auto 0' }} onClick={() => setWho('ask')}>Retour</button>
            <p className="faint" style={{ textAlign: 'center', marginBottom: 0 }}>Pas de compte ni de fichier ? Ta partie était seulement sur l’ancien appareil : commence en « Nouveau joueur ».</p>
          </>
        )}
      </div>
    </div>
  );
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Choisis ton nom" maxLength={NAME_MAX} autoComplete="nickname" aria-label="Ton nom" />
          </label>
        )}
        {last && <p className={`name-err ${tried && err ? 'on' : ''}`}>{tried && err ? err : '3 à 18 caractères.'}</p>}
        {last && !isStandalone() && <div className="hint">Astuce : dans Safari, Partager → « Sur l’écran d’accueil » pour jouer en plein écran et hors ligne.</div>}
        <div className="guide-dots">{STEPS.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="row" style={{ gap: 8 }}>
          {!last && <button className="btn secondary grow" onClick={() => setI(STEPS.length - 1)}>Passer</button>}
          <button className="btn grow" onClick={() => { play('tap'); if (last) done(); else setI(i + 1); }}>{last ? 'C’est parti !' : 'Suivant'}</button>
        </div>
      </div>
    </div>
  );
}

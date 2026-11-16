import { useEffect, useRef, useState } from 'react';
import worldArt from '../../assets/title/world.webp';
import { useUI } from '../../state/ui';
import { useGame } from '../../state/store';
import { isStandalone } from '../../pwa';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';
import { NAME_MAX, cleanName, nameError } from '../../game/profile';

// GUIDE DE DÉMARRAGE — au premier lancement : un prologue cinématique (v1.102.2), puis le choix du nom.
// Le prologue remplace l'ancien paragraphe : trois phrases courtes qui apparaissent sur le Monde Cousu ;
// toucher l'écran passe à la phrase suivante, « Passer » va directement au nom.
const PROLOGUE = [
  'Le Cœur d’Aeon s’est brisé.',
  'Toutes les époques ont été recousues en un seul monde.',
  'Le Néant l’efface. Toi seul peux appeler ses Héritiers.',
];
const LINE_MS = 3600; // le temps de lire (test « nouveau joueur » : 2,6 s faisait défiler les phrases avant qu'on les lise)

function Prologue({ onDone }: { onDone: () => void }) {
  const [k, setK] = useState(0);
  const shownAt = useRef(Date.now());
  useEffect(() => { shownAt.current = Date.now(); }, [k]);
  // Un toucher = une phrase ; un double toucher rapide ne saute pas la suivante.
  const nextLine = () => { if (Date.now() - shownAt.current > 450) setK((x) => x + 1); };
  useEffect(() => {
    if (k >= PROLOGUE.length) { onDone(); return; }
    const t = setTimeout(() => setK((x) => x + 1), LINE_MS);
    return () => clearTimeout(t);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="prologue" role="dialog" aria-label="Prologue" onClick={nextLine}>
      <img className="pro-art" src={worldArt} alt="" draggable={false} />
      <div className="pro-shade" />
      {k < PROLOGUE.length && <p className="pro-line" key={k}>{PROLOGUE[k]}</p>}
      <div className="pro-dots" aria-hidden>{PROLOGUE.map((_, j) => <span key={j} className={j <= k ? 'on' : ''} />)}</div>
      <button className="pro-skip" onClick={(e) => { e.stopPropagation(); onDone(); }}>Passer</button>
    </div>
  );
}

export function Guide() {
  const mutate = useGame((s) => s.mutate);
  const current = useGame((s) => s.save?.profile.name ?? '');
  const [named, setNamed] = useState(false); // prologue vu
  // Premier écran : nouveau joueur (l'histoire commence) ou ancien joueur (retrouver sa partie).
  // Joueur déjà nommé qui demande « Revoir le guide » (Réglages) : directement le guide, sans la question d'accueil.
  const [who, setWho] = useState<'ask' | 'new' | 'old'>(() => (useGame.getState().save?.flags.name_chosen ? 'new' : 'ask'));
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
  if (!named) return <Prologue onDone={() => setNamed(true)} />;
  return (
    <div className="modal-backdrop" style={{ zIndex: 55 }}>
      <div className="modal guide name-card">
        <div className="guide-ic"><Icon.portal size={40} /></div>
        <h2>Tu es le Lien</h2>
        <p className="lore" style={{ textAlign: 'center', margin: '0 0 10px' }}>Les Héritiers t’appelleront par ton nom.</p>
        <label className="guide-name">
          <span>Ton nom</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Choisis ton nom" maxLength={NAME_MAX} autoComplete="nickname" aria-label="Ton nom" />
        </label>
        <p className={`name-err ${tried && err ? 'on' : ''}`}>{tried && err ? err : '3 à 18 caractères.'}</p>
        {!isStandalone() && /iPad|iPhone|iPod/.test(navigator.userAgent) && <div className="hint">Astuce : dans Safari, Partager → « Sur l’écran d’accueil » pour jouer en plein écran et hors ligne.</div>}
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => { play('tap'); done(); }}>C’est parti !</button>
      </div>
    </div>
  );
}

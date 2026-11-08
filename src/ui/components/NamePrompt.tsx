import { useState } from 'react';
import { useGame } from '../../state/store';
import { play } from '../../audio/sfx';
import { NAME_MAX, cleanName, nameError } from '../../game/profile';

// CHOIX DU NOM OBLIGATOIRE — pour les joueurs qui ont encore un nom par défaut. Impossible de fermer
// cette fenêtre sans choisir : le nom sert dans l'histoire, les classements, l'Arène, les clans et les amis.
export function NamePrompt() {
  const mutate = useGame((s) => s.mutate);
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  const err = nameError(name);
  const ok = () => {
    setTried(true);
    if (err) { play('error'); return; }
    play('claim');
    mutate((s) => { s.profile.name = cleanName(name); s.flags.name_chosen = true; });
  };
  return (
    <div className="modal-backdrop name-prompt" style={{ zIndex: 70 }}>
      <form className="modal guide" onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <h2>Choisis ton nom</h2>
        <p className="lore" style={{ textAlign: 'center' }}>Les héros t’appelleront ainsi, et les autres joueurs le verront dans les classements, l’Arène, les clans et la liste d’amis.</p>
        <label className="guide-name">
          <span>Ton nom</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} autoComplete="nickname" autoFocus aria-label="Ton nom" />
        </label>
        <p className={`name-err ${tried && err ? 'on' : ''}`}>{tried && err ? err : '3 à 18 caractères.'}</p>
        <button className="btn block" type="submit">Valider</button>
      </form>
    </div>
  );
}

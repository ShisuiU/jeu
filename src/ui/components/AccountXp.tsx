import { accountXpToNext } from '../../game/progression';

// NIVEAU DE COMPTE — badge doré et jauge d'expérience, en haut de l'écran et en fin de combat.

/** Jauge du niveau de compte. `gain` : expérience que vient de rapporter le combat (affichée « +N XP »). */
export function AccountXp({ level, xp, gain, big, compact }: { level: number; xp: number; gain?: number; big?: boolean; compact?: boolean }) {
  const need = accountXpToNext(level);
  const pct = Math.min(100, (xp / need) * 100);
  return (
    <div className={`acct-xp ${big ? 'big' : ''} ${compact ? 'compact' : ''}`} aria-label={`Niveau de compte ${level}, ${xp} sur ${need} XP`}>
      {!compact && <span className="ax-lvl"><small>Niv.</small>{level}</span>}
      <span className="ax-body">
        {big && <span className="ax-top"><b>Niveau de compte</b>{gain ? <em>+{gain} XP</em> : null}</span>}
        <span className="ax-bar"><i style={{ width: `${pct}%` }} /></span>
        <span className="ax-num">{xp.toLocaleString('fr-FR')} / {need.toLocaleString('fr-FR')} XP</span>
      </span>
    </div>
  );
}

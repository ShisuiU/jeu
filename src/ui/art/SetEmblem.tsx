import type { SetId } from '../../data/equipment';
import { SETS } from '../../data/equipment';

// EMBLÈMES D'ENSEMBLE — un pictogramme par ensemble, dans sa couleur (cartes d'équipement, fiche, filtres).
const PATHS: Record<SetId, string> = {
  vigor: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', // cœur
  fury: 'M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z', // flamme
  bulwark: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z', // bouclier
  swift: 'M3 13c5 0 9-3 12-9 1 4 0 7-2 9h8c-3 4-8 7-18 7l3-3-3-4z', // aile
  focus: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', // œil
  keen: 'M12 2v5M12 17v5M2 12h5M17 12h5M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', // viseur
  leech: 'M12 2c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z', // goutte
  savage: 'M5 3l3 8-3 10 5-7 2 7 2-7 5 7-3-10 3-8-5 6-2-6-2 6z', // griffes
  resolve: 'M12 2v14M7 7h10M5 14a7 7 0 0 0 14 0M5 14l-2-1M19 14l2-1', // ancre
  perennial: 'M20 4C10 4 4 9 4 16c0 2 1 4 1 4s1-6 7-9c-4 4-5 7-5 9 8 0 13-6 13-16z', // feuille
  momentum: 'M3 12h12M11 6l6 6-6 6M17 6l4 6-4 6', // flèches
};
const STROKE: SetId[] = ['keen', 'resolve', 'momentum'];

export function SetEmblem({ id, size = 14 }: { id: SetId; size?: number }) {
  const c = SETS[id].color;
  const stroke = STROKE.includes(id);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={SETS[id].name} role="img" style={{ flexShrink: 0 }}>
      <path d={PATHS[id]} fill={stroke ? 'none' : c} stroke={c} strokeWidth={stroke ? 2.4 : 0.8} strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd" />
    </svg>
  );
}

/** Étoiles d'un équipement (pleines jusqu'au nombre d'étoiles). */
export function GearStars({ n, size = 9 }: { n: number; size?: number }) {
  return (
    <span className="gstars" aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor" /></svg>
      ))}
    </span>
  );
}

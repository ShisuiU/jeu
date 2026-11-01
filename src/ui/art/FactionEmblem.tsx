import type { FactionId } from '../../data/types';
import { FACTIONS } from '../../data/factions';

// Emblèmes vectoriels originaux de chaque faction (viewBox 0 0 64 64).
const PATHS: Record<FactionId, JSX.Element> = {
  // Valcrest : écu et couronne
  valcrest: (<g><path d="M32 6 L54 14 V32 C54 46 44 54 32 59 C20 54 10 46 10 32 V14 Z" /><path d="M22 26 L26 20 L32 25 L38 20 L42 26 L40 34 H24 Z" fill="var(--e2)" /><path d="M24 38 H40 V41 H24 Z" fill="var(--e2)" /></g>),
  // Prisme : triangle réfracté
  prism: (<g><path d="M32 6 L58 52 H6 Z" /><path d="M32 18 L46 44 H18 Z" fill="var(--e2)" opacity="0.9" /><path d="M32 18 V44 M18 44 L40 31" stroke="var(--e1)" strokeWidth="2.5" fill="none" /></g>),
  // Cendre : corne et flamme
  ash: (<g><path d="M32 4 C38 16 50 20 48 36 C47 50 38 58 32 60 C26 58 17 50 16 36 C14 20 26 16 32 4 Z" /><path d="M32 22 C35 30 42 33 40 42 C39 49 35 52 32 53 C29 52 25 49 24 42 C22 33 29 30 32 22 Z" fill="var(--e2)" /><path d="M14 10 C18 18 22 20 26 22 M50 10 C46 18 42 20 38 22" stroke="var(--e1)" strokeWidth="3" fill="none" strokeLinecap="round" /></g>),
  // Sylvaran : arbre-rune dans un cercle
  sylvaran: (<g><circle cx="32" cy="32" r="27" /><path d="M32 54 V22 M32 32 L22 22 M32 32 L42 22 M32 42 L20 34 M32 42 L44 34 M32 22 L26 12 M32 22 L38 12" stroke="var(--e2)" strokeWidth="3.5" fill="none" strokeLinecap="round" /></g>),
  // Astral : étoile à huit branches et orbite
  astral: (<g><path d="M32 2 L37 27 L62 32 L37 37 L32 62 L27 37 L2 32 L27 27 Z" /><path d="M32 12 L35 29 L52 32 L35 35 L32 52 L29 35 L12 32 L29 29 Z" fill="var(--e2)" transform="rotate(45 32 32)" /><circle cx="32" cy="32" r="5" fill="var(--e1)" /></g>),
  // Akkar : disque solaire et lances
  akkar: (<g><circle cx="32" cy="30" r="15" /><circle cx="32" cy="30" r="8" fill="var(--e2)" /><path d="M8 58 L28 34 M56 58 L36 34 M32 6 V14 M14 14 L19 19 M50 14 L45 19" stroke="var(--e1)" strokeWidth="4" strokeLinecap="round" /></g>),
};

export function FactionEmblem({ id, size = 24, mono }: { id: FactionId; size?: number; mono?: string }) {
  const f = FACTIONS[id];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-label={f.name}
      style={{ ['--e1' as string]: mono ?? f.colors.secondary, ['--e2' as string]: mono ? 'rgba(0,0,0,0.35)' : f.colors.primary }}
      fill={mono ?? f.colors.secondary}>
      {PATHS[id]}
    </svg>
  );
}

import { useId } from 'react';

// Éclat du Cœur d'Aeon (dessin vectoriel) : cristal à facettes, lumineux, qui peut se fissurer.
export function Crystal({ color, glow, size = 120, cracks = 0, className = '' }: { color: string; glow: string; size?: number; cracks?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const crackPaths = ['M50 22 L46 48 L54 62 L49 88', 'M50 48 L36 56 L30 70', 'M54 62 L66 70 L70 84', 'M46 30 L58 40 L62 54', 'M38 60 L44 74 L40 96'];
  return (
    <svg className={`crystal ${className}`} viewBox="0 0 100 130" width={size} height={size * 1.3} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor={glow} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${id}d`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#0a0612" />
        </linearGradient>
        <filter id={`${id}g`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="34" ry="52" fill={color} opacity="0.45" filter={`url(#${id}g)`} />
      {/* facettes */}
      <polygon points="50,4 72,40 62,112 50,126 38,112 28,40" fill={`url(#${id}d)`} />
      <polygon points="50,4 72,40 50,58" fill={`url(#${id}f)`} opacity="0.95" />
      <polygon points="50,4 28,40 50,58" fill={glow} opacity="0.55" />
      <polygon points="28,40 50,58 38,112" fill={color} opacity="0.75" />
      <polygon points="72,40 50,58 62,112" fill={glow} opacity="0.35" />
      <polygon points="50,58 62,112 50,126 38,112" fill={color} opacity="0.9" />
      <polyline points="50,4 50,58 50,126" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
      {/* fissures (dessinées progressivement) */}
      {crackPaths.map((d, i) => (
        <path key={i} d={d} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"
          pathLength={1} strokeDasharray="1" strokeDashoffset={Math.max(0, 1 - Math.max(0, cracks * crackPaths.length - i))}
          style={{ filter: `drop-shadow(0 0 3px ${glow})` }} />
      ))}
    </svg>
  );
}

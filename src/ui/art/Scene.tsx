import { memo } from 'react';

// Décor de l'écran d'accueil : le Monde Cousu sous le ciel fracturé.
// Château de Valcrest, flèche de verre du Prisme, ziggourat d'Akkar, rochers flottants astraux.
export const Particles = memo(function Particles({ count = 18 }: { count?: number }) {
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="particle" style={{
          left: `${(i * 37) % 100}%`,
          ['--d' as string]: `${10 + (i % 6) * 2}s`,
          ['--delay' as string]: `${-(i * 1.7)}s`,
          ['--dx' as string]: `${(i % 2 ? 1 : -1) * (10 + (i % 5) * 8)}px`,
          ['--c' as string]: i % 3 === 0 ? '#c7a0ff' : '#ffcf7a',
        }} />
      ))}
    </div>
  );
});

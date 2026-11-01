import { memo } from 'react';

// Décor de l'écran d'accueil : le Monde Cousu sous le ciel fracturé.
// Château de Valcrest, flèche de verre du Prisme, ziggourat d'Akkar, rochers flottants astraux.
export const WorldScene = memo(function WorldScene() {
  return (
    <svg className="backdrop" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120a24" />
          <stop offset="0.45" stopColor="#2a1240" />
          <stop offset="0.7" stopColor="#4a1d2a" />
          <stop offset="1" stopColor="#0a0710" />
        </linearGradient>
        <radialGradient id="riftCore" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#d6b8ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#7a3dff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0710" stopOpacity="0" />
          <stop offset="1" stopColor="#07060b" />
        </linearGradient>
        <filter id="blur6"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="blur2"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <rect width="390" height="844" fill="url(#sky)" />
      {/* étoiles */}
      <g fill="#fff">
        {Array.from({ length: 60 }, (_, i) => {
          const x = (i * 97.3) % 390, y = (i * 53.7) % 360, r = (i % 5 === 0 ? 1.3 : 0.7);
          return <circle key={i} cx={x} cy={y} r={r} opacity={0.3 + (i % 7) / 12} />;
        })}
      </g>
      {/* lunes */}
      <circle cx="318" cy="120" r="34" fill="#e9dcc6" opacity="0.85" />
      <circle cx="330" cy="112" r="34" fill="#2a1240" opacity="0.92" />
      <circle cx="62" cy="200" r="9" fill="#c7b6ff" opacity="0.6" />
      {/* la Fracture */}
      <g className="rift-glow">
        <ellipse cx="195" cy="210" rx="210" ry="70" fill="url(#riftCore)" opacity="0.35" filter="url(#blur6)" />
        <path d="M-10 250 L60 228 L92 236 L140 196 L170 204 L200 160 L226 182 L262 150 L300 166 L340 128 L400 140" stroke="#efe2ff" strokeWidth="3" fill="none" filter="url(#blur2)" />
        <path d="M-10 250 L60 228 L92 236 L140 196 L170 204 L200 160 L226 182 L262 150 L300 166 L340 128 L400 140" stroke="#b98cff" strokeWidth="9" fill="none" opacity="0.5" filter="url(#blur6)" />
        <path d="M140 196 L150 240 L138 262 M262 150 L270 196 M200 160 L196 120" stroke="#e3d0ff" strokeWidth="1.4" fill="none" opacity="0.8" />
      </g>
      {/* rochers flottants */}
      <g fill="#1b1028" stroke="#6b4aa8" strokeWidth="1" opacity="0.9">
        <path d="M250 300 L282 296 L292 306 L272 330 L258 322 Z" />
        <path d="M86 330 L108 326 L114 334 L100 348 Z" />
        <path d="M300 360 L314 358 L318 366 L308 374 Z" />
      </g>
      {/* plan lointain : montagnes */}
      <path d="M0 520 L50 470 L90 490 L140 440 L190 480 L240 430 L290 470 L340 446 L390 480 V844 H0 Z" fill="#1d1024" />
      {/* flèche de verre du Prisme */}
      <g>
        <path d="M300 520 L312 300 L318 290 L324 300 L336 520 Z" fill="#14202b" stroke="#7fe7ff" strokeWidth="1.2" opacity="0.95" />
        <path d="M318 296 L318 520" stroke="#b8f6ff" strokeWidth="0.8" opacity="0.7" />
        <circle cx="318" cy="292" r="4" fill="#b8f6ff" filter="url(#blur2)" />
        <path d="M286 520 L296 410 L304 520 Z M332 520 L342 430 L350 520 Z" fill="#101a24" stroke="#7fe7ff" strokeWidth="0.8" opacity="0.8" />
      </g>
      {/* ziggourat d'Akkar */}
      <path d="M150 540 L160 520 L240 520 L250 540 Z M164 520 L172 502 L228 502 L236 520 Z M176 502 L184 486 L216 486 L224 502 Z M190 486 L195 474 L205 474 L210 486 Z" fill="#2a160e" stroke="#e3a457" strokeWidth="0.8" opacity="0.9" />
      <circle cx="200" cy="466" r="5" fill="#ffd59a" opacity="0.8" filter="url(#blur2)" />
      {/* château de Valcrest */}
      <g fill="#120d16" stroke="#d4a64a" strokeWidth="0.8" strokeOpacity="0.6">
        <path d="M14 560 V470 L24 462 L34 470 V500 H52 V440 L62 420 L72 440 V500 H86 V478 L96 470 L106 478 V560 Z" />
        <path d="M60 428 L62 400 L64 428" stroke="#ff4f5a" />
      </g>
      <g fill="#ffcf7a">
        <rect x="59" y="456" width="4" height="7" opacity="0.8" />
        <rect x="22" y="486" width="3" height="5" opacity="0.7" />
        <rect x="94" y="494" width="3" height="5" opacity="0.6" />
      </g>
      {/* plan rapproché */}
      <path d="M0 610 L60 570 L120 590 L170 560 L230 596 L300 566 L390 600 V844 H0 Z" fill="#0d0912" />
      <rect y="480" width="390" height="364" fill="url(#fog)" />
    </svg>
  );
});

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

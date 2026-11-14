import type { CSSProperties } from 'react';
import type { SkillFx } from '../fx/skillFx';

// Extrait de Battle.tsx (v1.98.0).
export type FxItem = { id: number; kind: 'proj' | 'rain' | 'burst' | 'beam' | 'aura'; fx: SkillFx; x0: number; y0: number; x1: number; y1: number; w?: number; dur: number };

export function FxLayer({ items }: { items: FxItem[] }) {
  return (
    <div className="fx-layer" aria-hidden>
      {items.map((it) => {
        const dx = it.x1 - it.x0, dy = it.y1 - it.y0;
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const style = { left: it.x0, top: it.y0, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, ['--ang' as string]: `${ang}deg`,
          ['--len' as string]: `${Math.hypot(dx, dy)}px`, ['--c' as string]: it.fx.color, ['--w' as string]: `${it.w ?? 70}px`, animationDuration: `${it.dur}ms` } as CSSProperties;
        const cls = `fx-${it.kind} w-${it.fx.weapon} e-${it.fx.element}`;
        if (it.kind === 'rain') return <span key={it.id} className={cls} style={style}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDuration: `${it.dur}ms`, animationDelay: `${i * it.dur * 0.12}ms`, left: `${(i - 1.5) * 12}px` }} />)}</span>;
        return <span key={it.id} className={cls} style={style}><i /></span>;
      })}
    </div>
  );
}

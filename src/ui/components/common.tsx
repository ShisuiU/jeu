import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useUI } from '../../state/ui';
import { Icon } from '../art/Icons';
import { RARITIES } from '../../data/rarities';
import type { RarityId } from '../../data/types';

const SCROLL = new Map<string, number>();

export function Screen({ title, children, right, noBack, bg }: { title: string; children: ReactNode; right?: ReactNode; noBack?: boolean; bg?: ReactNode }) {
  const back = useUI((s) => s.back);
  const depth = useUI((s) => s.stack.length);
  // Mémorise la position de défilement de chaque écran pour la retrouver au retour.
  const routeKey = useUI((s) => JSON.stringify(s.stack[s.stack.length - 1]));
  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const y = SCROLL.get(routeKey);
    if (y && scroller.current) scroller.current.scrollTop = y;
  }, [routeKey]);
  return (
    <div className="screen">
      {bg ?? <div className="bg-ambient" />}
      <header className="screen-header">
        {!noBack && depth > 1 && <button className="back-btn" onClick={back} aria-label="Retour"><Icon.back /></button>}
        <h1>{title}</h1>
        {right}
      </header>
      <div className="screen-scroll" ref={scroller} onScroll={(e) => SCROLL.set(routeKey, e.currentTarget.scrollTop)}>{children}</div>
    </div>
  );
}

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {title && <div className="panel-title">{title}</div>}
      {children}
    </section>
  );
}

/** Section repliable : seul le titre (et un résumé) est visible tant qu'on ne la demande pas. */
export function Disclosure({ title, summary, children, defaultOpen = false }: { title: string; summary?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel disclosure ${open ? 'open' : ''}`}>
      <button className="dc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="dc-title">{title}</span>
        {!open && summary && <span className="dc-sum">{summary}</span>}
        <span className="dc-chev" aria-hidden>▾</span>
      </button>
      {open && <div className="dc-body">{children}</div>}
    </section>
  );
}

/** Petit bouton « i » : l'explication n'apparaît que si on la demande. */
export function InfoButton({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="info-btn" aria-label={`Aide : ${title}`} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>i</button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal info-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{title}</h2>
            <div className="info-text">{children}</div>
            <button className="btn secondary block" onClick={() => setOpen(false)}>Compris</button>
          </div>
        </div>
      )}
    </>
  );
}

export function Stars({ rarity }: { rarity: RarityId }) {
  const r = RARITIES[rarity];
  return <span className="stars">{Array.from({ length: r.order }, (_, i) => <Icon.star key={i} size={10} color={r.color} />)}</span>;
}

export function RarityTag({ rarity }: { rarity: RarityId }) {
  const r = RARITIES[rarity];
  return <span className="chip" style={{ color: r.glow, borderColor: r.color + '88', background: r.color + '22' }}>{r.name}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal">{children}</div>
    </div>
  );
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',') + ' M';
  if (n >= 100_000) return Math.floor(n / 1000) + ' k';
  return n.toLocaleString('fr-FR');
}

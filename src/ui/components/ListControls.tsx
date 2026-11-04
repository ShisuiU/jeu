import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../art/Icons';

// OUTILS DE LISTE — tri par menu déroulant, filtres dans un panneau qui monte du bas,
// filtres actifs rappelés sous forme d'étiquettes retirables. Les choix sont mémorisés
// sur l'appareil (confort uniquement : rien de vital n'en dépend).

export type Option = { id: string; label: string; icon?: ReactNode; color?: string };
export type FilterGroup = { id: string; label: string; options: Option[] };
export type Filters = Record<string, string[]>;

/** État mémorisé sur l'appareil (localStorage), avec repli silencieux si indisponible. */
export function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try { const raw = localStorage.getItem('aeonfall.ui.' + key); return raw ? { ...initial, ...JSON.parse(raw) } as T : initial; } catch { return initial; }
  });
  const set = (n: T) => { setV(n); try { localStorage.setItem('aeonfall.ui.' + key, JSON.stringify(n)); } catch { /* ignoré */ } };
  return [v, set];
}

export const activeCount = (f: Filters) => Object.values(f).reduce((a, l) => a + l.length, 0);
export const matches = (f: Filters, group: string, value: string) => !f[group]?.length || f[group].includes(value);

/** Panneau qui monte du bas de l'écran. */
export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  // Rendu au niveau de l'application : le bouton du bas reste visible au-dessus de la barre de navigation.
  return createPortal(
    <div className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-grip" />
        <div className="sheet-head"><b>{title}</b><button className="sheet-x" onClick={onClose} aria-label="Fermer">✕</button></div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.querySelector('.app') ?? document.body,
  );
}

/** Barre « Trier ▾ » + « Filtres (n) » + étiquettes des filtres actifs. */
export function ListControls({ sortOptions, sort, onSort, groups, filters, onFilters, count, extra }: {
  sortOptions: Option[]; sort: string; onSort: (s: string) => void;
  groups: FilterGroup[]; filters: Filters; onFilters: (f: Filters) => void;
  count: (f: Filters) => number; extra?: ReactNode;
}) {
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null);
  const [draft, setDraft] = useState<Filters>(filters);
  const n = activeCount(filters);
  const toggle = (f: Filters, g: string, id: string): Filters => {
    const cur = f[g] ?? [];
    return { ...f, [g]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
  };
  const tags = groups.flatMap((g) => (filters[g.id] ?? []).map((id) => ({ g, o: g.options.find((o) => o.id === id) })).filter((t) => t.o));
  const sortLabel = sortOptions.find((o) => o.id === sort)?.label ?? '';

  return (
    <div className="list-controls">
      <div className="lc-bar">
        <button className="lc-btn" onClick={() => setSheet('sort')} aria-haspopup="dialog">
          <span className="faint">Trier :</span> <b>{sortLabel}</b> <span className="lc-caret">▾</span>
        </button>
        <button className={`lc-btn ${n ? 'on' : ''}`} onClick={() => { setDraft(filters); setSheet('filter'); }} aria-haspopup="dialog">
          <Icon.filter size={15} /> Filtres{n ? ` (${n})` : ''}
        </button>
        {extra}
      </div>
      {tags.length > 0 && (
        <div className="lc-tags">
          {tags.map(({ g, o }) => (
            <button key={g.id + o!.id} className="lc-tag" onClick={() => onFilters(toggle(filters, g.id, o!.id))} aria-label={`Retirer le filtre ${o!.label}`}>
              {o!.icon}{o!.label}<span aria-hidden>✕</span>
            </button>
          ))}
          <button className="lc-clear" onClick={() => onFilters({})}>Tout effacer</button>
        </div>
      )}

      {sheet === 'sort' && (
        <Sheet title="Trier par" onClose={() => setSheet(null)}>
          <div className="sheet-list">
            {sortOptions.map((o) => (
              <button key={o.id} className={`sheet-row ${o.id === sort ? 'on' : ''}`} onClick={() => { onSort(o.id); setSheet(null); }}>
                {o.label}{o.id === sort && <span className="sheet-check">✓</span>}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'filter' && (
        <Sheet title="Filtres" onClose={() => setSheet(null)} footer={
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setDraft({})} disabled={!activeCount(draft)}>Effacer</button>
            <button className="btn grow" onClick={() => { onFilters(draft); setSheet(null); }}>Appliquer ({count(draft)})</button>
          </div>
        }>
          {groups.map((g) => (
            <div key={g.id} className="sheet-group">
              <div className="sheet-gtitle">{g.label}</div>
              <div className="sheet-opts">
                {g.options.map((o) => {
                  const on = draft[g.id]?.includes(o.id);
                  return (
                    <button key={o.id} className={`chip ${on ? 'active' : ''}`} style={o.color ? { color: o.color } : undefined} aria-pressed={on}
                      onClick={() => setDraft(toggle(draft, g.id, o.id))}>{o.icon}{o.label}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}

import { useUI } from '../../state/ui';
import { Icon } from '../art/Icons';

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind ?? ''}`} onClick={() => dismiss(t.id)}>
          {/* v1.111.0 (audit DA) : une icône et une couleur par type (succès, erreur, information). */}
          <span className="toast-ic" aria-hidden>{t.kind === 'ok' ? '✓' : t.kind === 'error' ? '!' : <Icon.star size={12} />}</span>
          <span>{t.text}</span>
          {t.action && <button className="btn small" onClick={(e) => { e.stopPropagation(); t.action!.run(); dismiss(t.id); }}>{t.action.label}</button>}
        </div>
      ))}
    </div>
  );
}

import { useUI } from '../../state/ui';

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind ?? ''}`} onClick={() => dismiss(t.id)}>
          <span>{t.text}</span>
          {t.action && <button className="btn small" onClick={(e) => { e.stopPropagation(); t.action!.run(); dismiss(t.id); }}>{t.action.label}</button>}
        </div>
      ))}
    </div>
  );
}

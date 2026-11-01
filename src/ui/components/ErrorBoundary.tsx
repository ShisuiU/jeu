import { Component, type ReactNode } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { exportSave } from '../../save/exportImport';
import { flushSave } from '../../save/saveManager';

// FILET DE SÉCURITÉ : si un écran plante, la partie n'est pas perdue. Le joueur peut revenir à
// l'accueil, copier une sauvegarde de secours ou recharger. La sauvegarde est forcée immédiatement.
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('Erreur d’écran :', error); void flushSave(); }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    const copy = async () => {
      const s = useGame.getState().save;
      if (!s) return;
      try { await navigator.clipboard.writeText(exportSave(s)); useUI.getState().toast('Sauvegarde de secours copiée.', 'ok'); }
      catch { useUI.getState().toast('Copie impossible : utilisez Menu → Sauvegarde.', 'error'); }
    };
    return (
      <div className="screen" style={{ padding: 'calc(var(--sat) + 40px) 20px', alignItems: 'stretch', justifyContent: 'center' }}>
        <div className="bg-ambient" />
        <div className="panel">
          <h2 style={{ color: 'var(--gold-hi)', fontSize: 20 }}>Un imprévu dans la Fracture…</h2>
          <p className="muted">Cet écran a rencontré une erreur. Votre progression est sauvegardée.</p>
          <p className="faint" style={{ wordBreak: 'break-word' }}>{this.state.error.message}</p>
          <div className="stack" style={{ marginTop: 12 }}>
            <button className="btn block" onClick={() => { useUI.getState().tab('home'); this.setState({ error: null }); }}>Revenir à l’accueil</button>
            <button className="btn secondary block" onClick={copy}>Copier une sauvegarde de secours</button>
            <button className="btn secondary block" onClick={() => location.reload()}>Recharger le jeu</button>
          </div>
        </div>
      </div>
    );
  }
}

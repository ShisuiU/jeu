import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount, loadCloud } from '../../cloud/account';
import type { SaveData } from '../../save/schema';
import { Modal, Panel, Screen } from '../components/common';

// COMPTE — connexion facultative : la partie est alors sauvegardée en ligne et se retrouve sur
// n'importe quel appareil. Sans compte, rien ne change (sauvegarde sur l'appareil uniquement).

const when = (ms: number | null) => (ms ? new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais');
export function saveSummary(s: SaveData) {
  const stages = Object.values(s.progress.campaign).filter((p) => p.clears > 0).length;
  return `Niveau ${s.profile.level} · ${s.heroes.length} héros · ${stages} niveaux de campagne`;
}

export function Account() {
  const acc = useAccount();
  const save = useGame((s) => s.save)!;
  const toast = useUI((s) => s.toast);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delTxt, setDelTxt] = useState('');

  const run = async (fn: (c: Awaited<ReturnType<typeof loadCloud>>) => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { const c = await loadCloud(); await fn(c); if (ok) toast(ok, 'ok'); return true; }
    catch (e) { const c = await loadCloud(); toast(c.errText(e), 'error'); return false; }
    finally { setBusy(false); }
  };

  if (!acc.user) return (
    <Screen title="Compte">
      <Panel>
        <p className="muted" style={{ marginTop: 0 }}>Avec un compte gratuit, ta partie est sauvegardée en ligne : tu la retrouves sur un autre appareil ou après avoir réinstallé le jeu. Le jeu reste jouable hors ligne.</p>
        <div className="seg" style={{ marginBottom: 12 }}>
          <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Se connecter</button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Créer un compte</button>
        </div>
        <form className="acc-form" onSubmit={(e) => { e.preventDefault(); void run((c) => (mode === 'login' ? c.login(email, pw) : c.register(email, pw)), mode === 'login' ? 'Connecté.' : 'Compte créé : ta partie est sauvegardée en ligne.'); }}>
          <label>Adresse e-mail<input className="text-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Mot de passe<input className="text-input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
          <button className="btn block" type="submit" disabled={busy}>{busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
        </form>
        {mode === 'login' && (
          <button className="acc-link" disabled={busy} onClick={() => { if (!email) { toast('Indique ton adresse e-mail d’abord.'); return; } void run((c) => c.resetPassword(email), 'E-mail envoyé : suis le lien pour choisir un nouveau mot de passe.'); }}>Mot de passe oublié ?</button>
        )}
        {mode === 'register' && <p className="faint" style={{ marginBottom: 0 }}>Ta partie actuelle ({saveSummary(save)}) deviendra celle du compte.</p>}
      </Panel>
      <p className="faint" style={{ textAlign: 'center' }}>Données conservées : ton adresse e-mail et ta sauvegarde de jeu, chez Google Firebase. Tu peux supprimer ton compte à tout moment.</p>
    </Screen>
  );

  return (
    <Screen title="Compte">
      <Panel>
        <div className="acc-who"><b>{acc.user.email}</b><span className={`acc-state ${acc.status}`}>{acc.status === 'syncing' ? 'Synchronisation…' : acc.status === 'offline' ? 'Hors ligne' : acc.status === 'error' ? 'Erreur' : 'Sauvegarde en ligne active'}</span></div>
        <div className="faint">Dernière synchronisation : {when(acc.lastSync)}</div>
        {acc.error && <div className="hint warn" style={{ marginTop: 8 }}>{acc.error}</div>}
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn secondary grow" disabled={busy || acc.status === 'syncing'} onClick={() => void run((c) => c.syncNow('manual'))}>Synchroniser</button>
          <button className="btn secondary grow" disabled={busy} onClick={() => void run((c) => c.logout(), 'Déconnecté. La partie reste sur cet appareil.')}>Se déconnecter</button>
        </div>
      </Panel>
      <button className="acc-link danger" onClick={() => setDel(true)}>Supprimer mon compte</button>
      {del && (
        <Modal onClose={() => setDel(false)}>
          <h2>Supprimer le compte ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>La sauvegarde en ligne et le compte seront effacés définitivement. La partie reste sur cet appareil. Tape <b>SUPPRIMER</b> et ton mot de passe pour confirmer.</p>
          <input className="text-input" value={delTxt} onChange={(e) => setDelTxt(e.target.value)} placeholder="SUPPRIMER" aria-label="Confirmation" />
          <input className="text-input" type="password" style={{ marginTop: 8 }} value={delPw} onChange={(e) => setDelPw(e.target.value)} placeholder="Mot de passe" aria-label="Mot de passe" autoComplete="current-password" />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setDel(false)}>Annuler</button>
            <button className="btn danger grow" disabled={busy || delTxt.trim().toUpperCase() !== 'SUPPRIMER' || !delPw} onClick={async () => { if (await run((c) => c.deleteAccount(delPw), 'Compte supprimé.')) setDel(false); }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

/** Fenêtre affichée partout quand la partie de l'appareil et celle du compte ont toutes deux avancé. */
export function CloudConflictModal() {
  const c = useAccount((s) => s.conflict);
  if (!c) return null;
  return (
    <Modal>
      <h2>Deux parties différentes</h2>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Cet appareil et ton compte n’ont pas la même progression. Laquelle garder ? L’autre sera conservée dans les copies de secours de l’appareil.</p>
      <button className="acc-choice" onClick={() => void loadCloud().then((m) => m.resolve('local'))}>
        <b>Cet appareil</b><span>{saveSummary(c.local)}</span><span className="faint">Modifiée le {when(c.local.updatedAt)}</span>
      </button>
      <button className="acc-choice" onClick={() => void loadCloud().then((m) => m.resolve('remote'))}>
        <b>Mon compte en ligne</b><span>{saveSummary(c.remote)}</span><span className="faint">Modifiée le {when(c.remoteAt)}</span>
      </button>
    </Modal>
  );
}

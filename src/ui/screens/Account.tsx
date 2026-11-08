import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount, loadCloud, cloudWanted } from '../../cloud/account';
import { inTutorial } from '../components/Coach';
import { Icon } from '../art/Icons';
import type { SaveData } from '../../save/schema';
import { Modal, Panel } from '../components/common';

// COMPTE — connexion facultative : la partie est alors sauvegardée en ligne et se retrouve sur
// n'importe quel appareil. Sans compte, rien ne change (sauvegarde sur l'appareil uniquement).

const when = (ms: number | null) => (ms ? new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais');
export function saveSummary(s: SaveData) {
  const stages = Object.values(s.progress.campaign).filter((p) => p.clears > 0).length;
  return `Niveau ${s.profile.level} · ${s.heroes.length} héros · ${stages} niveaux de campagne`;
}

/** Compte en ligne (affiché en haut de « Sauvegarde et compte »). */
export function AccountBody({ mode: initial }: { mode?: 'register' } = {}) {
  const acc = useAccount();
  const save = useGame((s) => s.save)!;
  const toast = useUI((s) => s.toast);
  const [mode, setMode] = useState<'login' | 'register'>(initial ?? 'login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delTxt, setDelTxt] = useState('');
  const [ban, setBan] = useState<{ reason: string } | null>(null);
  useEffect(() => { if (acc.user) void import('../../cloud/moderationCloud').then((m) => m.myBan()).then(setBan).catch(() => {}); }, [acc.user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: (c: Awaited<ReturnType<typeof loadCloud>>) => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { const c = await loadCloud(); await fn(c); if (ok) toast(ok, 'ok'); return true; }
    catch (e) { const c = await loadCloud(); toast(c.errText(e), 'error'); return false; }
    finally { setBusy(false); }
  };

  if (!acc.user) return (
    <>
      <Panel>
        <p className="muted" style={{ marginTop: 0 }}>Avec un compte gratuit, ta partie est sauvegardée en ligne : tu la retrouves sur un autre appareil ou après avoir réinstallé le jeu. Le jeu reste jouable hors ligne.</p>
        <button className="btn block acc-google" disabled={busy} onClick={() => void run(async (c) => { if ((await c.loginGoogle()) === 'done') toast('Connecté avec Google : ta partie est sauvegardée en ligne.', 'ok'); })}><GoogleLogo /> Continuer avec Google</button>
        <div className="acc-or"><span>ou avec une adresse e-mail</span></div>
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
    </>
  );

  return (
    <>
      <Panel>
        <div className="acc-who"><b>{acc.user.email}</b><span className={`acc-state ${acc.status}`}>{acc.status === 'syncing' ? 'Synchronisation…' : acc.status === 'offline' ? 'Hors ligne' : acc.status === 'error' ? 'Erreur' : 'Sauvegarde en ligne active'}</span></div>
        <div className="faint">{acc.user.google ? (acc.user.password ? 'Connexion : Google ou mot de passe' : 'Connecté avec Google') : 'Connexion : e-mail et mot de passe'}</div>
        <div className="faint">Dernière synchronisation : {when(acc.lastSync)}</div>
        {ban && <div className="hint warn" style={{ marginTop: 8 }}>Ton compte est suspendu des fonctions en ligne (classements, Arène, clans, amis){ban.reason ? ` : ${ban.reason}` : ''}. Ta partie reste jouable et sauvegardée.</div>}
        {acc.error && <div className="hint warn" style={{ marginTop: 8 }}>{acc.error}</div>}
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn secondary grow" disabled={busy || acc.status === 'syncing'} onClick={() => void run((c) => c.syncNow('manual'))}>Synchroniser</button>
          <button className="btn secondary grow" disabled={busy} onClick={() => void run((c) => c.logout(), 'Déconnecté. La partie reste sur cet appareil.')}>Se déconnecter</button>
        </div>
      </Panel>
      {!acc.user.google && (
        <Panel>
          <p className="faint" style={{ marginTop: 0 }}>Lie ton compte Google pour te connecter en un geste sur un autre appareil. Ta sauvegarde ne change pas.</p>
          <button className="btn secondary block acc-google" disabled={busy} onClick={() => void run(async (c) => { if ((await c.linkGoogle()) === 'done') toast('Compte Google lié : tu peux maintenant te connecter avec Google.', 'ok'); })}><GoogleLogo /> Lier mon compte Google</button>
        </Panel>
      )}
      <p className="faint acc-id">Identifiant du compte : <code>{acc.user.uid}</code> <button className="acc-link" onClick={() => void navigator.clipboard?.writeText(acc.user!.uid).then(() => toast('Identifiant copié.', 'ok')).catch(() => {})}>Copier</button></p>
      <button className="acc-link danger" onClick={() => setDel(true)}>Supprimer mon compte</button>
      {del && (
        <Modal onClose={() => setDel(false)}>
          <h2>Supprimer le compte ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>La sauvegarde en ligne et le compte seront effacés définitivement. La partie reste sur cet appareil. Tape <b>SUPPRIMER</b>{acc.user.password ? <> et ton mot de passe</> : <>, puis confirme avec Google</>} pour confirmer.</p>
          <input className="text-input" value={delTxt} onChange={(e) => setDelTxt(e.target.value)} placeholder="SUPPRIMER" aria-label="Confirmation" />
          {acc.user.password && <input className="text-input" type="password" style={{ marginTop: 8 }} value={delPw} onChange={(e) => setDelPw(e.target.value)} placeholder="Mot de passe" aria-label="Mot de passe" autoComplete="current-password" />}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setDel(false)}>Annuler</button>
            <button className="btn danger grow" disabled={busy || delTxt.trim().toUpperCase() !== 'SUPPRIMER' || (acc.user.password && !delPw)} onClick={async () => { if (await run((c) => c.deleteAccount(acc.user?.password ? delPw : undefined), 'Compte supprimé.')) setDel(false); }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </>
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

// INVITATION À CRÉER UN COMPTE — affichée sur l'accueil quand la partie a un peu avancé et n'est
// sauvegardée que sur l'appareil. « Plus tard » la repousse (1, 3 puis 7 jours), 4 fois au plus.
const PROMPT_KEY = 'aeonfall.accountPrompt';
type PromptState = { n: number; last: number; never?: boolean };
const DELAYS = [0, 1, 3, 7].map((d) => d * 86_400_000);
const readPrompt = (): PromptState => { try { return JSON.parse(localStorage.getItem(PROMPT_KEY) ?? '') as PromptState; } catch { return { n: 0, last: 0 }; } };
const writePrompt = (p: PromptState) => { try { localStorage.setItem(PROMPT_KEY, JSON.stringify(p)); } catch { /* */ } };

export function shouldPromptAccount(s: SaveData, now: number, p: PromptState = readPrompt()): boolean {
  if (p.never || p.n >= DELAYS.length || cloudWanted() || useAccount.getState().user) return false;
  const clears = Object.values(s.progress.campaign).filter((p) => p.clears > 0).length;
  if (Math.max(clears, s.stats.battlesWon) < 3 || inTutorial(s)) return false;
  return now - p.last >= DELAYS[p.n];
}

export function AccountPrompt() {
  const save = useGame((s) => s.save)!;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Petit délai : on laisse l'accueil s'afficher, et rien d'autre (connexion du jour, guide) par-dessus.
    const t = setTimeout(() => {
      if (document.querySelector('.modal-backdrop, .sheet-backdrop, .coach')) return;
      if (shouldPromptAccount(useGame.getState().save!, Date.now())) setOpen(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;
  const close = (never = false) => { const p = readPrompt(); writePrompt({ n: p.n + 1, last: Date.now(), never }); setOpen(false); };
  return (
    <Modal onClose={() => close()}>
      <div className="acc-prompt-ic"><Icon.save size={34} /></div>
      <h2>Ne perds pas ta partie</h2>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Elle n’est enregistrée que sur ce téléphone. Avec un compte gratuit, elle est aussi sauvegardée en ligne : tu la retrouves sur un autre appareil ou après avoir réinstallé le jeu.</p>
      <div className="acc-prompt-sum">{saveSummary(save)}</div>
      <button className="btn block" onClick={() => { close(); useUI.getState().push({ name: 'account', mode: 'register' }); }}>Créer un compte</button>
      <button className="btn secondary block" style={{ marginTop: 8 }} onClick={() => close()}>Plus tard</button>
      <button className="acc-link" onClick={() => close(true)}>Ne plus me demander</button>
    </Modal>
  );
}

/** Logo « G » de Google (couleurs officielles), pour les boutons de connexion. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden style={{ verticalAlign: '-4px', marginRight: 8 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

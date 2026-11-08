import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { exportFileName, exportSave, importSave } from '../../save/exportImport';
import { flushSave, listBackups, parseStored, replaceSave, resetEverything, saveStatus } from '../../save/saveManager';
import type { SaveData } from '../../save/schema';
import type { StoredSave } from '../../save/db';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { AccountBody } from './Account';

const dt = (ms: number) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

function Summary({ s }: { s: SaveData }) {
  const best = [...s.heroes].sort((a, b) => b.level - a.level)[0];
  return (
    <div className="stack" style={{ fontSize: 13.5 }}>
      <div className="stat-row"><span className="muted">Nom</span><b>{s.profile.name}</b></div>
      <div className="stat-row"><span className="muted">Héros</span><b>{s.heroes.length}{best ? ` (meilleur : ${HERO_BY_ID[best.heroId]?.name} Nv ${best.level})` : ''}</b></div>
      <div className="stat-row"><span className="muted">Or · Cristaux</span><b>{fmt(s.resources.gold)} · {fmt(s.resources.crystals)}</b></div>
      <div className="stat-row"><span className="muted">Jours de connexion</span><b>{s.daily.totalLogins}</b></div>
      <div className="stat-row"><span className="muted">Dernière modification</span><b>{dt(s.updatedAt)}</b></div>
    </div>
  );
}

// SAUVEGARDE ET COMPTE — tout ce qui protège la partie, au même endroit : compte en ligne, export, copies de secours.
export function Saves({ mode }: { mode?: 'register' } = {}) {
  const save = useGame((s) => s.save)!;
  const toast = useUI((s) => s.toast);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<{ save: SaveData; reason: string } | null>(null);
  const [backups, setBackups] = useState<StoredSave[]>([]);
  const [resetStep, setResetStep] = useState(0);
  const [resetText, setResetText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => listBackups().then(setBackups).catch(() => setBackups([]));
  useEffect(() => { void refresh(); }, []);
  // Première visite : la pastille « protège ta partie » du Menu s'éteint.
  useEffect(() => { if (!useGame.getState().save?.flags.saves_seen) useGame.getState().mutate((s) => { s.flags.saves_seen = true; }); }, []);

  const exported = () => exportSave(save);

  const download = async () => {
    await flushSave();
    const text = exported();
    const name = exportFileName(save);
    const file = new File([text], name, { type: 'text/plain' });
    // Sur iPhone, la feuille de partage permet d'enregistrer dans Fichiers / iCloud Drive.
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde Aeonfall' }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Fichier de sauvegarde créé.', 'ok');
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(exported()); toast('Code de sauvegarde copié. Colle-le dans Notes ou un mail.', 'ok'); }
    catch { setCode(exported()); toast('Copie automatique impossible : le code est affiché ci-dessous.', 'error'); }
  };

  const tryImport = (text: string) => {
    try { setPending({ save: importSave(text), reason: 'import' }); }
    catch (e) { toast((e as Error).message, 'error'); }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    tryImport(await f.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmReplace = async () => {
    if (!pending) return;
    await replaceSave(pending.save, pending.reason);
    setPending(null); setCode('');
    toast('Sauvegarde chargée. Une copie de l’ancienne partie a été conservée.', 'ok');
    void refresh();
  };

  return (
    <Screen title="Sauvegarde et compte">
      <div className="panel-title" style={{ margin: '2px 0 8px' }}>Compte en ligne</div>
      <AccountBody mode={mode} />
      <div className="panel-title" style={{ margin: '18px 0 8px' }}>Sur cet appareil</div>
      <Panel title="Partie actuelle">
        <Summary s={save} />
        <p className="faint" style={{ marginTop: 10 }}>
          Sauvegarde automatique{saveStatus.lastSavedAt ? ` · ${dt(saveStatus.lastSavedAt)}` : ''}{saveStatus.persisted ? ' · protégée' : ''}
        </p>
        {saveStatus.error && <div className="hint warn">Erreur d’écriture : {saveStatus.error}</div>}
      </Panel>

      <Panel title="Exporter">
        <p className="faint" style={{ marginTop: 0 }}>À faire avant de changer de téléphone.</p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn grow" onClick={download}>Fichier</button>
          <button className="btn secondary grow" onClick={copy}>Copier le code</button>
        </div>
      </Panel>

      <Panel title="Importer">
        <textarea className="text-area" placeholder="Colle ici un code de sauvegarde (AEONFALL1:…)" value={code} onChange={(e) => setCode(e.target.value)} />
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="btn grow" disabled={!code.trim()} onClick={() => tryImport(code)}>Charger le code</button>
          <button className="btn secondary grow" onClick={() => fileRef.current?.click()}>Ouvrir un fichier</button>
          <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </Panel>

      <Panel title="Copies de secours automatiques">
        {backups.length === 0 && <p className="faint">Aucune copie pour l’instant.</p>}
        {backups.map((b) => {
          const s = parseStored(b);
          return (
            <div key={b.key} className="setting-row">
              <div className="grow">
                <b>{dt(b.savedAt)}</b>
                <div className="faint">{b.key.split('_').slice(1).join(' ').replace(/-/g, ' ')}{s ? ` · ${s.heroes.length} héros · ${fmt(s.resources.gold)} or` : ' · endommagée'}</div>
              </div>
              <button className="btn secondary small" disabled={!s} onClick={() => s && setPending({ save: s, reason: 'restauration' })}>Restaurer</button>
            </div>
          );
        })}
      </Panel>

      <Panel title="Zone dangereuse">
        <button className="btn danger block" onClick={() => setResetStep(1)}>Recommencer une nouvelle partie</button>
      </Panel>

      {pending && (
        <Modal onClose={() => setPending(null)}>
          <h2>{pending.reason === 'import' ? 'Importer cette sauvegarde ?' : 'Restaurer cette copie ?'}</h2>
          <Summary s={pending.save} />
          <div className="hint" style={{ marginTop: 12 }}>La partie actuelle sera remplacée. Une copie de secours en sera faite automatiquement.</div>
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn secondary grow" onClick={() => setPending(null)}>Annuler</button>
            <button className="btn grow" onClick={confirmReplace}>Confirmer</button>
          </div>
        </Modal>
      )}
      {resetStep > 0 && (
        <Modal onClose={() => { setResetStep(0); setResetText(''); }}>
          <h2>Nouvelle partie</h2>
          <p className="muted" style={{ textAlign: 'center' }}>Toute la progression actuelle sera remplacée. Elle restera récupérable dans les copies de secours. Tape <b>EFFACER</b> pour confirmer.</p>
          <input className="text-input" value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="EFFACER" autoCapitalize="characters" />
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn secondary grow" onClick={() => { setResetStep(0); setResetText(''); }}>Annuler</button>
            <button className="btn danger grow" disabled={resetText.trim().toUpperCase() !== 'EFFACER'} onClick={async () => {
              await resetEverything(); setResetStep(0); setResetText(''); void refresh(); toast('Nouvelle partie commencée.', 'ok');
            }}>Recommencer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}


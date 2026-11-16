import { BALANCE } from '../data/balance';
import { useGame } from '../state/store';
import { useUI } from '../state/ui';
import { listBackups, readMain, requestPersistence, unpack, wipeMain, writeBackup, writeMain, writeMirrorSync, type StoredSave } from './db';
import { migrateSave } from './migrations';
import { createNewSave, type SaveData } from './schema';
import { LocalOnlyProvider, type SyncProvider } from './sync';

// GESTIONNAIRE DE SAUVEGARDE
//  • Autosauvegarde « debouncée » après chaque modification.
//  • Écriture immédiate quand l'app passe en arrière-plan / est fermée (iOS peut tuer l'app sans prévenir).
//  • Copie de secours toutes les 10 minutes + avant chaque opération risquée (import, restauration, reset).
//  • Au chargement : on prend la sauvegarde valide la plus récente entre IndexedDB, le miroir localStorage
//    et les copies de secours. Une sauvegarde corrompue n'écrase jamais une sauvegarde saine.

let timer: ReturnType<typeof setTimeout> | null = null;
let lastWritten = -1;
let lastBackupAt = 0;
let provider: SyncProvider = LocalOnlyProvider;
export type SaveStatus = { lastSavedAt: number | null; error: string | null; persisted: boolean };
export const saveStatus: SaveStatus = { lastSavedAt: null, error: null, persisted: false };

function tryParse(rec: StoredSave | null): SaveData | null {
  const raw = unpack(rec);
  if (!raw) return null;
  try { return migrateSave(raw); } catch { return null; }
}

export async function loadBestSave(): Promise<{ save: SaveData; source: string }> {
  const { idb, mirror } = await readMain();
  const candidates: { save: SaveData; source: string }[] = [];
  const a = tryParse(idb); if (a) candidates.push({ save: a, source: 'indexeddb' });
  const b = tryParse(mirror); if (b) candidates.push({ save: b, source: 'miroir' });
  if (candidates.length === 0) {
    try {
      for (const bk of await listBackups()) {
        const c = tryParse(bk);
        if (c) { candidates.push({ save: c, source: 'secours' }); break; }
      }
    } catch { /* */ }
  }
  if (candidates.length === 0) {
    // v1.111.0 (audit technique C2) : des données existent mais aucune n'est lisible (version plus récente du jeu,
    // corruption) : on les met de côté AVANT d'écrire quoi que ce soit, au lieu de les écraser par une partie neuve.
    const raws = [idb, mirror].filter((r): r is StoredSave => !!r && typeof r.json === 'string');
    if (raws.length) {
      try { localStorage.setItem(`aeonfall-quarantine-${Date.now()}`, raws[0].json); } catch { /* quota */ }
      return { save: createNewSave(), source: 'illisible' };
    }
    return { save: createNewSave(), source: 'nouvelle' };
  }
  candidates.sort((x, y) => y.save.revision - x.save.revision || y.save.updatedAt - x.save.updatedAt);
  return candidates[0];
}

/** Sauvegarde immédiate (après un moment important : fin de combat, achat…), sans attendre le délai habituel. */
export function saveNow(): void { if (readOnly) return; const s = useGame.getState().save; if (s && s.revision !== lastWritten) writeMirrorSync(s); void flushSave(); }

/** Deux onglets ouverts (audit technique C3) : seul celui qui tient le verrou écrit ; l'autre ne sauvegarde pas. */
let readOnly = false;
export const isReadOnly = () => readOnly;

export async function flushSave(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null; }
  if (readOnly) return;
  const s = useGame.getState().save;
  if (!s || s.revision === lastWritten) return;
  try {
    await writeMain(s);
    lastWritten = s.revision;
    saveStatus.lastSavedAt = Date.now();
    saveStatus.error = null;
    if (Date.now() - lastBackupAt > BALANCE.autosave.backupEveryMs) {
      lastBackupAt = Date.now();
      // Copie de secours à part : un échec (stockage plein) ne doit ni annoncer un échec de sauvegarde
      // (la partie principale est écrite) ni empêcher l'envoi en ligne.
      try { await writeBackup(s, 'auto', BALANCE.autosave.maxBackups); } catch { /* */ }
    }
    provider.push(s).catch(() => {});
  } catch (e) {
    const first = !saveStatus.error;
    saveStatus.error = e instanceof Error ? e.message : String(e);
    if (first) useUI.getState().toast('Échec de la sauvegarde automatique. Exporte ta partie (Menu → Sauvegarde).', 'error');
  }
}

export async function initSaveSystem(): Promise<string> {
  // Verrou tenu pendant toute la vie de la page ; s'il est déjà pris, cette fenêtre ne sauvegarde pas.
  try {
    const locks = (navigator as Navigator & { locks?: { request: (n: string, o: { ifAvailable: boolean }, cb: (l: unknown) => Promise<void> | void) => Promise<unknown> } }).locks;
    if (locks) {
      await new Promise<void>((resolve) => {
        void locks.request('aeonfall-save', { ifAvailable: true }, (lock) => { if (!lock) { readOnly = true; resolve(); return; } resolve(); return new Promise<void>(() => {}); });
      });
    }
  } catch { /* navigateur sans Web Locks : comportement d'avant */ }
  const { save, source } = await loadBestSave();
  if (source === 'illisible') readOnly = true; // ne rien écrire par-dessus des données qu'on ne sait pas lire
  useGame.getState().setSave(save);
  useGame.getState().tick();
  lastBackupAt = Date.now();
  if (!readOnly) { try { await writeBackup(save, 'demarrage', BALANCE.autosave.maxBackups); } catch { /* */ } }
  lastWritten = -1;
  await flushSave();
  saveStatus.persisted = await requestPersistence();

  useGame.subscribe((st, prev) => {
    if (st.save && st.save !== prev.save) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flushSave, BALANCE.autosave.debounceMs);
    }
  });
  // Fermeture / arrière-plan : miroir synchrone d'abord (il survit à une fermeture brutale), puis IndexedDB.
  const flushNow = () => { if (readOnly) return; const s = useGame.getState().save; if (s && s.revision !== lastWritten) writeMirrorSync(s); void flushSave(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); else useGame.getState().tick(); });
  window.addEventListener('pagehide', flushNow); // suffit (beforeunload empêchait le retour instantané sous Firefox)
  return source;
}

/** Remplace la partie courante (import / restauration) après avoir créé une copie de secours. */
export async function replaceSave(next: SaveData, reason: string): Promise<void> {
  const cur = useGame.getState().save;
  if (cur) await writeBackup(cur, `avant-${reason}`, BALANCE.autosave.maxBackups);
  // On force une révision supérieure pour que la sauvegarde importée gagne au prochain chargement.
  next = { ...next, revision: Math.max(next.revision, (cur?.revision ?? 0)) + 1, updatedAt: Date.now() };
  useGame.getState().setSave(next);
  await flushSave();
}

export async function resetEverything(): Promise<void> {
  const cur = useGame.getState().save;
  // La partie actuelle est d'abord copiée dans les sauvegardes de secours : une réinitialisation reste annulable.
  if (cur) await writeBackup(cur, 'avant-reinitialisation', BALANCE.autosave.maxBackups);
  await wipeMain();
  useGame.getState().newGame();
  lastWritten = -1;
  await flushSave();
}

export function setSyncProvider(p: SyncProvider) { provider = p; }
export { listBackups, tryParse as parseStored };

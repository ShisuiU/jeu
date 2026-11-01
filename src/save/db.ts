import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { fnv1a } from '../core/hash';
import type { SaveData } from './schema';

// Stockage IndexedDB :
//  - « slots » : la sauvegarde principale (clé "main")
//  - « backups » : copies tournantes horodatées, pour récupérer après une corruption ou une erreur
// En secours, une copie est aussi écrite dans localStorage (si IndexedDB devient indisponible).

export interface StoredSave {
  key: string;
  savedAt: number;
  checksum: string;
  version: number;
  json: string;
}

interface AeonDB extends DBSchema {
  slots: { key: string; value: StoredSave };
  backups: { key: string; value: StoredSave; indexes: { bySavedAt: number } };
}

const DB_NAME = 'aeonfall';
const LS_MIRROR = 'aeonfall.mirror';
let dbPromise: Promise<IDBPDatabase<AeonDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<AeonDB>(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore('slots', { keyPath: 'key' });
        const b = d.createObjectStore('backups', { keyPath: 'key' });
        b.createIndex('bySavedAt', 'savedAt');
      },
    });
  }
  return dbPromise;
}

export function pack(key: string, save: SaveData): StoredSave {
  const json = JSON.stringify(save);
  return { key, savedAt: save.updatedAt, checksum: fnv1a(json), version: save.version, json };
}

export function unpack(rec: StoredSave | undefined | null): unknown | null {
  if (!rec || typeof rec.json !== 'string') return null;
  if (fnv1a(rec.json) !== rec.checksum) return null; // corrompue
  try { return JSON.parse(rec.json); } catch { return null; }
}

export async function writeMain(save: SaveData): Promise<void> {
  const rec = pack('main', save);
  try {
    await (await db()).put('slots', rec);
  } finally {
    try { localStorage.setItem(LS_MIRROR, JSON.stringify(rec)); } catch { /* quota / mode privé */ }
  }
}

export async function readMain(): Promise<{ idb: StoredSave | null; mirror: StoredSave | null }> {
  let idb: StoredSave | null = null;
  try { idb = (await (await db()).get('slots', 'main')) ?? null; } catch { idb = null; }
  let mirror: StoredSave | null = null;
  try { const m = localStorage.getItem(LS_MIRROR); mirror = m ? JSON.parse(m) : null; } catch { mirror = null; }
  return { idb, mirror };
}

export async function writeBackup(save: SaveData, reason: string, maxBackups: number): Promise<void> {
  const d = await db();
  await d.put('backups', pack(`${save.updatedAt}_${reason}`, save));
  const keys = await d.getAllKeysFromIndex('backups', 'bySavedAt');
  const excess = keys.length - maxBackups;
  for (let i = 0; i < excess; i++) await d.delete('backups', keys[i]);
}

export async function listBackups(): Promise<StoredSave[]> {
  const all = await (await db()).getAllFromIndex('backups', 'bySavedAt');
  return all.reverse();
}

export async function wipeMain(): Promise<void> {
  await (await db()).delete('slots', 'main');
  try { localStorage.removeItem(LS_MIRROR); } catch { /* */ }
}

export async function wipeAll(): Promise<void> {
  const d = await db();
  await d.clear('slots');
  await d.clear('backups');
  try { localStorage.removeItem(LS_MIRROR); } catch { /* */ }
}

/** Demande au navigateur de ne pas effacer les données en cas de manque d'espace. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* */ }
  return false;
}

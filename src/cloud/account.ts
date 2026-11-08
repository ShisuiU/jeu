import { create } from 'zustand';
import type { SaveData } from '../save/schema';

// ÉTAT DU COMPTE — léger (sans Firebase) : l'interface peut l'afficher sans charger le SDK.
// Le SDK Firebase n'est chargé qu'à la connexion, ou au démarrage si un compte était déjà connecté.

export interface CloudConflict { local: SaveData; remote: SaveData; remoteAt: number }
interface AccountState {
  started: boolean;
  /** google / password : moyens de connexion liés au compte. */
  user: { uid: string; email: string | null; google?: boolean; password?: boolean } | null;
  busy: boolean;
  lastSync: number | null;
  status: 'idle' | 'syncing' | 'ok' | 'offline' | 'error';
  conflict: CloudConflict | null;
  error: string | null;
  set: (p: Partial<AccountState>) => void;
}
export const useAccount = create<AccountState>((set) => ({
  started: false, user: null, busy: false, lastSync: null, status: 'idle', conflict: null, error: null,
  set: (p) => set(p),
}));

const FLAG = 'aeonfall.cloud.on';
export const cloudWanted = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
export const setCloudWanted = (on: boolean) => { try { if (on) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch { /* */ } };

/** Charge le module Firebase à la demande. */
export const loadCloud = () => import('./cloudCore');

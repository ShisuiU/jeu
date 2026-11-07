import type { SaveData } from './schema';

// SYNCHRONISATION CLOUD (future)
// Le jeu ne dépend d'aucun serveur. Ce contrat permettra plus tard de brancher un fournisseur
// (ex. stockage gratuit, WebDAV, Supabase…) sans toucher au reste du code : le SaveManager appelle
// `push` après chaque sauvegarde réussie et `pull` au démarrage. La résolution de conflit s'appuie sur
// `revision` et `updatedAt` présents dans chaque sauvegarde.

export interface SyncProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  pull(): Promise<SaveData | null>;
  push(save: SaveData): Promise<void>;
}

export const LocalOnlyProvider: SyncProvider = {
  id: 'local',
  name: 'Appareil uniquement',
  isAvailable: async () => true,
  pull: async () => null,
  push: async () => {},
};


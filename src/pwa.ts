import { registerSW } from 'virtual:pwa-register';
import { useUI } from './state/ui';
import { flushSave } from './save/saveManager';

// Service worker : met en cache tout le jeu pour le hors ligne. Quand une nouvelle version est publiée,
// on propose de recharger (après avoir sauvegardé) plutôt que de recharger de force en pleine partie.
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;

export function setupPWA() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  updateSW = registerSW({
    onNeedRefresh() {
      useUI.getState().toast('Nouvelle version disponible.', 'info', {
        label: 'Mettre à jour',
        run: async () => { await flushSave(); await updateSW?.(true); },
      });
    },
    onOfflineReady() {
      useUI.getState().toast('Jeu prêt à fonctionner hors ligne.', 'ok');
    },
    onRegisteredSW(_url, reg) {
      registration = reg;
      // Vérifie les mises à jour toutes les heures quand l'app est ouverte.
      if (reg) setInterval(() => { if (navigator.onLine) void reg.update(); }, 60 * 60 * 1000);
    },
  });
}

export async function checkForUpdate(): Promise<boolean> {
  if (!registration || !navigator.onLine) return false;
  try { await registration.update(); return true; } catch { return false; }
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

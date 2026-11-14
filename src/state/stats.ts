import { useGame } from './store';
import { addEvent, currentDay, loadDay, storeDay, type StatEvent } from '../game/telemetry';
import { STAGE_BY_ID, progressKey } from '../data/campaign';

// Collecte des statistiques anonymes côté jeu : on additionne sur l'appareil, on envoie au plus toutes les 5 minutes
// (et quand l'app passe en arrière-plan). Jamais en test (adresse locale, ?qa) : les chiffres restent ceux des joueurs.
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0';
const FLUSH_MS = 5 * 60_000;
let dirty = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const enabled = () => !!useGame.getState().save?.settings.shareStats;
const sendAllowed = () => typeof location !== 'undefined' && !/^(localhost|127\.|192\.168\.)/.test(location.hostname) && !new URLSearchParams(location.search).has('qa');

export function trackStat(e: StatEvent) {
  if (!enabled()) return;
  const d = addEvent(currentDay(loadDay(), Date.now(), VERSION), e);
  storeDay(d); dirty = true;
  if (!timer) timer = setTimeout(() => { timer = null; void flushStats(); }, FLUSH_MS);
}

/** Progression atteinte (niveau de compte, campagne, Tour), ajoutée juste avant l'envoi. */
function progress() {
  const s = useGame.getState().save; if (!s) return null;
  let ch = 0;
  for (const id of Object.keys(STAGE_BY_ID)) if ((s.progress.campaign[progressKey('normal', id)]?.clears ?? 0) > 0) { const st = STAGE_BY_ID[id]; ch = Math.max(ch, st.chapter * 100 + st.index); }
  return { kind: 'progress' as const, lvl: s.profile.level, ch, tower: s.progress.tower.floor };
}

export async function flushStats() {
  if (!dirty || !enabled() || !sendAllowed()) return;
  const p = progress();
  const d = p ? addEvent(currentDay(loadDay(), Date.now(), VERSION), p) : currentDay(loadDay(), Date.now(), VERSION);
  storeDay(d); dirty = false;
  try { const m = await import('../cloud/statsCloud'); await m.sendDay(d); } catch { dirty = true; /* hors ligne : on réessaiera */ }
}

/** Démarrage : une session, une minute comptée par minute de jeu visible, envoi en arrière-plan. */
export function startStats() {
  if (typeof window === 'undefined') return;
  trackStat({ kind: 'session' });
  setInterval(() => { if (document.visibilityState === 'visible') trackStat({ kind: 'minute' }); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flushStats(); });
}

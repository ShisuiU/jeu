import { DEFAULT_PREFS, type PushPrefs } from '../game/notify';

// NOTIFICATIONS — ce que ce téléphone sait sans le serveur (choix du joueur, possibilité technique).
const KEY = 'aeonfall.push';
interface Local { on: boolean; prefs: PushPrefs }

export function localPush(): Local {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null') as Local | null; if (v) return { on: !!v.on, prefs: { ...DEFAULT_PREFS, ...v.prefs } }; } catch { /* */ }
  return { on: false, prefs: { ...DEFAULT_PREFS } };
}
export function saveLocal(v: Local) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* */ } }

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** 'ok' : possible ; 'ios-install' : sur iPhone, il faut d'abord installer le jeu ; 'no' : navigateur trop ancien. */
export function pushSupport(): 'ok' | 'ios-install' | 'no' {
  const has = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIOS() && !standalone()) return 'ios-install';
  return has ? 'ok' : 'no';
}
/** Notifications actives sur ce téléphone (choix du joueur et autorisation accordée). */
export const pushOn = () => localPush().on && typeof Notification !== 'undefined' && Notification.permission === 'granted';


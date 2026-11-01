import { create } from 'zustand';
import { play } from '../audio/sfx';

export type Route =
  | { name: 'home' }
  | { name: 'collection' }
  | { name: 'hero'; uid?: string; heroId: string }
  | { name: 'team' }
  | { name: 'inventory' }
  | { name: 'menu' }
  | { name: 'daily' }
  | { name: 'settings' }
  | { name: 'saves' }
  | { name: 'codex' };

export type Tab = 'home' | 'collection' | 'team' | 'inventory' | 'menu';

export interface Toast { id: number; text: string; kind?: 'info' | 'error' | 'ok'; action?: { label: string; run: () => void } }

interface UIState {
  stack: Route[];
  toasts: Toast[];
  push: (r: Route) => void;
  back: () => void;
  tab: (t: Tab) => void;
  toast: (text: string, kind?: Toast['kind'], action?: Toast['action'], ms?: number) => void;
  dismiss: (id: number) => void;
}

let tid = 0;
export const useUI = create<UIState>((set, get) => ({
  stack: [{ name: 'home' }],
  toasts: [],
  push: (r) => { play('open'); set({ stack: [...get().stack, r] }); },
  back: () => { play('back'); const s = get().stack; if (s.length > 1) set({ stack: s.slice(0, -1) }); },
  tab: (t) => { play('tap'); set({ stack: [{ name: t } as Route] }); },
  toast: (text, kind = 'info', action, ms = 2800) => {
    const id = ++tid;
    set({ toasts: [...get().toasts.slice(-2), { id, text, kind, action }] });
    if (kind === 'error') play('error');
    setTimeout(() => get().dismiss(id), action ? 12000 : ms);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Pour les modes pas encore développés : message honnête, pas de faux écran. */
export function comingSoon(feature: string, phase: number) {
  useUI.getState().toast(`${feature} — arrive en phase ${phase} du développement.`);
}

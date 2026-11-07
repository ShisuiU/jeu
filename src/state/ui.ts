import { create } from 'zustand';
import { play } from '../audio/sfx';
import type { BattleSpec } from '../game/modes';

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
  | { name: 'codex' }
  | { name: 'campaign' }
  | { name: 'summon' }
  | { name: 'mail' }
  | { name: 'gear'; gearUid?: string }
  | { name: 'sanctuary'; uid?: string }
  | { name: 'stage'; stageId: string }
  | { name: 'prep'; spec: BattleSpec }
  | { name: 'battle'; spec: BattleSpec; teamId: string; seed: number; guest?: import('../game/battle/types').UnitSetup }
  | { name: 'friends' }
  | { name: 'dungeons' }
  | { name: 'dungeon'; dungeonId: string }
  | { name: 'tower' }
  | { name: 'worldboss' }
  | { name: 'arena' }
  | { name: 'missions' }
  | { name: 'events' }
  | { name: 'combats' }
  | { name: 'expeditions' }
  | { name: 'market' }
  | { name: 'camp' }
  | { name: 'guild' }
  | { name: 'ranks'; tab?: 'arena' | 'tower' | 'boss' | 'power' }
  | { name: 'account'; mode?: 'register' };

export type Tab = 'home' | 'collection' | 'summon' | 'combats' | 'menu';

export interface Toast { id: number; text: string; kind?: 'info' | 'error' | 'ok'; action?: { label: string; run: () => void } }

interface UIState {
  stack: Route[];
  toasts: Toast[];
  push: (r: Route) => void;
  back: () => void;
  replace: (r: Route) => void;
  popTo: (name: Route['name']) => void;
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
  replace: (r) => set({ stack: [...get().stack.slice(0, -1), r] }),
  popTo: (name) => {
    const s = get().stack;
    const i = s.map((r) => r.name).lastIndexOf(name);
    set({ stack: i >= 0 ? s.slice(0, i + 1) : [s[0]] });
  },
  tab: (t) => { play('tap'); set({ stack: [{ name: t } as Route] }); },
  toast: (text, kind = 'info', action, ms = 2800) => {
    const id = ++tid;
    set({ toasts: [...get().toasts.slice(-2), { id, text, kind, action }] });
    if (kind === 'error') play('error');
    // Un message avec bouton reste un peu plus, mais jamais longtemps : il ne doit pas cacher l'écran.
    setTimeout(() => get().dismiss(id), action ? Math.max(ms, 4500) : ms);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Pour les modes pas encore développés : message honnête, pas de faux écran. */
export function comingSoon(feature: string, phase: number) {
  useUI.getState().toast(`${feature} : arrive en phase ${phase} du développement.`);
}

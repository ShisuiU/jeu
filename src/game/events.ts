import { BUNDLED_EVENTS, type GameEvent } from '../data/events';
import { BANNER_BY_ID } from '../data/summons';

// Registre des événements : liste intégrée, remplacée par public/events.json quand il est disponible.
let events: GameEvent[] = BUNDLED_EVENTS;
const LS_KEY = 'aeonfall.events';

function valid(e: unknown): e is GameEvent {
  const x = e as GameEvent;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && !isNaN(Date.parse(x.start)) && !isNaN(Date.parse(x.end));
}

export function setEvents(list: GameEvent[]) { events = list.filter(valid); }
export function getEvents() { return events; }
export function activeEvents(now: number): GameEvent[] {
  return events.filter((e) => Date.parse(e.start) <= now && now <= Date.parse(e.end));
}
export function dungeonBonus(now: number): number {
  return activeEvents(now).reduce((m, e) => Math.max(m, e.dungeonBonus ?? 1), 1);
}

/** Une bannière « vedette » n'est ouverte que pendant un événement qui la liste. */
export function bannerAvailable(id: string, now: number): boolean {
  const b = BANNER_BY_ID[id];
  if (!b) return false;
  if (!b.featured) return true;
  return activeEvents(now).some((e) => e.banners?.includes(id));
}

/** Charge les événements : d'abord le dernier fichier mémorisé, puis le réseau (sans cache). */
export async function loadEvents(baseUrl: string): Promise<'network' | 'cache' | 'bundled'> {
  let source: 'network' | 'cache' | 'bundled' = 'bundled';
  try {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) { const list = JSON.parse(cached); if (Array.isArray(list)) { setEvents(list); source = 'cache'; } }
  } catch { /* */ }
  try {
    const res = await fetch(`${baseUrl}events.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.events;
      if (Array.isArray(list)) {
        setEvents(list);
        try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* */ }
        source = 'network';
      }
    }
  } catch { /* hors ligne */ }
  return source;
}

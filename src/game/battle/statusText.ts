import type { StatusId } from '../../data/types';
import type { StatusInst } from './types';

// EFFETS EN CLAIR — la valeur d'un effet (pour la pastille sous la carte) et sa description (fiche de l'unité).
// Mêmes chiffres que le moteur (engine.ts) : poison 5 % des PV max par tour et par dose, brûlure 4 % (moitié sur un boss),
// gel +15 % de dégâts reçus, hausses et baisses de stats en %, bouclier en points de vie.
const pct = (v: number) => `${Math.round(v * 100)} %`;
const short = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}k` : String(Math.round(n)));

export interface StatusGroup { id: StatusId; turns: number; n: number; value: number; total: number }

/** Regroupe les effets d'une unité par type (doses de poison/brûlure cumulées, bouclier additionné). */
export function groupStatuses(list: StatusInst[]): StatusGroup[] {
  const m = new Map<StatusId, StatusGroup>();
  for (const st of list) {
    const g = m.get(st.status);
    if (g) { g.turns = Math.max(g.turns, st.turns); g.n += 1; g.value = Math.max(g.value, st.value); g.total += st.value; }
    else m.set(st.status, { id: st.status, turns: st.turns, n: 1, value: st.value, total: st.value });
  }
  return [...m.values()];
}

/** Valeur courte affichée dans la pastille (« +30 % », « −10 % », « 1,2k »…), ou '' si l'effet n'a pas de chiffre. */
export function statusValueText(g: StatusGroup, isBoss: boolean): string {
  switch (g.id) {
    case 'atkUp': case 'defUp': case 'spdUp': case 'regen': return g.value ? `+${pct(g.value)}` : '';
    case 'atkDown': case 'defDown': case 'spdDown': return g.value ? `−${pct(g.value)}` : '';
    case 'poison': return `−${pct(0.05 * g.n * (isBoss ? 0.5 : 1))}`;
    case 'burn': return `−${pct(0.04 * g.n * (isBoss ? 0.5 : 1))}`;
    case 'freeze': return '+15 %';
    case 'shield': return short(g.total);
    default: return '';
  }
}

/** Phrase complète pour la fiche de l'unité. */
export function statusDescription(g: StatusGroup, isBoss: boolean): string {
  const doses = g.n > 1 ? ` (${g.n} doses)` : '';
  switch (g.id) {
    case 'atkUp': return `Attaque +${pct(g.value)}.`;
    case 'defUp': return `Défense +${pct(g.value)}.`;
    case 'spdUp': return `Vitesse +${pct(g.value)} : joue plus souvent.`;
    case 'atkDown': return `Attaque −${pct(g.value)}.`;
    case 'defDown': return `Défense −${pct(g.value)} : encaisse plus de dégâts.`;
    case 'spdDown': return `Vitesse −${pct(g.value)} : joue moins souvent.`;
    case 'regen': return `Récupère ${pct(g.value)} de ses PV max à chaque tour.`;
    case 'poison': return `Perd ${pct(0.05 * g.n * (isBoss ? 0.5 : 1))} de ses PV max à chaque tour${doses}.`;
    case 'burn': return `Perd ${pct(0.04 * g.n * (isBoss ? 0.5 : 1))} de ses PV max à chaque tour${doses}.`;
    case 'freeze': return 'Gelé : passe son tour et reçoit +15 % de dégâts.';
    case 'stun': return 'Étourdi : passe son tour.';
    case 'taunt': return 'Provoqué : doit attaquer celui qui l’a provoqué.';
    case 'shield': return `Bouclier : absorbe encore ${Math.round(g.total)} points de dégâts.`;
    case 'revive': return 'Revient à la vie une fois s’il tombe.';
    default: return '';
  }
}

import { beginTurn, performAction } from './engine';
import { chooseAction } from './ai';
import type { BattleState } from './types';

/** Joue le combat jusqu'au bout en automatique. */
export function runToEnd(s: BattleState): BattleState {
  while (s.outcome === 'running') {
    const u = beginTurn(s);
    if (!u) break;
    performAction(s, chooseAction(s, u));
    s.events.length = 0;
  }
  return s;
}

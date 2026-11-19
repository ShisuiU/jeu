import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { claimExpedition, expeditionLoot, refreshExpeditions, startExpedition } from '../src/game/expeditions';
import { reforgeSub } from '../src/game/gear';

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);

// v1.116.0 : corrections issues de la chasse aux bugs (passe QA 2).
describe('corrections QA', () => {
  it('expédition : le butin est fixé au départ et versé tel quel, même si un héros progresse en route', () => {
    const s = createNewSave(NOW);
    const o = refreshExpeditions(s, NOW).offers[0];
    const team = s.heroes.slice(0, o.size).map((h) => h.uid);
    const announced = expeditionLoot(s, o, team).reward;
    expect(startExpedition(s, o.id, team, NOW).ok).toBe(true);
    expect(s.expeditions!.runs[0].loot).toEqual(announced);
    for (const h of s.heroes) { h.level = 60; h.rank = 6; h.ascension = 6; } // l'équipe devient bien plus forte pendant le trajet
    const r = claimExpedition(s, o.id, NOW + o.minutes * 60_000);
    expect(r.reward).toEqual(announced);
  });
  it('retouche : le message dit combien il manque', () => {
    const s = createNewSave(NOW);
    s.resources.gold = 8020; s.resources.forgeOre = 100;
    s.equipment.push({ uid: 'g1', slot: 'weapon', set: 'fury', rarity: 'rare', level: 0, main: 'atk', subs: [{ stat: 'hp', value: 100, rolls: 1 }], heroUid: null } as never);
    const r = reforgeSub(s, 'g1', 0, Math.random);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain((11980).toLocaleString('fr-FR'));
  });
});

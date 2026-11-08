import { describe, expect, it } from 'vitest';
import { autoLien, beginTurn, carapaceCharges, castLien, createBattle, lienReady, performAction } from '../src/game/battle/engine';
import { chooseAction } from '../src/game/battle/ai';
import { LIEN_MAX, LIEN_USES, type UnitSetup } from '../src/game/battle/types';
import { ENEMIES } from '../src/data/enemies';

const heroes: UnitSetup[] = ['aldric', 'brann', 'corvin', 'elowen'].map((id, i) => ({ kind: 'hero', refId: id, slot: i, level: 30, rank: 3, heroUid: id }));
const bossId = Object.keys(ENEMIES).find((k) => ENEMIES[k].boss)!;
const foes = (lv: number): UnitSetup[] => [{ kind: 'enemy', refId: bossId, slot: 1, level: lv, hpMult: 12 }];
/** Joue jusqu'au prochain tour d'un héros. */
const toHeroTurn = (s: ReturnType<typeof createBattle>) => { for (let i = 0; i < 200 && s.outcome === 'running'; i++) { const u = beginTurn(s); if (!u) return; if (u.side === 'ally') return; performAction(s, chooseAction(s, u)); } };

describe('Pouvoir du Lien', () => {
  it('la jauge se remplit en jouant, le pouvoir agit sans prendre le tour du héros, deux fois au plus', () => {
    const s = createBattle(heroes, [foes(30)], { seed: 3 });
    expect(s.lien).toBe(0);
    let uses = 0;
    for (let i = 0; i < 400 && s.outcome === 'running'; i++) {
      toHeroTurn(s);
      if (s.outcome !== 'running') break;
      if (lienReady(s)) {
        const who = s.activeId;
        expect(castLien(s, 'guard')).toBe(true);
        uses++;
        expect(s.lien).toBe(0);
        if (s.outcome === 'running') expect(s.activeId).toBe(who); // le héros joue toujours
      }
      const u = s.units.find((x) => x.id === s.activeId);
      if (u) performAction(s, chooseAction(s, u));
    }
    expect(uses).toBeGreaterThanOrEqual(1);
    expect(uses).toBeLessThanOrEqual(LIEN_USES);
  });
  it('soin : rend des PV à toute l’équipe ; frappe : blesse l’ennemi', () => {
    const s = createBattle(heroes, [foes(30)], { seed: 5 });
    toHeroTurn(s);
    for (const u of s.units.filter((x) => x.side === 'ally')) u.hp = Math.round(u.base.hp / 2);
    s.lien = LIEN_MAX;
    expect(autoLien(s)).toBe('heal');
    castLien(s, 'heal');
    for (const u of s.units.filter((x) => x.side === 'ally')) expect(u.hp).toBeGreaterThan(u.base.hp / 2);
    s.lien = LIEN_MAX;
    const boss = s.units.find((x) => x.side === 'enemy')!; const before = boss.hp;
    castLien(s, 'strike');
    expect(boss.hp).toBeLessThan(before);
  });
  it('désactivable, et absent des boss à score', () => {
    expect(createBattle(heroes, [foes(30)], { lien: false }).lien).toBe(-1);
    expect(createBattle(heroes, [foes(30)], { turnLimit: 45 }).mechanics).toBe(false);
  });
});

describe('Carapace des boss', () => {
  it('dès le niveau 20 : réduit les coups, se brise, puis rend le boss vulnérable', () => {
    expect(carapaceCharges(10)).toBe(0);
    expect(carapaceCharges(30)).toBe(3);
    const s = createBattle(heroes, [foes(30)], { seed: 9 });
    const boss = s.units.find((x) => x.side === 'enemy')!;
    expect(boss.flags.carapace).toBe(3);
    for (let i = 0; i < 300 && boss.flags.carapace > 0 && s.outcome === 'running'; i++) { const u = beginTurn(s); if (!u) break; performAction(s, chooseAction(s, u)); }
    expect(boss.flags.carapace).toBe(0);
    expect(boss.statuses.some((x) => x.status === 'defDown') || !boss.alive).toBe(true);
  });
});

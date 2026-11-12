import { describe, expect, it } from 'vitest';
import { createNewSave, createHeroInstance } from '../src/save/schema';
import { canSweep, sweep, refillEnergy, refillCost, autoEquip, recommendTeam } from '../src/game/comfort';
import { generateGear, seededRand } from '../src/game/gear';
import { heroTotalStats } from '../src/game/heroStats';
import { powerOf } from '../src/game/stats';
import { applyResets } from '../src/game/missions';
import { HERO_BY_ID } from '../src/data/heroes';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const fresh = () => { const s = createNewSave(NOW); s.time.highWater = NOW; applyResets(s, NOW); return s; };

describe('balayage', () => {
  it('réservé aux niveaux à 3 étoiles, coûte l’énergie, donne les récompenses', () => {
    const s = fresh();
    const spec = { mode: 'campaign' as const, stageId: '1-1', difficulty: 'normal' as const };
    expect(canSweep(s, spec).ok).toBe(false);
    s.progress.campaign['normal:1-1'] = { stars: 3, clears: 1 };
    const gold = s.resources.gold, energy = s.energy.current;
    const r = sweep(s, spec, s.teams[0].id, 5, NOW);
    expect(r.runs).toBe(5);
    expect(r.wins).toBeGreaterThanOrEqual(4);
    expect(s.energy.current).toBe(energy - 10);
    expect(s.resources.gold).toBeGreaterThan(gold);
    expect(s.missions.daily.counters.battleWin).toBe(r.wins);
  });
  it('s’arrête quand l’énergie manque', () => {
    const s = fresh();
    s.progress.campaign['normal:1-1'] = { stars: 3, clears: 1 };
    s.energy.current = 5;
    const r = sweep(s, { mode: 'campaign', stageId: '1-1', difficulty: 'normal' }, s.teams[0].id, 10, NOW);
    expect(r.runs).toBe(2);
    expect(r.stopReason).toMatch(/Énergie/);
  });
  it('donjon : étage déjà terminé seulement', () => {
    const s = fresh();
    const spec = { mode: 'dungeon' as const, dungeonId: 'warforge', floor: 1 };
    expect(canSweep(s, spec).ok).toBe(false);
    s.progress.dungeons.warforge = { bestFloor: 1 };
    expect(canSweep(s, spec).ok).toBe(true);
    expect(canSweep(s, { mode: 'tower', floor: 1 }).ok).toBe(false);
  });
});

describe('recharge d’énergie', () => {
  it('prix croissant, 3 par jour, renouvelé chaque jour', () => {
    const s = fresh();
    s.resources.diamonds = 1000;
    expect(refillCost(s)).toBe(10);
    const e = s.energy.current;
    expect(refillEnergy(s).ok).toBe(true);
    expect(s.energy.current).toBe(e + 60);
    expect(refillCost(s)).toBe(20);
    refillEnergy(s); refillEnergy(s);
    expect(refillEnergy(s).ok).toBe(false);
    expect(s.resources.diamonds).toBe(1000 - 70);
    applyResets(s, NOW + 86_400_000);
    expect(refillCost(s)).toBe(10);
  });
});

describe('équipement automatique et équipe recommandée', () => {
  it('équipe les objets libres sans voler les autres héros, et augmente la puissance', () => {
    const s = fresh();
    const [a, b] = s.heroes;
    const r = seededRand(3);
    for (const slot of ['weapon', 'helmet', 'armor', 'boots'] as const) s.equipment.push(generateGear(r, 'rare', NOW, slot));
    const taken = generateGear(r, 'legendary', NOW, 'gloves'); taken.heroUid = b.uid; s.equipment.push(taken);
    const p0 = powerOf(heroTotalStats(s, a).total);
    expect(autoEquip(s, a.uid)).toBe(4);
    expect(powerOf(heroTotalStats(s, a).total)).toBeGreaterThan(p0);
    expect(taken.heroUid).toBe(b.uid);
  });
  it('équipe recommandée : défenseur devant, soigneur derrière', () => {
    const s = fresh();
    for (const id of ['aldric', 'seraphine', 'idris', 'vaelshira']) s.heroes.push(createHeroInstance(id, NOW));
    const t = recommendTeam(s);
    const roleAt = (i: number) => HERO_BY_ID[s.heroes.find((h) => h.uid === t.slots[i])!.heroId].role;
    expect(t.slots.filter(Boolean)).toHaveLength(5);
    expect(roleAt(0)).toBe('defender');
    expect(roleAt(3)).toBe('healer');
    expect(t.slots).toContain(t.leader);
  });
});

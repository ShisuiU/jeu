import { describe, expect, it } from 'vitest';
import { createNewSave, type SaveData } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { exportSave, importSave } from '../src/save/exportImport';
import { summon } from '../src/game/summon';
import { seededRand, generateGear, upgradeGear, equipGear, dismantleGear } from '../src/game/gear';
import { useElixirs, rankUp, ascend, awaken, upgradeSkill } from '../src/game/upgrade';
import { applyMode, canStart, payMode, nextSpec, type BattleSpec } from '../src/game/modes';
import { applyResets, claimMission, claimBonus, claimAchievement, claimEventTask, track } from '../src/game/missions';
import { activeEvents, claimMilestone } from '../src/game/events';
import { giveCopy } from '../src/game/copies';
import { claimLoginDay } from '../src/game/loginEvent';
import { refreshExpeditions, startExpedition, claimExpedition } from '../src/game/expeditions';
import { autoEquip } from '../src/game/comfort';
import { claimDaily } from '../src/game/daily';
import { heroTotalStats } from '../src/game/heroStats';
import { powerOf } from '../src/game/stats';
import { DAILY_MISSIONS, WEEKLY_MISSIONS } from '../src/data/missions';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { BANNERS } from '../src/data/summons';
import { DUNGEONS } from '../src/data/dungeons';
import { CHAPTERS } from '../src/data/campaign';
import { BOSS_TIERS } from '../src/data/worldBoss';
import { HERO_BY_ID } from '../src/data/heroes';
import type { GearRarity } from '../src/data/equipment';

// TEST DE ROBUSTESSE — des milliers d'actions de joueur au hasard, sur plusieurs parties et plusieurs semaines
// de jeu simulées. Après chaque action : aucune ressource négative ou non numérique, aucune référence cassée,
// et la sauvegarde reste exportable / réimportable à l'identique.

const H = 3600 * 1000;

function check(s: SaveData, where: string) {
  for (const [k, v] of Object.entries(s.resources)) {
    expect(Number.isFinite(v), `${where} : ressource ${k} = ${v}`).toBe(true);
    expect(v, `${where} : ressource ${k} négative`).toBeGreaterThanOrEqual(0);
  }
  for (const [k, v] of Object.entries(s.heroCopies)) expect(Number.isFinite(v) && v >= 0, `${where} : doublons ${k} = ${v}`).toBe(true);
  expect(Number.isFinite(s.energy.current) && s.energy.current >= 0, `${where} : énergie ${s.energy.current}`).toBe(true);
  const uids = new Set(s.heroes.map((h) => h.uid));
  expect(uids.size, `${where} : héros en double (uid)`).toBe(s.heroes.length);
  expect(new Set(s.heroes.map((h) => h.heroId)).size, `${where} : même héros possédé deux fois`).toBe(s.heroes.length);
  for (const h of s.heroes) {
    expect(HERO_BY_ID[h.heroId], `${where} : héros inconnu ${h.heroId}`).toBeTruthy();
    expect(Number.isFinite(powerOf(heroTotalStats(s, h).total)), `${where} : puissance de ${h.heroId}`).toBe(true);
  }
  for (const g of s.equipment) if (g.heroUid) expect(uids.has(g.heroUid), `${where} : équipement sur un héros absent`).toBe(true);
  for (const t of s.teams) for (const u of t.slots) if (u) expect(uids.has(u), `${where} : équipe vers un héros absent`).toBe(true);
}

function play(seed: number, steps: number, poor = false) {
  const r = seededRand(seed);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  let now = new Date(2026, 10, 6, 10).getTime();
  const s = createNewSave(now);
  s.time.highWater = now;
  // Une partie plutôt riche, pour que les actions aboutissent souvent.
  // v1.102.0 : plus de cristaux d'Aeon (convertis au chargement) : le joueur riche n'en a pas.
  if (!poor) for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = k === 'crystals' ? 0 : 2000 + Math.floor(r() * 50_000);
  const log: string[] = [];
  const actions: [string, () => void][] = [
    ['invocation', () => { const b = pick(BANNERS); summon(s, b.id, r() < 0.3 ? 10 : 1, r, now); }],
    ['élixirs', () => { const h = pick(s.heroes); useElixirs(s, h.uid, 1 + Math.floor(r() * 30)); }],
    ['rang', () => rankUp(s, pick(s.heroes).uid)],
    ['ascension', () => ascend(s, pick(s.heroes).uid)],
    ['éveil', () => awaken(s, pick(s.heroes).uid)],
    ['compétence', () => { const h = pick(s.heroes); upgradeSkill(s, h.uid, pick(HERO_BY_ID[h.heroId].skills).id); }],
    ['doublon → lien', () => { const ids = Object.keys(s.heroCopies).filter((k) => s.heroCopies[k] > 0); if (ids.length) giveCopy(s, pick(ids), r() < 0.5 ? 'faction' : 'affinity'); }],
    ['nouvel équipement', () => { if (s.equipment.length < 200) s.equipment.push(generateGear(r, pick(['common', 'rare', 'epic', 'legendary'] as GearRarity[]), now)); }],
    ['forge', () => { if (s.equipment.length) upgradeGear(s, pick(s.equipment).uid, r); }],
    ['équiper', () => { if (s.equipment.length) equipGear(s, pick(s.equipment).uid, pick(s.heroes).uid); }],
    ['démonter', () => { const free = s.equipment.filter((g) => !g.heroUid); if (free.length) dismantleGear(s, pick(free).uid); }],
    ['équiper auto', () => autoEquip(s, pick(s.heroes).uid)],
    ['combat', () => {
      const specs: BattleSpec[] = [
        { mode: 'campaign', stageId: pick(CHAPTERS.slice(0, 3)).stages[Math.floor(r() * 10)].id, difficulty: 'normal' },
        { mode: 'dungeon', dungeonId: pick(DUNGEONS).id, floor: 1 + Math.floor(r() * 10) },
        { mode: 'tower', floor: s.progress.tower.floor + 1 },
        { mode: 'worldboss', tier: pick(BOSS_TIERS).id },
        ...(s.arena.opponents[0] ? [{ mode: 'arena' as const, opponentId: pick(s.arena.opponents).id }] : []),
        ...activeEvents(now).filter((e) => e.cycle).map((e) => ({ mode: 'challenge' as const, eventId: e.id, trial: s.events[e.id]?.trials ?? 0 })),
      ];
      const spec = pick(specs);
      if (!canStart(s, spec).ok || !payMode(s, spec, now).ok) return;
      const team = s.teams.find((t) => t.id === s.activeTeamId)!;
      const participants = team.slots.filter((u): u is string => !!u);
      applyMode(s, spec, { won: r() < 0.7, alliesDead: Math.floor(r() * 3), participants, bossDamage: { dealt: r() * 1e6, max: 1e6 } }, now);
      nextSpec(s, spec);
    }],
    ['expédition', () => {
      const ex = refreshExpeditions(s, now);
      const free = ex.offers.filter((o) => !ex.done.includes(o.id) && !ex.runs.some((x) => x.offerId === o.id));
      if (free.length) { const o = pick(free); startExpedition(s, o.id, s.heroes.slice(0, o.size).map((h) => h.uid), now); }
      for (const run of [...ex.runs]) claimExpedition(s, run.offerId, now);
    }],
    ['missions', () => {
      for (const m of DAILY_MISSIONS) claimMission(s, 'daily', m.id);
      for (const m of WEEKLY_MISSIONS) claimMission(s, 'weekly', m.id);
      claimBonus(s, 'daily'); claimBonus(s, 'weekly');
      for (const a of ACHIEVEMENTS) claimAchievement(s, a.id);
    }],
    ['événements', () => {
      for (const e of activeEvents(now)) {
        for (const t of e.tasks ?? []) claimEventTask(s, e.id, t.id);
        (e.cycle?.milestones ?? []).forEach((_, i) => claimMilestone(s, e.id, i, now));
        if (e.login) claimLoginDay(s, e.id, now);
      }
    }],
    ['connexion du jour', () => claimDaily(s, now)],
    ['actions suivies', () => track(s, pick(['battleWin', 'summon', 'gearUpgrade', 'expedition', 'heroUpgrade', 'dungeonWin'] as const), 1 + Math.floor(r() * 5))],
    ['le temps passe', () => { now += Math.floor(r() * 20 * H); s.time.highWater = now; applyResets(s, now); }],
  ];
  for (let i = 0; i < steps; i++) {
    const [name, fn] = pick(actions);
    log.push(name);
    try { fn(); } catch (e) { throw new Error(`Partie ${seed}, action ${i} « ${name} » : ${(e as Error).message}\n${log.slice(-8).join(' → ')}`); }
    check(s, `partie ${seed}, action ${i} (${name})`);
  }
  return s;
}

describe('robustesse : parties jouées au hasard', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    it(`partie ${seed} : 1 500 actions sans incohérence, sauvegarde intacte`, () => {
      const s = play(seed, 1500);
      const again = importSave(exportSave(s));
      expect(again.heroes.length).toBe(s.heroes.length);
      expect(again.resources).toEqual(s.resources);
      expect(migrateSave(JSON.parse(JSON.stringify(s))).heroCopies).toEqual(s.heroCopies);
      // Le robot a vraiment joué : des héros invoqués, des combats gagnés, des doublons utilisés.
      expect(s.heroes.length).toBeGreaterThan(8);
      expect(s.stats.battlesWon).toBeGreaterThan(10);
      expect(Object.values(s.bonds.faction).concat(Object.values(s.bonds.affinity)).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    });
  }
  for (const seed of [11, 12, 13]) {
    it(`partie modeste ${seed} (ressources de départ) : 2 000 actions sans incohérence`, () => {
      const s = play(seed, 2000, true);
      expect(s.stats.battlesWon).toBeGreaterThan(5);
    });
  }
});

import { affinityModifier } from '../../data/affinities';
import { HERO_BY_ID } from '../../data/heroes';
import { nextRandom } from '../../core/rng';
import type { SkillDef, SkillEffect, StatId, StatusId, TargetId } from '../../data/types';
import { buildUnit } from './setup';
import { effectiveCooldown, skillMods, type SkillMods } from './skillMods';
import { BUFFS, DEBUFFS, LIEN_MAX, LIEN_USES, type Action, type BattleState, type LienPower, type Unit, type UnitSetup } from './types';

// MOTEUR DE COMBAT — tour par tour à jauge de vitesse.
// Chaque unité remplit sa jauge (TM) proportionnellement à sa vitesse ; la première à 1000 agit.
// Le moteur est pur TypeScript (aucune dépendance à l'interface) et déterministe (graine aléatoire).

const TM_FULL = 1000;
const DEF_K = 600;
const MAX_ACTIONS = 1500;

// ─── Utilitaires ───
export function rand(s: BattleState): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return v;
}

export const unitById = (s: BattleState, id: string) => s.units.find((u) => u.id === id)!;
const alliesOf = (s: BattleState, u: Unit) => s.units.filter((x) => x.side === u.side && x.alive);
const enemiesOf = (s: BattleState, u: Unit) => s.units.filter((x) => x.side !== u.side && x.alive);
const hasStatus = (u: Unit, st: StatusId) => u.statuses.some((x) => x.status === st);
const statusValue = (u: Unit, st: StatusId) => u.statuses.filter((x) => x.status === st).reduce((m, x) => Math.max(m, x.value), 0);
const hasSkill = (u: Unit, id: string) => u.skills.some((s) => s.id === id);

/** Statistique effective (base + effets en cours + bonus dynamiques). */
/** Fureur du temps : à partir de son 31ᵉ tour, un boss gagne +10 % d'ATQ par tour. */
const BOSS_FURY_TURN = 30;
const BOSS_FURY_STEP = 0.1;

export function eff(s: BattleState, u: Unit, stat: StatId): number {
  let v = u.base[stat];
  if (stat === 'atk') {
    v *= 1 + statusValue(u, 'atkUp') - statusValue(u, 'atkDown');
    if (u.flags.fury) v *= 1 + 0.05 * u.flags.fury;
    if (u.flags.crown) v *= 1 + (0.1 + (u.flags.crownBonus ?? 0)) * u.flags.crown;
    if (u.isBoss && u.flags.enraged) v *= 1.3;
    // Fureur du temps (v1.87.0) : un boss qui dure devient de plus en plus dangereux (casse les équipes de soin infini).
    if (u.isBoss && u.side === 'enemy' && (u.flags.bossActs ?? 0) > BOSS_FURY_TURN) v *= 1 + BOSS_FURY_STEP * ((u.flags.bossActs ?? 0) - BOSS_FURY_TURN);
  } else if (stat === 'def') {
    v *= 1 + statusValue(u, 'defUp') - statusValue(u, 'defDown');
  } else if (stat === 'spd') {
    v *= 1 + statusValue(u, 'spdUp') - statusValue(u, 'spdDown');
  }
  void s;
  return Math.max(1, v);
}

export const hpPct = (u: Unit) => u.hp / u.base.hp;
export const shieldOf = (u: Unit) => u.statuses.filter((x) => x.status === 'shield').reduce((a, x) => a + x.value, 0);

// ─── Création ───
export interface BattleOptions {
  leaderUid?: string | null;
  seed?: number;
  turnLimit?: number;
  /** Mécaniques de boss ; par défaut : oui, sauf pour les combats à nombre d'actions limité (boss à score). */
  mechanics?: boolean;
  /** Pouvoir du Lien (par défaut : oui). */
  lien?: boolean;
}

// ─── Mécaniques de boss ───
/** Carapace (boss de niveau 20 et plus, 3 charges) : −30 % de dégâts ; chaque coup retire une charge.
 *  Brisée, elle laisse le boss vulnérable (−30 % DÉF, 2 tours) et se reforme 8 tours plus tard. */
export const carapaceCharges = (level: number) => (level >= 20 ? 3 : 0);
export const CARAPACE_REFORM = 8, CARAPACE_CUT = 0.3;
/** Jauge du Lien : +5 par action d'un héros, +5 par ennemi vaincu ; deux pouvoirs par combat au plus. */
export const LIEN_PER_ACTION = 5, LIEN_PER_KILL = 5;

export function createBattle(allies: UnitSetup[], waves: UnitSetup[][], opts: BattleOptions = {}): BattleState {
  const units = allies.map((a, i) => buildUnit(a, 'ally', i));
  const heroes = units.filter((u) => u.kind === 'hero');
  const count = (f: string) => heroes.filter((u) => u.faction === f).length;

  // Aura du chef
  const leader = heroes.find((u) => u.heroUid && u.heroUid === opts.leaderUid);
  const ls = leader ? HERO_BY_ID[leader.refId].leaderSkill : undefined;
  if (ls) {
    for (const u of heroes) {
      if (ls.scope === 'all' || ls.scope === u.faction || ls.scope === u.affinity) {
        // Les critiques partent de 0 % : l'aura les augmente en points (+11 % = +11 points), les autres statistiques en pourcentage.
        if (ls.stat === 'critRate') u.base.critRate = Math.min(100, u.base.critRate + Math.round(ls.pct * 100));
        else if (ls.stat === 'critDmg') u.base.critDmg += Math.round(ls.pct * 100);
        else u.base[ls.stat] = Math.round(u.base[ls.stat] * (1 + ls.pct));
      }
    }
  }
  // Synergies de faction (statiques)
  if (count('valcrest') >= 3) heroes.filter((u) => u.faction === 'valcrest').forEach((u) => (u.base.def = Math.round(u.base.def * 1.15)));
  const prism = count('prism');
  if (prism >= 2) heroes.filter((u) => u.faction === 'prism').forEach((u) => (u.base.spd += 4 * (prism - 1)));

  const s: BattleState = {
    rng: (opts.seed ?? Date.now()) >>> 0,
    units,
    pendingWaves: waves.slice(1),
    wave: 1,
    totalWaves: waves.length,
    actionCount: 0,
    activeId: null,
    extraTurn: null,
    outcome: 'running',
    events: [],
    statusSeq: 0,
    synergy: { ash: count('ash') > 0, sylvaran: count('sylvaran') > 0, astral: count('astral') > 0, akkar: count('akkar') > 0 },
    enemyLevelMult: 1,
    turnLimit: opts.turnLimit,
    lien: opts.lien === false ? -1 : 0,
    lienUsed: 0,
    mechanics: opts.mechanics ?? !opts.turnLimit,
  };
  spawnWave(s, waves[0]);
  // Petite dispersion initiale des jauges pour éviter les égalités parfaites.
  for (const u of s.units) u.tm = rand(s) * 150 + ((u.flags.setStartTm ?? 0) / 100) * TM_FULL; // ensemble Élan
  return s;
}

function spawnWave(s: BattleState, wave: UnitSetup[]) {
  s.units = s.units.filter((u) => u.side === 'ally');
  wave.forEach((w, i) => {
    const u = buildUnit(w, 'enemy', s.wave * 10 + i);
    u.tm = rand(s) * 100;
    if (s.mechanics && u.isBoss) { const c = carapaceCharges(u.level); if (c) { u.flags.carapace = c; u.flags.carapaceMax = c; } }
    s.units.push(u);
  });
}

// ─── Effets de statut ───
function addStatus(s: BattleState, target: Unit, status: StatusId, turns: number, value: number, source: Unit) {
  if (!target.alive) return;
  let t = turns;
  // Synergie Astrale : les effets bénéfiques posés par un héros Astral durent un tour de plus.
  if (source.faction === 'astral' && source.side === 'ally' && !DEBUFFS.includes(status)) t += 1;
  if (status === 'poison' || status === 'burn') {
    const same = target.statuses.filter((x) => x.status === status);
    if (same.length >= 5) same[0].turns = Math.max(same[0].turns, t);
    else target.statuses.push({ uid: ++s.statusSeq, status, turns: t, value, sourceId: source.id, appliedAt: s.actionCount });
  } else {
    const ex = target.statuses.find((x) => x.status === status && (status !== 'shield'));
    if (ex) { ex.turns = Math.max(ex.turns, t); ex.value = Math.max(ex.value, value); ex.sourceId = source.id; ex.appliedAt = s.actionCount; }
    else target.statuses.push({ uid: ++s.statusSeq, status, turns: t, value, sourceId: source.id, appliedAt: s.actionCount });
  }
  s.events.push(status === 'shield' ? { kind: 'shield', target: target.id, amount: Math.round(value) } : { kind: 'status', target: target.id, status, turns: t });
}

function isImmune(target: Unit, status: StatusId): boolean {
  if (target.isBoss && (status === 'stun' || status === 'freeze')) return true;
  if (status === 'stun' && hasSkill(target, 'azhar_4')) return true;
  return false;
}

/** Tente d'appliquer un effet néfaste : chance de base, puis résistance de la cible contre la précision de la source. */
function tryDebuff(s: BattleState, source: Unit, target: Unit, status: StatusId, chance: number, turns: number, value: number) {
  if (!target.alive) return;
  if (rand(s) > chance) return;
  if (isImmune(target, status)) { s.events.push({ kind: 'resist', target: target.id, status, immune: true }); return; }
  const resist = Math.min(0.8, Math.max(0, (eff(s, target, 'res') - eff(s, source, 'acc')) / 200));
  if (rand(s) < resist) { s.events.push({ kind: 'resist', target: target.id, status }); return; }
  addStatus(s, target, status, turns, value, source);
}

function cleanse(s: BattleState, u: Unit) {
  const before = u.statuses.length;
  u.statuses = u.statuses.filter((x) => !DEBUFFS.includes(x.status));
  if (u.statuses.length !== before) s.events.push({ kind: 'cleanse', target: u.id });
}

// ─── Dégâts, soins, mort ───
function heal(s: BattleState, target: Unit, amount: number) {
  if (!target.alive || amount <= 0) return;
  let a = amount;
  if (s.synergy.sylvaran && target.side === 'ally') a *= 1.15;
  const real = Math.min(target.base.hp - target.hp, Math.round(a));
  target.hp += real;
  s.events.push({ kind: 'heal', target: target.id, amount: real });
}

function kill(s: BattleState, target: Unit, killer: Unit | null) {
  // Passif de Varkhaal : survit une fois par combat.
  if (hasSkill(target, 'varkhaal_3') && !target.flags.undyingUsed) {
    target.flags.undyingUsed = 1;
    target.hp = 1;
    s.events.push({ kind: 'undying', target: target.id });
    addStatus(s, target, 'shield', 2, target.base.hp * (0.25 + skillMods(target.skills.find((x) => x.id === 'varkhaal_3')!, target.skillLevels.varkhaal_3 ?? 1).shield), target);
    return;
  }
  target.alive = false;
  target.hp = 0;
  target.statuses = [];
  target.tm = 0;
  s.events.push({ kind: 'death', target: target.id });
  if (!killer) return;
  if (killer.side === 'ally' && target.side === 'enemy' && s.lien >= 0 && s.lienUsed < LIEN_USES) s.lien = Math.min(LIEN_MAX, s.lien + LIEN_PER_KILL);
  // Synergie d'Akkar : chaque ennemi vaincu augmente l'attaque des héros d'Akkar.
  if (killer.side === 'ally' && s.synergy.akkar) {
    for (const a of alliesOf(s, killer)) if (a.faction === 'akkar') a.flags.fury = Math.min(5, (a.flags.fury ?? 0) + 1);
  }
  if (hasSkill(killer, 'azhar_4')) {
    killer.flags.crown = Math.min(5, (killer.flags.crown ?? 0) + 1);
    killer.flags.crownBonus = skillMods(killer.skills.find((x) => x.id === 'azhar_4')!, killer.skillLevels.azhar_4 ?? 1).stack;
  }
}

function dealDamage(s: BattleState, source: Unit, target: Unit, effect: Extract<SkillEffect, { kind: 'damage' }>, mods: SkillMods, skill: SkillDef, single: boolean): number {
  const scaling = effect.scaling === 'def' ? eff(s, source, 'def') : effect.scaling === 'hp' ? source.base.hp : eff(s, source, 'atk');
  let dmg = scaling * effect.mult * (1 + mods.dmg);
  const def = eff(s, target, 'def') * (1 - (effect.ignoreDefPct ?? 0));
  dmg *= DEF_K / (DEF_K + def);
  const aff = affinityModifier(source.affinity, target.affinity);
  dmg *= aff;
  const crit = rand(s) * 100 < eff(s, source, 'critRate');
  if (crit) dmg *= 1 + eff(s, source, 'critDmg') / 100;
  dmg *= 0.95 + rand(s) * 0.1;
  if (hasStatus(target, 'freeze')) dmg *= 1.15;
  // Formation : la seconde ligne est protégée tant qu'un allié tient la première ligne.
  if (single && target.slot >= 3 && alliesOf(s, target).some((a) => a.slot < 3)) dmg *= 0.85;
  if (source.faction === 'ash' && source.side === 'ally' && s.synergy.ash) dmg *= 1 + 0.3 * (1 - hpPct(source));
  if ((skill.id === 'sulfura_3' || skill.id === 'nerissa_3') && hasStatus(target, 'burn')) dmg *= 1.5;
  // Combos : une cible déjà affaiblie par un allié encaisse plus ; achèvement des cibles presque à terre.
  let combo = false;
  if (effect.bonusVs?.some((st) => hasStatus(target, st))) { dmg *= 1 + (effect.bonusPct ?? 0.5); combo = true; }
  if (effect.executeBelow && hpPct(target) < effect.executeBelow) { dmg *= 1.5; combo = true; }
  // Rôles (v1.87.0, audit E-2) : les assassins achèvent (+25 % sous 50 % de PV), les attaquants frappent plus fort de base.
  if (source.role === 'assassin' && hpPct(target) < 0.5) dmg *= 1.25;
  if (source.role === 'attacker' && skill.slot === 'basic') dmg *= 1.1;
  // Carapace : dégâts réduits, une charge en moins par coup.
  let broke = false;
  if (target.flags.carapace > 0) {
    dmg *= 1 - CARAPACE_CUT;
    target.flags.carapace -= 1;
    if (target.flags.carapace === 0) { broke = true; target.flags.carapaceBrokeAt = target.flags.bossTurns ?? 0; }
  }
  dmg = Math.max(1, Math.round(dmg));

  // Bouclier
  let absorbed = 0;
  for (const sh of target.statuses.filter((x) => x.status === 'shield')) {
    const take = Math.min(sh.value, dmg - absorbed);
    sh.value -= take;
    absorbed += take;
    if (absorbed >= dmg) break;
  }
  target.statuses = target.statuses.filter((x) => x.status !== 'shield' || x.value > 0);
  const hpDmg = dmg - absorbed;
  // Récap de fin de combat : dégâts réellement encaissés (bouclier compris, sans l'excédent au-delà des PV restants).
  source.flags.dmgDealt = (source.flags.dmgDealt ?? 0) + absorbed + Math.min(hpDmg, Math.max(0, target.hp));
  target.hp -= hpDmg;
  s.events.push({ kind: 'damage', source: source.id, target: target.id, amount: dmg, crit, strong: aff > 1, weak: aff < 1, absorbed, ...(combo ? { combo } : {}) });
  if (target.flags.carapaceMax && !broke && target.flags.carapace > 0) s.events.push({ kind: 'carapace', target: target.id, charges: target.flags.carapace });
  if (broke && target.alive && target.hp > 0) {
    s.events.push({ kind: 'carapace', target: target.id, charges: 0, broken: true });
    addStatus(s, target, 'defDown', 2, 0.3, source);
  }
  // Boss sous la moitié de ses PV : il enrage (+30 % ATQ), et le joueur le voit.
  if (target.isBoss && !target.flags.enraged && hpPct(target) < 0.5 && target.hp > 0) { target.flags.enraged = 1; s.events.push({ kind: 'rage', target: target.id }); }
  if (target.hp <= 0) kill(s, target, source);
  const ls = (effect.lifestealPct ?? 0) + mods.lifesteal + (source.flags.leech ?? 0) / 100;
  if (ls > 0 && source.alive) heal(s, source, hpDmg * ls);
  return hpDmg;
}

// ─── Ciblage ───
export type TargetKind = 'enemy' | 'ally' | 'none';

/** Quel type de cible le joueur doit choisir pour cette compétence. */
export function targetKind(skill: SkillDef): TargetKind {
  for (const e of skill.effects) {
    if (e.target === 'enemy') return 'enemy';
    if (e.target === 'ally') return 'ally';
  }
  return 'none';
}

export function validTargets(s: BattleState, actor: Unit, skill: SkillDef): Unit[] {
  const k = targetKind(skill);
  if (k === 'none') return [];
  if (k === 'ally') return alliesOf(s, actor);
  const enemies = enemiesOf(s, actor);
  const taunt = actor.statuses.find((x) => x.status === 'taunt');
  if (taunt) {
    const t = enemies.find((e) => e.id === taunt.sourceId);
    if (t) return [t];
  }
  return enemies;
}

function resolveTargets(s: BattleState, actor: Unit, t: TargetId, primary: Unit | undefined): Unit[] {
  switch (t) {
    case 'enemy': return primary && primary.alive && primary.side !== actor.side ? [primary] : enemiesOf(s, actor).slice(0, 1);
    case 'ally': return primary && primary.alive && primary.side === actor.side ? [primary] : [actor];
    case 'self': return [actor];
    case 'allEnemies': return enemiesOf(s, actor);
    case 'allAllies': return alliesOf(s, actor);
    case 'lowestAlly': return alliesOf(s, actor).sort((a, b) => hpPct(a) - hpPct(b)).slice(0, 1);
    case 'randomEnemies': { const e = enemiesOf(s, actor); return e.length ? [e[Math.floor(rand(s) * e.length)]] : []; }
  }
}

// ─── Déroulement des tours ───
export function availableSkills(u: Unit): SkillDef[] {
  return u.skills.filter((sk) => sk.slot !== 'passive' && (u.cooldowns[sk.id] ?? 0) <= 0);
}

function endCheck(s: BattleState) {
  if (!s.units.some((u) => u.side === 'ally' && u.alive)) { s.outcome = 'lost'; s.activeId = null; return; }
  if (!s.units.some((u) => u.side === 'enemy' && u.alive)) {
    if (s.pendingWaves.length) {
      s.wave += 1;
      spawnWave(s, s.pendingWaves.shift()!);
      s.events.push({ kind: 'wave', wave: s.wave });
    } else { s.outcome = 'won'; s.activeId = null; }
  }
  if (s.outcome === 'running' && s.turnLimit && s.actionCount >= s.turnLimit) { s.outcome = 'timeout'; s.activeId = null; }
  if (s.actionCount > MAX_ACTIONS && s.outcome === 'running') { s.outcome = 'lost'; s.activeId = null; }
}

function pickNextActor(s: BattleState): Unit {
  if (s.extraTurn) {
    const u = s.units.find((x) => x.id === s.extraTurn && x.alive);
    s.extraTurn = null;
    if (u) return u;
  }
  const alive = s.units.filter((u) => u.alive);
  let best = alive[0];
  let bestT = Infinity;
  for (const u of alive) {
    const t = Math.max(0, TM_FULL - u.tm) / eff(s, u, 'spd');
    if (t < bestT || (t === bestT && u.tm > best.tm)) { bestT = t; best = u; }
  }
  for (const u of alive) u.tm += eff(s, u, 'spd') * bestT;
  best.tm = 0;
  return best;
}

/** Décompte des effets à la fin du tour d'une unité. */
function endTurn(s: BattleState, u: Unit) {
  for (const st of u.statuses) if (st.appliedAt !== s.actionCount || st.status === 'stun' || st.status === 'freeze') st.turns -= 1;
  u.statuses = u.statuses.filter((x) => x.turns > 0);
  s.actionCount += 1;
}

/**
 * Avance jusqu'à la prochaine unité capable d'agir (gère poisons, brûlures, régénération, étourdissements).
 * Après l'appel : s.activeId = unité qui doit agir, ou combat terminé.
 */
export function beginTurn(s: BattleState): Unit | null {
  while (s.outcome === 'running') {
    const u = pickNextActor(s);
    s.events.push({ kind: 'turn', source: u.id });
    for (const k of Object.keys(u.cooldowns)) if (u.cooldowns[k] > 0) u.cooldowns[k] -= 1;
    // Effets de début de tour
    for (const st of [...u.statuses]) {
      if (!u.alive) break;
      if (st.status === 'poison' || st.status === 'burn') {
        const pct = st.status === 'poison' ? 0.05 : 0.04;
        const src = s.units.find((x) => x.id === st.sourceId);
        let amount = Math.max(1, Math.round(u.base.hp * pct * (u.isBoss ? 0.5 : 1)));
        if (u.flags.dotCap) amount = Math.min(amount, Math.round((src ? eff(s, src, 'atk') : 1000) * 1.5));
        if (src) src.flags.dmgDealt = (src.flags.dmgDealt ?? 0) + Math.min(amount, Math.max(0, u.hp));
        u.hp -= amount;
        s.events.push({ kind: 'dot', target: u.id, amount, status: st.status });
        if (u.hp <= 0) kill(s, u, src ?? null);
      } else if (st.status === 'regen') {
        heal(s, u, u.base.hp * st.value);
      }
    }
    if (u.alive && u.isBoss && u.side === 'enemy') {
      u.flags.bossActs = (u.flags.bossActs ?? 0) + 1;
      if (u.flags.bossActs === BOSS_FURY_TURN + 1) s.events.push({ kind: 'rage', target: u.id });
    }
    // Boss : la Carapace brisée se reforme.
    if (u.alive && s.mechanics && u.isBoss && u.side === 'enemy') {
      u.flags.bossTurns = (u.flags.bossTurns ?? 0) + 1;
      if (u.flags.carapaceMax && !u.flags.carapace && u.flags.bossTurns - (u.flags.carapaceBrokeAt ?? 0) >= CARAPACE_REFORM) {
        u.flags.carapace = u.flags.carapaceMax;
        s.events.push({ kind: 'carapace', target: u.id, charges: u.flags.carapace, reformed: true });
      }
    }
    // Ensemble Pérennité : soin au début de chaque tour.
    if (u.alive && u.flags.setRegen && u.hp < u.base.hp) heal(s, u, (u.base.hp * u.flags.setRegen) / 100);
    // Passif d'Hesper : perturbe la jauge d'un ennemi.
    if (u.alive && hasSkill(u, 'hesper_3')) {
      const sk = u.skills.find((x) => x.id === 'hesper_3')!;
      if (rand(s) < 0.15 + skillMods(sk, u.skillLevels.hesper_3 ?? 1).chance) {
        const e = resolveTargets(s, u, 'randomEnemies', undefined)[0];
        if (e) applyTm(s, u, e, -0.15);
      }
    }
    endCheck(s);
    if (s.outcome !== 'running') return null;
    if (!u.alive) { s.actionCount += 1; continue; }
    const cc = u.statuses.find((x) => x.status === 'stun' || x.status === 'freeze');
    if (cc) {
      s.events.push({ kind: 'skip', target: u.id, status: cc.status });
      endTurn(s, u);
      continue;
    }
    s.activeId = u.id;
    return u;
  }
  return null;
}

function applyTm(s: BattleState, source: Unit, target: Unit, delta: number) {
  if (!target.alive) return;
  let d = delta;
  if (d < 0 && target.side !== source.side) {
    const resist = Math.min(0.8, Math.max(0, (eff(s, target, 'res') - eff(s, source, 'acc')) / 200));
    if (rand(s) < resist) { s.events.push({ kind: 'resist', target: target.id }); return; }
    if (target.isBoss) d /= 2;
  }
  target.tm = Math.max(0, target.tm + d * TM_FULL);
  s.events.push({ kind: 'tm', target: target.id, delta: d });
}

/** Exécute l'action de l'unité active puis termine son tour. */
export function performAction(s: BattleState, action: Action): void {
  const actor = s.activeId ? unitById(s, s.activeId) : null;
  if (!actor || s.outcome !== 'running') return;
  const skill = actor.skills.find((x) => x.id === action.skillId && x.slot !== 'passive') ?? actor.skills[0];
  const level = actor.skillLevels[skill.id] ?? 1;
  const mods = skillMods(skill, level);
  const valid = validTargets(s, actor, skill);
  let primary = action.targetId ? s.units.find((u) => u.id === action.targetId) : undefined;
  if (valid.length && (!primary || !valid.includes(primary))) primary = valid[0];

  const shown = targetKind(skill) === 'none' ? [] : primary ? [primary.id] : [];
  s.events.push({ kind: 'skill', source: actor.id, skillId: skill.id, name: skill.name, targets: shown });
  actor.cooldowns[skill.id] = effectiveCooldown(skill, level);

  let killed = false;
  for (const e of skill.effects) {
    if (!actor.alive) break;
    const targets = resolveTargets(s, actor, e.target, primary);
    switch (e.kind) {
      case 'damage':
        for (const t of targets) {
          for (let h = 0; h < (e.hits ?? 1); h++) {
            if (!t.alive) break;
            dealDamage(s, actor, t, e, mods, skill, e.target === 'enemy');
            if (!t.alive) killed = true;
          }
        }
        break;
      case 'status':
        for (const t of targets) {
          const debuff = DEBUFFS.includes(e.status);
          if (debuff && t.side !== actor.side) tryDebuff(s, actor, t, e.status, Math.min(1, e.chance + mods.chance), e.turns, e.value ?? 0);
          else if (rand(s) <= e.chance + mods.chance) addStatus(s, t, e.status, e.turns, e.value ?? 0, actor);
        }
        break;
      case 'heal':
        for (const t of targets) heal(s, t, t.base.hp * e.pctMaxHp * (1 + mods.heal));
        break;
      case 'shield':
        for (const t of targets) addStatus(s, t, 'shield', e.turns, actor.base.hp * (e.pctMaxHp + mods.shield), actor);
        break;
      case 'cleanse':
        for (const t of targets) cleanse(s, t);
        break;
      case 'dispel':
        for (const t of targets) {
          const before = t.statuses.length;
          t.statuses = t.statuses.filter((x) => !BUFFS.includes(x.status));
          if (t.statuses.length !== before) s.events.push({ kind: 'dispel', target: t.id });
        }
        break;
      case 'turnMeter':
        for (const t of targets) applyTm(s, actor, t, e.delta >= 0 ? e.delta + mods.tm : e.delta);
        break;
      case 'revive':
        for (const t of s.units.filter((u) => u.side === actor.side && !u.alive)) {
          t.alive = true;
          t.hp = Math.round(t.base.hp * (e.pctMaxHp + mods.revive));
          t.tm = 0;
          t.statuses = [];
          s.events.push({ kind: 'revive', target: t.id });
        }
        break;
    }
  }
  // Ultime de Kaedra : rejoue si la cible meurt.
  if (skill.id === 'kaedra_3' && killed && actor.alive) { s.extraTurn = actor.id; s.events.push({ kind: 'extraTurn', target: actor.id }); }

  if (actor.side === 'ally' && s.lien >= 0 && s.lienUsed < LIEN_USES) s.lien = Math.min(LIEN_MAX, s.lien + LIEN_PER_ACTION);
  s.activeId = null;
  endTurn(s, actor);
  endCheck(s);
}

// ─── Pouvoir du Lien ───
const LIEN_SKILL = { id: 'lien_strike', name: 'Frappe des Héritiers', slot: 'basic', cooldown: 0, description: '', effects: [], upgrades: [] } as unknown as SkillDef;
const NO_MODS = skillMods(LIEN_SKILL, 1);
export const LIEN_POWERS: Record<LienPower, { name: string; text: string }> = {
  heal: { name: 'Souffle de vie', text: 'Soigne toute l’équipe de 20 % de ses PV et retire les effets néfastes.' },
  strike: { name: 'Frappe des Héritiers', text: 'Tous tes héros frappent ensemble l’ennemi le plus affaibli (50 % de leur ATQ chacun).' },
  guard: { name: 'Rempart', text: 'Bouclier de 20 % des PV sur toute l’équipe (2 tours) et +15 % de jauge de tour.' },
};
/** Le Lien peut-il agir ? (jauge pleine, au tour d'un héros, deux fois par combat au plus). Ne consomme pas le tour du héros. */
export const lienReady = (s: BattleState) => s.outcome === 'running' && s.lien >= LIEN_MAX && s.lienUsed < LIEN_USES && !!s.activeId && unitById(s, s.activeId).side === 'ally';
export function castLien(s: BattleState, power: LienPower): boolean {
  if (!lienReady(s)) return false;
  const allies = s.units.filter((u) => u.side === 'ally' && u.alive);
  s.lien = 0;
  s.lienUsed += 1;
  s.events.push({ kind: 'lien', power });
  if (power === 'heal') for (const a of allies) { cleanse(s, a); heal(s, a, a.base.hp * 0.2); }
  else if (power === 'guard') for (const a of allies) { addStatus(s, a, 'shield', 2, a.base.hp * 0.2, a); applyTm(s, a, a, 0.15); }
  else {
    for (const a of allies) {
      const foes = s.units.filter((u) => u.side === 'enemy' && u.alive);
      if (!foes.length) break;
      const t = [...foes].sort((x, y) => hpPct(x) - hpPct(y))[0];
      dealDamage(s, a, t, { kind: 'damage', target: 'enemy', mult: 0.5 } as Extract<SkillEffect, { kind: 'damage' }>, NO_MODS, LIEN_SKILL, true);
    }
  }
  endCheck(s);
  return true;
}
/** Choix automatique (combat auto, simulations) : soigner si l'équipe souffre, sinon frapper. */
export function autoLien(s: BattleState): LienPower | null {
  if (!lienReady(s)) return null;
  const allies = s.units.filter((u) => u.side === 'ally' && u.alive);
  const avg = allies.reduce((a, u) => a + hpPct(u), 0) / Math.max(1, allies.length);
  if (avg < 0.55 || allies.some((u) => hpPct(u) < 0.3)) return 'heal';
  return 'strike';
}

/** Ordre de jeu prévu (approximation sans effets futurs), pour l'affichage. */
export function predictOrder(s: BattleState, n = 6): string[] {
  const sim = s.units.filter((u) => u.alive).map((u) => ({ id: u.id, tm: u.tm, spd: eff(s, u, 'spd') }));
  const out: string[] = [];
  if (!sim.length) return out;
  while (out.length < n) {
    let best = sim[0];
    let bestT = Infinity;
    for (const u of sim) { const t = Math.max(0, TM_FULL - u.tm) / u.spd; if (t < bestT) { bestT = t; best = u; } }
    for (const u of sim) u.tm += u.spd * bestT;
    best.tm = 0;
    out.push(best.id);
  }
  return out;
}


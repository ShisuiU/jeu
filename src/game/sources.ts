import { RESOURCES, type ResourceId, type Reward } from '../data/resources';
import { CHAPTERS, DIFFICULTY_ORDER } from '../data/campaign';
import { DUNGEONS, DUNGEON_FLOORS, dungeonReward } from '../data/dungeons';
import { TOWER_FLOORS, towerReward } from '../data/tower';
import { TOWER_CHALLENGE_STEP, towerChallengeReward, RIFT_OATH_BONUS } from '../data/challenges';
import { BOSS_TIERS } from '../data/worldBoss';
import { ARENA_TIERS } from '../data/arena';
import { GUILD_TIERS } from '../data/guild';
import { DAILY_MISSIONS, DAILY_BONUS, WEEKLY_MISSIONS, WEEKLY_BONUS } from '../data/missions';
import { ACHIEVEMENTS } from '../data/achievements';
import { CYCLE_THEMES, TRIAL_REWARDS, cycleMilestones } from '../data/eventCycle';
import { MARKET_POOL } from '../data/market';
import { DAILY_REWARDS } from '../data/dailyRewards';
import { MINE } from '../data/buildings';
import { RIFT_ROOMS, riftReward } from '../data/rift';
import { FACTION_FLOORS, FACTION_STAR_MILESTONES, factionReward } from '../data/factionDungeon';
import { EPIC_SHARD_PRICE } from '../data/summons';
import { BUNDLED_EVENTS, type GameEvent } from '../data/events';
import { WHEEL } from './wheel';
import { campRates } from './camp';
import { PLACES } from './expeditions';
import { COLLECTION_STEPS, collectionReward } from './collection';
import { starChestReward, starSteps } from './starChests';
import { activeEvents } from './events';
import { isUnlocked, unlockText, type Feature } from './unlocks';
import type { SaveData } from '../save/schema';
import type { Route } from '../state/ui';

// OÙ OBTENIR UNE RESSOURCE (v1.100.0) — registre central des activités du jeu.
// Chaque activité déclare ce qu'elle peut donner en lisant les VRAIES tables de récompenses du jeu (aucune liste
// écrite à la main par ressource) : les sources d'une ressource sont simplement les activités dont les tables
// la contiennent. Ajouter une activité ici suffit à la faire apparaître partout. Les conditions d'accès
// (déblocage, compte, clan, calendrier) sont calculées sur la partie du joueur.

export interface Activity {
  id: string;
  name: string;
  /** Courte précision affichée sous le nom (facultative). */
  hint?: string;
  route: Route;
  /** Mode qui se débloque dans la campagne. */
  feature?: Feature;
  /** Toutes les récompenses que l'activité peut donner (tables du jeu). */
  rewards: (s: SaveData) => Reward[];
  /** Ce qu'elle donne en ce moment (activités qui changent selon le calendrier) ; par défaut, tout. */
  current?: (s: SaveData, now: number) => Reward[];
  /** Raison pour laquelle l'activité est fermée pour ce joueur (autre que le déblocage de campagne). */
  gate?: (s: SaveData, now: number) => string | null;
  /** Ressources dont c'est la source principale : affichée en tête de liste. */
  main?: ResourceId[];
  /** Quantité exacte et garantie, quand elle existe (ex. « 1 par heure »). */
  amount?: (s: SaveData, r: ResourceId) => string | null;
}

/** Donjons de ressources : leur spécialité passe en tête de liste. */
const DUNGEON_MAIN: Record<string, ResourceId[]> = { amber: ['xpElixir'], alchemy: ['potionMinor'], archive: ['skillTome', 'rankSigil'] };
const range = (n: number, from = 1) => Array.from({ length: n }, (_, i) => i + from);
const strip = (r: Reward & { heroes?: string[] }): Reward => { const { heroes: _h, ...rest } = r; void _h; return rest; };

export const ACTIVITIES: Activity[] = [
  { id: 'campaign', name: 'Campagne', hint: 'Victoires, premières victoires', route: { name: 'campaign' },
    rewards: () => CHAPTERS.flatMap((c) => c.stages.flatMap((st) => [strip(st.firstClear), st.repeat])) },
  { id: 'starChests', name: 'Coffres d’étoiles', hint: 'Campagne · étoiles de toutes les difficultés', route: { name: 'campaign' },
    rewards: () => DIFFICULTY_ORDER.flatMap((d) => starSteps().map((st) => starChestReward(d, st))) },
  ...DUNGEONS.map((d): Activity => ({ id: `dungeon_${d.id}`, name: d.name, hint: 'Donjon', route: { name: 'dungeon', dungeonId: d.id }, feature: 'dungeons',
    rewards: () => range(DUNGEON_FLOORS).map((f) => dungeonReward(d, f)), main: DUNGEON_MAIN[d.id] })),
  { id: 'factionDungeon', name: 'Donjon des familles', route: { name: 'factionDungeon' }, feature: 'dungeons',
    rewards: () => [...range(FACTION_FLOORS).map(factionReward), ...FACTION_STAR_MILESTONES.map((m) => m.reward)] },
  { id: 'tower', name: 'Tour des Âges', route: { name: 'tower' }, feature: 'tower', rewards: () => range(TOWER_FLOORS).map(towerReward) },
  { id: 'towerChallenges', name: 'Défis de la Tour', hint: 'Étages multiples de 5 déjà conquis', route: { name: 'tower' }, feature: 'tower',
    rewards: () => range(TOWER_FLOORS / TOWER_CHALLENGE_STEP).map((i) => towerChallengeReward(i * TOWER_CHALLENGE_STEP)) },
  { id: 'rifts', name: 'Les Failles', hint: 'Une traversée par semaine', route: { name: 'rifts' }, feature: 'tower',
    rewards: () => [...range(RIFT_ROOMS).flatMap((r) => [riftReward('fight', r), riftReward('elite', r)]), riftReward('boss', RIFT_ROOMS), RIFT_OATH_BONUS] },
  { id: 'worldboss', name: 'Boss mondial', hint: 'Paliers de dégâts', route: { name: 'worldboss' }, feature: 'worldboss', rewards: () => BOSS_TIERS.map((t) => t.reward) },
  { id: 'arena', name: 'Arène', hint: 'Récompense de fin de saison', route: { name: 'arena' }, feature: 'arena', rewards: () => ARENA_TIERS.map((t) => t.season) },
  { id: 'guild', name: 'Boss de clan', hint: 'Paliers atteints par le clan', route: { name: 'guild' }, feature: 'guild', rewards: () => GUILD_TIERS.map((t) => t.reward),
    gate: (s) => (s.guild?.id ? null : 'Rejoins un clan (compte requis)') },
  { id: 'dailyMissions', name: 'Missions du jour', route: { name: 'missions' }, rewards: () => [...DAILY_MISSIONS.map((m) => m.reward), DAILY_BONUS] },
  { id: 'weeklyMissions', name: 'Missions de la semaine', route: { name: 'missions' }, rewards: () => [...WEEKLY_MISSIONS.map((m) => m.reward), WEEKLY_BONUS] },
  { id: 'achievements', name: 'Progression', hint: 'Missions · objectifs à long terme', route: { name: 'missions' }, rewards: () => ACHIEVEMENTS.map((a) => a.reward) },
  { id: 'weeklyEvent', name: 'Événement de la semaine', hint: 'Objectifs, épreuves, paliers', route: { name: 'events' }, feature: 'events',
    rewards: () => [...CYCLE_THEMES.flatMap((t) => [...t.tasks.map((x) => x.reward), ...cycleMilestones(t).map((m) => m.reward)]), ...TRIAL_REWARDS],
    current: (_s, now) => activeEvents(now).filter((e) => e.cycle).flatMap((e) => [...(e.tasks ?? []).map((t) => t.reward), ...(e.cycle?.trials ?? []).map((t) => t.reward), ...(e.cycle?.milestones ?? []).map((m) => m.reward)]) },
  { id: 'specialEvents', name: 'Événements spéciaux', hint: 'Connexion, objectifs, épreuve', route: { name: 'events' }, feature: 'events',
    rewards: () => specialRewards(BUNDLED_EVENTS.filter((e) => !e.cycle && Date.parse(e.end) > Date.now())),
    current: (_s, now) => specialRewards(activeEvents(now).filter((e) => !e.cycle)) },
  { id: 'dailyLogin', name: 'Connexion quotidienne', hint: 'Courrier · un cadeau par jour', route: { name: 'mail' }, rewards: () => DAILY_REWARDS.map((d) => d.reward) },
  { id: 'wheel', name: 'Roue quotidienne', hint: 'Un tour gratuit par jour', route: { name: 'wheel' }, rewards: () => WHEEL.map((w) => w.reward) },
  { id: 'market', name: 'Marché', hint: 'Offres du jour, contre de l’or ou des cristaux', route: { name: 'market' }, feature: 'market',
    rewards: () => MARKET_POOL.filter((o) => o.reward).map((o) => o.reward!) },
  { id: 'camp', name: 'Camp des Héritiers', hint: 'Butin d’absence, même jeu fermé', route: { name: 'camp' }, feature: 'camp',
    rewards: (s) => [Object.fromEntries(Object.keys(campRates(s)).map((k) => [k, 1])) as Reward] },
  { id: 'expeditions', name: 'Expéditions', hint: 'Selon le lieu proposé ce jour', route: { name: 'expeditions' }, feature: 'expeditions', rewards: () => PLACES.map((p) => p.focus) },
  { id: 'mine', name: 'Mine de diamants', hint: 'Bâtiments · même jeu fermé', route: { name: 'buildings' }, rewards: () => [{ diamonds: 1 }], main: ['diamonds'],
    amount: (s) => { const lv = s.buildings?.mineLevel ?? 1; return `${MINE.rate[lv] ?? 1} par heure`; } },
  { id: 'collection', name: 'Paliers de collection', hint: 'Héros ▸ Collection', route: { name: 'collection' }, rewards: () => COLLECTION_STEPS.map(collectionReward) },
  { id: 'dismantle', name: 'Démanteler un équipement', hint: 'Forge ▸ Démanteler', route: { name: 'gear' }, rewards: () => [{ gold: 1, forgeOre: 1 }] },
  { id: 'epicExchange', name: 'Échange à l’Autel', hint: 'Invocation épique', route: { name: 'summon' }, rewards: () => [{ shardEpic: 1 }], main: ['shardEpic'],
    amount: () => `1 contre ${EPIC_SHARD_PRICE} cristaux` },
];

/** Récompenses des événements spéciaux (hors semaine) : objectifs, jours de connexion, épreuve. */
function specialRewards(list: GameEvent[]): Reward[] {
  return list.flatMap((e) => [...(e.tasks ?? []).map((t) => t.reward), ...(e.login?.days ?? []).map((d) => d.reward), ...(e.challenge ? [e.challenge.reward] : [])]);
}

const has = (rs: Reward[], r: ResourceId) => rs.some((x) => (x[r] ?? 0) > 0);

export type SourceStatus = 'open' | 'locked' | 'later';
export interface Source { activity: Activity; status: SourceStatus; reason?: string; amount?: string | null }

/** Sources réelles d'une ressource pour ce joueur : ouvertes d'abord, puis à venir, puis verrouillées. */
export function sourcesOf(s: SaveData, r: ResourceId, now: number): Source[] {
  const out: Source[] = [];
  for (const a of ACTIVITIES) {
    if (!has(a.rewards(s), r)) continue;
    const amount = a.amount?.(s, r) ?? null;
    if (a.feature && !isUnlocked(s, a.feature)) { out.push({ activity: a, status: 'locked', reason: `${unlockText(a.feature)} de la campagne`, amount }); continue; }
    const gate = a.gate?.(s, now);
    if (gate) { out.push({ activity: a, status: 'locked', reason: gate, amount }); continue; }
    if (a.current && !has(a.current(s, now), r)) { out.push({ activity: a, status: 'later', reason: 'Pas en ce moment', amount }); continue; }
    out.push({ activity: a, status: 'open', amount });
  }
  const order: Record<SourceStatus, number> = { open: 0, later: 1, locked: 2 };
  const main = (x: Source) => (x.activity.main?.includes(r) ? 0 : 1);
  return out.sort((x, y) => order[x.status] - order[y.status] || main(x) - main(y));
}

/** Ressources qui ont au moins une source (les autres sont signalées comme sans source actuelle). */
export const resourcesWithSources = (s: SaveData, now: number) => (Object.keys(RESOURCES) as ResourceId[]).filter((r) => sourcesOf(s, r, now).length > 0);

import type { Reward } from './resources';
import type { TrackKey } from './missions';
import type { ChapterDef } from './campaign';

// ÉVÉNEMENTS DE LA SEMAINE — un thème différent chaque semaine (du lundi au lundi), sans serveur :
// le calendrier se déduit de la date (horloge de confiance), le même pour tous les joueurs.
// Chaque événement : 5 objectifs à points, une épreuve en 3 combats, des paliers de points et un bonus.

export type EventBonusKind = 'expedition' | 'arena' | 'dungeon' | 'worldBoss' | 'campaignXp' | 'campaignGold';

export const BONUS_LABEL: Record<EventBonusKind, string> = {
  expedition: 'Butin des expéditions',
  arena: 'Points d’arène gagnés à chaque victoire',
  dungeon: 'Butin des donjons',
  worldBoss: 'Coffres du boss mondial',
  campaignXp: 'Expérience des héros en campagne',
  campaignGold: 'Or gagné en campagne',
};

/** Libellé court (cartes, pastille du bonus). */
export const BONUS_SHORT: Record<EventBonusKind, string> = {
  expedition: 'expéditions', arena: 'arène', dungeon: 'donjons', worldBoss: 'boss mondial', campaignXp: 'XP en campagne', campaignGold: 'or en campagne',
};

export interface CycleTask { key: TrackKey; target: number; title: string; points: number; reward: Reward }

export interface CycleTheme {
  id: string;
  name: string;
  /** Une phrase d'ambiance, courte. */
  tagline: string;
  color: string;
  region: ChapterDef['backdrop'];
  art: string;
  bonus: { kind: EventBonusKind; mult: number };
  /** Ennemis de l'épreuve : trois habituels et un gardien. */
  foes: [string, string, string];
  guardian: string;
  trialNames: [string, string, string];
  tasks: CycleTask[];
  /** Récompense du 4ᵉ palier, propre au thème. */
  focus: Reward;
}

export const CYCLE_THEMES: CycleTheme[] = [
  {
    id: 'tide', name: 'La Marée d’Éther', color: '#7fd4ff', region: 'astral', art: 'void_weaver',
    tagline: 'Le ciel déborde : les expéditions reviennent les bras chargés.',
    bonus: { kind: 'expedition', mult: 1.5 },
    foes: ['star_husk', 'void_weaver', 'fallen_seraph'], guardian: 'dead_constellation',
    trialNames: ['Écume d’étoiles', 'Le Courant noir', 'L’Œil de la Marée'],
    tasks: [
      { key: 'expedition', target: 4, title: 'Terminer 4 expéditions', points: 80, reward: { gold: 8000 } },
      { key: 'battleWin', target: 20, title: 'Remporter 20 combats', points: 70, reward: { xpElixir: 5 } },
      { key: 'summon', target: 5, title: 'Invoquer 5 héros', points: 50, reward: { shardDim: 3 } },
      { key: 'energySpent', target: 200, title: 'Dépenser 200 énergie', points: 70, reward: { crystals: 60 } },
      { key: 'heroUpgrade', target: 3, title: 'Améliorer 3 fois un héros', points: 60, reward: { skillTome: 1 } },
    ],
    focus: { awakenEssence: 3, crystals: 100 },
  },
  {
    id: 'tourney', name: 'Le Tournoi des Bannières', color: '#ffcc66', region: 'valcrest', art: 'hollow_knight',
    tagline: 'Valcrest ouvre ses lices : chaque victoire d’arène rapporte plus de points.',
    bonus: { kind: 'arena', mult: 1.5 },
    foes: ['hollow_soldier', 'hollow_shield', 'hollow_archer'], guardian: 'herald',
    trialNames: ['La Lice ouverte', 'Le Carré des Boucliers', 'Le Champion du Héraut'],
    tasks: [
      { key: 'arenaFight', target: 8, title: 'Combattre 8 fois dans l’arène', points: 80, reward: { crystals: 60 } },
      { key: 'arenaWin', target: 5, title: 'Gagner 5 combats d’arène', points: 80, reward: { shardDim: 3 } },
      { key: 'battleWin', target: 20, title: 'Remporter 20 combats', points: 60, reward: { gold: 8000 } },
      { key: 'gearUpgrade', target: 5, title: 'Améliorer 5 fois un équipement', points: 50, reward: { forgeOre: 40 } },
      { key: 'campaignWin', target: 10, title: 'Gagner 10 combats de campagne', points: 60, reward: { xpElixir: 5 } },
    ],
    focus: { rankSigil: 2, crystals: 100 },
  },
  {
    id: 'forge', name: 'La Forge Ardente', color: '#ff9a3c', region: 'ash', art: 'forge_golem',
    tagline: 'Les fourneaux de la Fosse sont rallumés : les donjons regorgent de minerai.',
    bonus: { kind: 'dungeon', mult: 1.5 },
    foes: ['ash_imp', 'chain_warden', 'pyre_priest'], guardian: 'forge_golem',
    trialNames: ['Les Scories', 'La Chaîne et l’Enclume', 'Le Cœur du Fourneau'],
    tasks: [
      { key: 'dungeonWin', target: 10, title: 'Vaincre 10 étages de donjon', points: 90, reward: { forgeOre: 50 } },
      { key: 'gearUpgrade', target: 8, title: 'Améliorer 8 fois un équipement', points: 70, reward: { forgeOre: 40 } },
      { key: 'battleWin', target: 20, title: 'Remporter 20 combats', points: 60, reward: { gold: 8000 } },
      { key: 'energySpent', target: 200, title: 'Dépenser 200 énergie', points: 60, reward: { potionMinor: 6 } },
      { key: 'expedition', target: 3, title: 'Terminer 3 expéditions', points: 50, reward: { xpElixir: 4 } },
    ],
    focus: { forgeOre: 150, potionMinor: 9 },
  },
  {
    id: 'hunt', name: 'La Grande Chasse', color: '#7ddc8a', region: 'sylvaran', art: 'feral_stalker',
    tagline: 'Les Sylves sonnent du cor : le boss mondial laisse de plus gros coffres.',
    bonus: { kind: 'worldBoss', mult: 1.5 },
    foes: ['feral_stalker', 'thorn_wisp', 'rot_treant'], guardian: 'mother_tree',
    trialNames: ['La Piste', 'Les Ronces', 'La Mère des Sylves'],
    tasks: [
      { key: 'worldBoss', target: 6, title: 'Affronter 6 fois le boss mondial', points: 90, reward: { rankSigil: 1 } },
      { key: 'battleWin', target: 25, title: 'Remporter 25 combats', points: 70, reward: { gold: 9000 } },
      { key: 'dungeonWin', target: 6, title: 'Vaincre 6 étages de donjon', points: 60, reward: { forgeOre: 30 } },
      { key: 'summon', target: 5, title: 'Invoquer 5 héros', points: 50, reward: { shardDim: 3 } },
      { key: 'expedition', target: 3, title: 'Terminer 3 expéditions', points: 60, reward: { xpElixir: 4 } },
    ],
    focus: { skillTome: 3, crystals: 100 },
  },
  {
    id: 'pilgrim', name: 'Le Pèlerinage des Héritiers', color: '#e8c37a', region: 'akkar', art: 'bronze_hoplite',
    tagline: 'Sur les routes d’Akkar, chaque combat de campagne forge davantage les héros.',
    bonus: { kind: 'campaignXp', mult: 1.5 },
    foes: ['sand_reaver', 'bronze_hoplite', 'dune_seer'], guardian: 'scorpion_king',
    trialNames: ['Les Dunes', 'La Phalange de bronze', 'Le Roi Scorpion'],
    tasks: [
      { key: 'campaignWin', target: 15, title: 'Gagner 15 combats de campagne', points: 90, reward: { xpElixir: 6 } },
      { key: 'energySpent', target: 250, title: 'Dépenser 250 énergie', points: 70, reward: { crystals: 60 } },
      { key: 'heroUpgrade', target: 3, title: 'Améliorer 3 fois un héros', points: 60, reward: { skillTome: 1 } },
      { key: 'gearUpgrade', target: 5, title: 'Améliorer 5 fois un équipement', points: 50, reward: { forgeOre: 40 } },
      { key: 'arenaFight', target: 5, title: 'Combattre 5 fois dans l’arène', points: 60, reward: { gold: 8000 } },
    ],
    focus: { xpElixir: 15, awakenEssence: 2 },
  },
  {
    id: 'seams', name: 'La Nuit des Coutures', color: '#c79bff', region: 'seams', art: 'seam_stalker',
    tagline: 'Les fils du monde se défont : la campagne rapporte plus d’or.',
    bonus: { kind: 'campaignGold', mult: 1.5 },
    foes: ['echo_wanderer', 'seam_stalker', 'stitch_golem'], guardian: 'weaver_of_ages',
    trialNames: ['Les Échos', 'Le Fil tendu', 'La Tisseuse des Âges'],
    tasks: [
      { key: 'campaignWin', target: 12, title: 'Gagner 12 combats de campagne', points: 80, reward: { gold: 10000 } },
      { key: 'summon', target: 8, title: 'Invoquer 8 héros', points: 70, reward: { shardDim: 4 } },
      { key: 'towerWin', target: 3, title: 'Gravir 3 étages de la tour', points: 60, reward: { crystals: 60 } },
      { key: 'expedition', target: 3, title: 'Terminer 3 expéditions', points: 60, reward: { xpElixir: 4 } },
      { key: 'battleWin', target: 20, title: 'Remporter 20 combats', points: 60, reward: { potionMinor: 6 } },
    ],
    focus: { shardAeon: 1, crystals: 150 },
  },
];

/** Points de chaque combat de l'épreuve. */
export const TRIAL_POINTS = [50, 60, 80] as const;
/** Récompense de chaque combat de l'épreuve (en plus des points). */
export const TRIAL_REWARDS: Reward[] = [{ gold: 6000, xpElixir: 3 }, { crystals: 60, forgeOre: 30 }, { shardAeon: 1, crystals: 80 }];

/** Paliers de points (le 4ᵉ dépend du thème). */
export function cycleMilestones(t: CycleTheme): { points: number; reward: Reward }[] {
  return [
    { points: 60, reward: { gold: 15000 } },
    { points: 150, reward: { crystals: 100, shardDim: 3 } },
    { points: 260, reward: { shardAeon: 1, xpElixir: 8 } },
    { points: 380, reward: t.focus },
    { points: 500, reward: { shardAeon: 2, crystals: 200 } },
  ];
}

/** Premier lundi du calendrier (semaine 0). */
export const CYCLE_EPOCH = { y: 2026, m: 0, d: 5 };

import type { Reward } from './resources';
import { LATER_CHAPTERS } from './campaignChapters';

// CAMPAGNE — entièrement décrite par les données. Ajouter un chapitre = ajouter une entrée ici.

export type Speaker = string; // id de héros, id d'ennemi, ou 'narrator'

export interface DialogueLine { speaker: Speaker; text: string }

export interface WaveEnemy { enemy: string; level: number; slot: number; hpMult?: number }

export interface StageDef {
  id: string; // "1-1"
  chapter: number;
  index: number;
  name: string;
  energy: number;
  waves: WaveEnemy[][];
  /** Puissance des ennemis (les héros se renforcent par le rang, l'ascension et l'équipement). */
  statMult?: number;
  boss?: boolean;
  heroXp: number;
  firstClear: Reward & { heroes?: string[] };
  repeat: Reward;
  before?: DialogueLine[];
  after?: DialogueLine[];
}

export interface ChapterDef {
  n: number;
  name: string;
  region: string;
  backdrop: 'valcrest' | 'sylvaran' | 'prism' | 'akkar' | 'ash' | 'astral' | 'heart' | 'seams' | 'abyss';
  intro: string;
  stages: StageDef[];
}

export type DifficultyId = 'normal' | 'hard' | 'expert' | 'nightmare';
export const DIFFICULTY_ORDER: DifficultyId[] = ['normal', 'hard', 'expert', 'nightmare'];
export const DIFFICULTIES: Record<DifficultyId, { name: string; levelAdd: number; statMult: number; rewardMult: number; available: boolean }> = {
  normal: { name: 'Normal', levelAdd: 0, statMult: 1, rewardMult: 1, available: true },
  hard: { name: 'Difficile', levelAdd: 15, statMult: 1.25, rewardMult: 1.6, available: true },
  expert: { name: 'Expert', levelAdd: 30, statMult: 1.6, rewardMult: 2.4, available: true },
  nightmare: { name: 'Cauchemar', levelAdd: 45, statMult: 2.1, rewardMult: 3.5, available: true },
};

const W = (enemy: string, level: number, slot: number, hpMult?: number): WaveEnemy => ({ enemy, level, slot, hpMult });

const CH1: StageDef[] = [
  {
    id: '1-1', chapter: 1, index: 1, name: 'La brèche du Mur Blanc', energy: 2, heroXp: 60,
    waves: [[W('hollow_soldier', 1, 0), W('hollow_soldier', 1, 2)], [W('hollow_soldier', 1, 0), W('hollow_archer', 1, 1), W('hollow_soldier', 2, 2)]],
    firstClear: { gold: 1500, crystals: 30, xpElixir: 2 }, repeat: { gold: 400 },
    before: [
      { speaker: 'narrator', text: 'Marches de Valcrest. Depuis mille ans, le Mur Blanc n’a jamais cédé. Cette nuit, aucune cloche ne sonne.' },
      { speaker: 'corvin', text: 'Pas un cri, pas une torche. Les sentinelles ont disparu… Non. Pire. Elles sont toujours là.' },
      { speaker: 'brann', text: 'Elles ont plus de visage. Ça me suffit pour savoir où taper.' },
      { speaker: 'elowen', text: 'Des Effacés. Le Néant leur a pris leur nom. Ils ne sentent plus rien, ne craignent plus rien.' },
      { speaker: 'torvald', text: 'Alors rendons-leur le repos. Restez derrière moi.' },
    ],
    after: [
      { speaker: 'elowen', text: 'Tu l’as senti ? Quand nous combattons ensemble, nos éclats chantent. Tu es le Lien dont parlaient les anciens.' },
    ],
  },
  {
    id: '1-2', chapter: 1, index: 2, name: 'Le chemin de ronde', energy: 3, heroXp: 80,
    waves: [[W('hollow_soldier', 2, 0), W('hollow_archer', 2, 3), W('hollow_soldier', 2, 2)], [W('rift_hound', 2, 0), W('rift_hound', 2, 2)]],
    firstClear: { gold: 1800, crystals: 30 }, repeat: { gold: 450 },
    before: [{ speaker: 'corvin', text: 'Des molosses de faille. Ils chassent en meute et visent toujours le plus faible. Gardez un œil sur notre druidesse.' }],
  },
  {
    id: '1-3', chapter: 1, index: 3, name: 'Le corps de garde', energy: 3, heroXp: 100,
    waves: [[W('hollow_shield', 3, 1), W('hollow_soldier', 3, 0), W('hollow_soldier', 3, 2)], [W('hollow_archer', 3, 0), W('hollow_archer', 3, 2), W('hollow_cantor', 3, 4)]],
    firstClear: { gold: 2100, crystals: 30, shardDim: 1 }, repeat: { gold: 500 },
    before: [{ speaker: 'elowen', text: 'Ce Chantre referme leurs plaies sans un son. Abattez-le en premier, sinon nous combattrons toute la nuit.' }],
  },
  {
    id: '1-4', chapter: 1, index: 4, name: 'La poterne ensanglantée', energy: 3, heroXp: 120,
    waves: [[W('rift_hound', 4, 0), W('hollow_soldier', 4, 1), W('rift_hound', 4, 2)], [W('hollow_shield', 4, 1), W('hollow_cantor', 4, 3), W('hollow_archer', 4, 4)]],
    firstClear: { gold: 2400, crystals: 30, xpElixir: 3 }, repeat: { gold: 550 },
  },
  {
    id: '1-5', chapter: 1, index: 5, name: 'Le dernier défenseur', energy: 4, heroXp: 140,
    waves: [[W('hollow_soldier', 5, 0), W('hollow_soldier', 5, 1), W('hollow_soldier', 5, 2)], [W('hollow_knight', 5, 1), W('hollow_archer', 5, 3), W('hollow_archer', 5, 4)]],
    firstClear: { gold: 2700, crystals: 40 }, repeat: { gold: 600 },
    before: [
      { speaker: 'narrator', text: 'Au sommet de la tour d’angle, un homme seul tient encore. Son bouclier est couvert de noms gravés.' },
      { speaker: 'aldric', text: 'Qui que vous soyez, vous arrivez tard. Mais vous arrivez. Tenez la gauche, je garde la porte.' },
    ],
    after: [
      { speaker: 'aldric', text: 'Aldric Vaunt, capitaine du Mur Blanc. Ou de ce qu’il en reste. Trois cents hommes tenaient ce mur hier soir.' },
      { speaker: 'torvald', text: 'Et ce soir, ils sont cinq. Ce sera suffisant.' },
    ],
  },
  {
    id: '1-6', chapter: 1, index: 6, name: 'La chapelle du rempart', energy: 4, heroXp: 160,
    waves: [[W('hollow_soldier', 7, 0), W('hollow_shield', 7, 1), W('hollow_cantor', 7, 4)], [W('rift_hound', 7, 0), W('rift_hound', 7, 1), W('rift_hound', 7, 2), W('hollow_archer', 6, 3)]],
    firstClear: { gold: 3000, crystals: 40, shardDim: 1 }, repeat: { gold: 650 },
  },
  {
    id: '1-7', chapter: 1, index: 7, name: 'Le glas', energy: 4, heroXp: 180,
    waves: [[W('hollow_knight', 7, 1), W('hollow_soldier', 7, 0), W('hollow_soldier', 7, 2)], [W('hollow_archer', 7, 0), W('hollow_cantor', 7, 3), W('hollow_archer', 7, 2), W('hollow_shield', 7, 1)]],
    firstClear: { gold: 3300, crystals: 40, xpElixir: 4 }, repeat: { gold: 700 },
    before: [
      { speaker: 'narrator', text: 'Une cloche résonne au loin. Un seul coup. Puis plus rien : ni le vent, ni les pas, ni les battements de cœur.' },
      { speaker: 'brann', text: '… Je m’entends plus respirer. C’est quoi, ce sorcier ?' },
      { speaker: 'corvin', text: 'Le Héraut. Il sonnait autrefois les victoires de Valcrest. Maintenant, il sonne leur oubli.' },
    ],
  },
  {
    id: '1-8', chapter: 1, index: 8, name: 'La cour d’honneur', energy: 5, heroXp: 200,
    waves: [[W('rift_hound', 8, 0), W('hollow_knight', 8, 1), W('rift_hound', 8, 2)], [W('hollow_shield', 8, 1), W('hollow_archer', 8, 0), W('hollow_archer', 8, 2), W('hollow_cantor', 8, 4)]],
    firstClear: { gold: 3600, crystals: 50 }, repeat: { gold: 750 },
  },
  {
    id: '1-9', chapter: 1, index: 9, name: 'Les noms oubliés', energy: 5, heroXp: 220,
    waves: [[W('hollow_soldier', 8, 0), W('rift_hound', 8, 1), W('hollow_soldier', 8, 2)], [W('hollow_knight', 9, 0), W('hollow_knight', 9, 2), W('hollow_archer', 8, 3), W('hollow_cantor', 8, 4)]],
    firstClear: { gold: 4000, crystals: 50, shardDim: 2 }, repeat: { gold: 800 },
    before: [
      { speaker: 'aldric', text: 'Ces chevaliers… je les ai formés. Je connais leurs visages. Je connais…' },
      { speaker: 'aldric', text: 'Je ne me souviens plus de leurs noms. Ils étaient gravés là, sur mon bouclier. Les lettres s’effacent.' },
      { speaker: 'elowen', text: 'Alors bats-toi pour qu’ils reviennent. Le Néant n’efface que ce que plus personne ne défend.' },
    ],
  },
  {
    id: '1-10', chapter: 1, index: 10, name: 'Le Héraut Effacé', energy: 6, heroXp: 300, boss: true,
    waves: [
      [W('hollow_shield', 8, 1), W('hollow_soldier', 9, 0), W('hollow_archer', 9, 2)],
      [W('herald', 10, 1, 4.2), W('hollow_cantor', 8, 3), W('hollow_soldier', 9, 4)],
    ],
    firstClear: { gold: 8000, crystals: 150, shardAeon: 1, skillTome: 2, heroes: ['aldric'] }, repeat: { gold: 1200, xpElixir: 1 },
    before: [
      { speaker: 'narrator', text: 'Sur la place du beffroi, une silhouette immense attend, sa cloche de bronze à la main. Elle n’a pas de visage. Elle n’en a plus besoin.' },
      { speaker: 'herald', text: '…………' },
      { speaker: 'aldric', text: 'Il n’y a plus rien à lui dire. Héritiers, avec moi !' },
    ],
    after: [
      { speaker: 'narrator', text: 'La cloche se brise. Le silence se déchire, et le vent revient sur les remparts.' },
      { speaker: 'aldric', text: 'Les noms… ils sont revenus sur mon bouclier. Tous les trois cents. Je vous dois plus que ma vie.' },
      { speaker: 'aldric', text: 'Mon épée est à toi, Lien. Valcrest se souviendra de cette nuit.' },
      { speaker: 'elowen', text: 'Écoutez… À l’est, les arbres hurlent. Le Néant a atteint Sylvaran.' },
      { speaker: 'narrator', text: 'Aldric Vaunt rejoint les Héritiers. Fin du chapitre 1.' },
    ],
  },
];

export const CHAPTERS: ChapterDef[] = [
  {
    n: 1, name: 'Les Remparts de Cendre', region: 'Marches de Valcrest', backdrop: 'valcrest',
    intro: 'La forteresse du Mur Blanc, rempart oriental de l’Empire de Valcrest, est tombée dans le silence. Reprenez-la aux Effacés.',
    stages: CH1,
  },
  ...LATER_CHAPTERS,
];

export const STAGE_BY_ID: Record<string, StageDef> = Object.fromEntries(CHAPTERS.flatMap((c) => c.stages).map((s) => [s.id, s]));
export const progressKey = (difficulty: DifficultyId, stageId: string) => `${difficulty}:${stageId}`;

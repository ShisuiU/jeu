import type { Reward } from './resources';
import type { TrackKey } from './missions';
import type { WaveEnemy } from './campaign';
import type { EventBonusKind } from './eventCycle';

// ÉVÉNEMENTS — décrits en JSON. Le jeu télécharge public/events.json au démarrage (sans passer par le
// cache), le mémorise pour le hors-ligne, et retombe sur cette liste intégrée si rien n'est disponible.
// Pour lancer un nouvel événement : modifier uniquement public/events.json, sans toucher au code.

export interface EventTask { id: string; key: TrackKey; target: number; title: string; reward: Reward; points?: number }
/** Combat d'épreuve : ennemis du thème, au niveau du chapitre où en est le joueur. */
export interface EventTrial { id: string; name: string; points: number; reward: Reward }
export interface EventChallenge { id: string; name: string; description: string; waves: WaveEnemy[][]; reward: Reward }
/** Calendrier de connexion d'un événement : un cadeau par jour de connexion (pas forcément consécutifs). */
export interface LoginDay { reward: Reward; hero?: string }

export interface GameEvent {
  id: string;
  name: string;
  /** Nom court (onglets). */
  short?: string;
  description: string;
  start: string; // ISO
  end: string;   // ISO
  /** Bannières d'invocation ouvertes pendant l'événement. */
  banners?: string[];
  tasks?: EventTask[];
  challenge?: EventChallenge;
  /** Bonus de butin des donjons (multiplicateur). */
  dungeonBonus?: number;
  color?: string;
  /** Événement de connexion : jours à réclamer, un par jour de jeu. */
  login?: { days: LoginDay[] };
  /** Événement de la semaine (calendrier automatique) : champs ci-dessous. */
  cycle?: {
    theme: string;
    tagline: string;
    region: string;
    art: string;
    bonus: { kind: EventBonusKind; mult: number };
    trials: EventTrial[];
    milestones: { points: number; reward: Reward }[];
  };
}

export const BUNDLED_EVENTS: GameEvent[] = [
  {
    id: 'ev_ash_2026', name: 'La Faille de Cendre', short: 'Faille de Cendre', color: '#ff3d6e',
    description: 'Une faille s’ouvre sur la Fosse : Mère Sulfura répond plus souvent à l’appel. Remplissez les objectifs pour gagner des éclats de faille.',
    start: '2026-11-01T00:00:00Z', end: '2027-01-31T23:59:59Z',
    banners: ['event_ash'],
    dungeonBonus: 1.5,
    tasks: [
      { id: 'e1', key: 'battleWin', target: 15, title: 'Remporter 15 combats', reward: { shardEvent: 3 } },
      { id: 'e2', key: 'dungeonWin', target: 10, title: 'Vaincre 10 étages de donjon', reward: { shardEvent: 4 } },
      { id: 'e3', key: 'worldBoss', target: 5, title: 'Affronter 5 fois le boss mondial', reward: { shardEvent: 3 } },
      { id: 'e4', key: 'summon', target: 20, title: 'Invoquer 20 héros', reward: { shardEvent: 5, crystals: 200 } },
    ],
    challenge: {
      id: 'c_ash', name: 'Défi : les Braises de la Fosse',
      description: 'Une meute de molosses de faille garde la brèche. Défi unique.',
      waves: [
        [{ enemy: 'rift_hound', level: 12, slot: 0 }, { enemy: 'rift_hound', level: 12, slot: 1 }, { enemy: 'rift_hound', level: 12, slot: 2 }],
        [{ enemy: 'hollow_cantor', level: 13, slot: 3 }, { enemy: 'hollow_knight', level: 14, slot: 1 }, { enemy: 'hollow_cantor', level: 13, slot: 4 }],
      ],
      reward: { shardEvent: 5, crystals: 150 },
    },
  },
  {
    id: 'ev_dawn_2026', name: 'L’Appel des Sept Aubes', short: 'Sept Aubes', color: '#ffcf5a',
    description: 'Connecte-toi 7 jours pendant l’événement : un cadeau chaque jour, et Élyra, héroïne exclusive, au septième.',
    start: '2026-11-06T00:00:00Z', end: '2026-12-07T04:59:59Z',
    login: { days: [
      { reward: { gold: 10000 } },
      { reward: { shardDim: 5 } },
      { reward: { crystals: 150 } },
      { reward: { xpElixir: 10 } },
      { reward: { shardAeon: 1 } },
      { reward: { crystals: 250, awakenEssence: 2 } },
      { reward: {}, hero: 'elyra' },
    ] },
  },
];

// COMPORTEMENTS D'ENNEMIS (v1.106.0, phase 3 lot 4) — certains ennemis ordinaires ont une habitude reconnaissable,
// affichée sur leur carte, qui pose une vraie question au joueur : qui abattre en premier, frapper une cible ou toutes ?
// Actifs seulement là où les mécaniques de combat le sont (campagne, donjons, Tour…), jamais sur les boss
// (ils ont déjà leurs actes et leur Fracture).

export type EnemyTrait = 'mender' | 'guard' | 'summoner';

export const TRAITS: Record<EnemyTrait, { name: string; text: string; counter: string; color: string }> = {
  mender: {
    name: 'Secours', color: '#7bd88f',
    text: 'Une fois par combat, quand un de ses alliés (hors boss) passe sous 35 % de PV, il le soigne aussitôt de 30 %.',
    counter: 'Abats-le d’abord, ou achève sa cible d’un seul coup.',
  },
  guard: {
    name: 'Garde', color: '#9fd0ff',
    text: 'Tant qu’il est debout, il encaisse 30 % des coups portés à une seule cible sur ses alliés (hors boss), et en amortit une partie.',
    counter: 'Abats-le d’abord, ou frappe tout le groupe : les attaques de zone l’ignorent.',
  },
  summoner: {
    name: 'Appel', color: '#c9a2ff',
    text: 'Quand son groupe compte moins de 3 combattants, il appelle un renfort au début de son tour, puis agit (2 fois par combat).',
    counter: 'Abats-le avant ses compagnons.',
  },
};

/** Ennemis qui portent un comportement, et renfort appelé par les invocateurs. */
export const ENEMY_TRAITS: Record<string, { trait: EnemyTrait; minion?: string }> = {
  // Secours : les soigneurs de la campagne.
  hollow_cantor: { trait: 'mender' },
  dune_seer: { trait: 'mender' },
  fallen_seraph: { trait: 'mender' },
  heart_shard: { trait: 'mender' },
  // Garde : les protecteurs qui ne provoquent pas déjà.
  hollow_shield: { trait: 'guard' },
  // rot_treant retiré (v1.110.0) : au début du chapitre 2 (ennemis +60 %), la Garde ajoutait 2 à 3 niveaux requis ;
  // un testeur « nouveau joueur » s'y est heurté deux fois en 2-4.
  bronze_hoplite: { trait: 'guard' },
  // Appel : les meneurs qui commandent d'autres créatures de leur région.
  data_wraith: { trait: 'summoner', minion: 'rogue_drone' },
  pyre_priest: { trait: 'summoner', minion: 'ash_imp' },
  brine_siren: { trait: 'summoner', minion: 'abyss_angler' },
};

/** Règles chiffrées (partagées par le moteur, les tests et les textes). */
export const MENDER_BELOW = 0.35, MENDER_HEAL = 0.3;
export const GUARD_SHARE = 0.3, GUARD_TAKES = 0.7;
export const SUMMON_MAX = 2, SUMMON_BELOW = 3, SUMMON_GAP = 2;
/** Le renfort est plus faible que l'original. */
export const MINION_STAT = 0.75, MINION_HP = 0.6;

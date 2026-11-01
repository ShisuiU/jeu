// ÉQUILIBRAGE CENTRALISÉ
// Toutes les constantes d'économie et de progression sont ici : on peut ajuster coûts et récompenses
// sans toucher aux héros ni au moteur.

export const BALANCE = {
  energy: {
    max: 120,
    regenMs: 4 * 60 * 1000, // 1 énergie toutes les 4 minutes (≈ 360/jour)
    /** Plafond de surcharge (récompenses) au-delà du maximum. */
    overflowCap: 999,
  },
  time: {
    /** Tolérance avant de considérer qu'il y a eu un recul d'horloge (décalages NTP, fuseaux…). */
    rollbackToleranceMs: 10 * 60 * 1000,
    /** Heure locale du renouvellement quotidien. */
    dailyResetHour: 5,
  },
  hero: {
    /** Croissance des PV/ATQ/DÉF par niveau (proportion de la base). */
    growthPerLevel: 0.075,
    /** Niveau maximum = rang × levelsPerRank. */
    levelsPerRank: 10,
    maxRank: 6,
    /** Bonus multiplicatif par rang au-dessus du rang de départ de la rareté. */
    rankBonus: 0.06,
    /** Bonus par palier d'ascension (0 à 6). */
    ascensionBonus: 0.04,
    maxAscension: 6,
    /** Bonus par niveau d'éveil (0 à 5). */
    awakenBonus: 0.05,
    maxAwaken: 5,
  },
  starter: {
    gold: 20000,
    crystals: 300,
    shardDim: 10,
    shardAeon: 3,
    xpElixir: 10,
  },
  autosave: {
    debounceMs: 1500,
    backupEveryMs: 10 * 60 * 1000,
    maxBackups: 6,
  },
} as const;

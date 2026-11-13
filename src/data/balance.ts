// ÉQUILIBRAGE CENTRALISÉ
// Toutes les constantes d'économie et de progression sont ici : on peut ajuster coûts et récompenses
// sans toucher aux héros ni au moteur.

export const BALANCE = {
  energy: {
    /** Maximum au niveau de compte 1 ; il augmente de `perLevel` à chaque niveau, jusqu'à `maxCap`. */
    max: 120,
    perLevel: 10,
    maxCap: 900,
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
    rankBonus: 0.045, // v1.87.0 : 0,06 → 0,045 (les communs rattrapaient presque les légendaires)
    /** Bonus par palier d'ascension (0 à 6). */
    ascensionBonus: 0.04,
    maxAscension: 6,
    /** Bonus par niveau d'éveil (0 à 5). */
    awakenBonus: 0.05,
    maxAwaken: 5,
  },
  upgrades: {
    /** Expérience donnée par un élixir, et or dépensé par élixir (× niveau du héros). */
    elixirXp: 400,
    elixirGoldPerLevel: 120,
    /** Rang r → r+1 : sceaux de rang = r, or = rankGold × r. Le héros doit être au niveau max de son rang. */
    rankGold: 6000,
    /** Ascension a → a+1 : potion et quantités par palier, or, niveau requis. */
    ascension: [
      { potion: 'potionMinor', amount: 4, gold: 8000, minLevel: 10 },
      { potion: 'potionMinor', amount: 10, gold: 16000, minLevel: 20 },
      { potion: 'potionMinor', amount: 18, gold: 30000, minLevel: 30 },
      { potion: 'potionMinor', amount: 42, gold: 50000, minLevel: 40 },
      { potion: 'potionMinor', amount: 48, gold: 80000, minLevel: 50 },
      { potion: 'potionMinor', amount: 108, gold: 120000, minLevel: 60 },
    ],
    /** Éveil e → e+1 : 1 doublon du héros + essence d'éveil + or ; sans doublon, 6 essences de plus à la place.
     *  Demande l'ascension e (le 1er éveil est libre). */
    awaken: { copies: 1, essenceBase: 2, gold: 20000, noCopyEssence: 6 },
    /** Compétence niveau n → n+1 : grimoires = n, or = skillGold × n. */
    skillGold: 4000,
    /** Chance d'obtenir un équipement après une victoire de campagne. */
    gearDropChance: 0.65,
  },
  /** Recharge d'énergie contre cristaux : prix croissant, limitée par jour. */
  energyRefill: { amount: 60, costs: [10, 20, 40] }, // en diamants (v1.78.1)
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

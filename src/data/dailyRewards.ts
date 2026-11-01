import type { Reward } from './resources';

// Cycle de connexion de 28 jours. Les jours 7, 14, 21 et 28 sont des jours « majeurs ».
// Le cycle avance d'un cran par jour de connexion (pas besoin de connexions consécutives :
// on ne punit pas le joueur qui manque un jour).
export interface DailyRewardDef {
  day: number;
  reward: Reward;
  major?: boolean;
}

const base: Reward[] = [
  { gold: 5000 },
  { energy: 60 },
  { xpElixir: 5 },
  { shardDim: 3 },
  { crystals: 50 },
  { gold: 10000, forgeOre: 20 },
];

export const DAILY_REWARDS: DailyRewardDef[] = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  if (day === 7) return { day, major: true, reward: { shardAeon: 1, crystals: 100 } };
  if (day === 14) return { day, major: true, reward: { shardAeon: 2, skillTome: 2 } };
  if (day === 21) return { day, major: true, reward: { shardAeon: 3, rankSigil: 2, crystals: 150 } };
  if (day === 28) return { day, major: true, reward: { shardPrimal: 1, crystals: 250 } };
  const r = { ...base[i % base.length] };
  // Montée douce au fil du cycle
  const scale = 1 + Math.floor(i / 7) * 0.25;
  for (const k of Object.keys(r) as (keyof Reward)[]) r[k] = Math.round((r[k] ?? 0) * scale);
  return { day, reward: r };
});

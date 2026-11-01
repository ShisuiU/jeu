import type { SkillDef } from '../../data/types';

// Les améliorations de compétences sont décrites en texte dans les données (« +10 % dégâts », « Recharge -1 »…).
// Ce module les traduit en modificateurs chiffrés : une seule source de vérité pour l'affichage et le calcul.

export interface SkillMods { dmg: number; chance: number; heal: number; cd: number; shield: number; tm: number; lifesteal: number; revive: number; stack: number }

const RULES: [RegExp, keyof SkillMods, number][] = [
  [/\+(\d+) % dégâts/, 'dmg', 0.01],
  [/\+(\d+) % chance/, 'chance', 0.01],
  [/\+(\d+) % soins/, 'heal', 0.01],
  [/Recharge -(\d+)/, 'cd', -1],
  [/Bouclier \+(\d+) %/, 'shield', 0.01],
  [/\+(\d+) % jauge/, 'tm', 0.01],
  [/\+(\d+) % vol de vie/, 'lifesteal', 0.01],
  [/résurrection \+(\d+) %/, 'revive', 0.01],
  [/\+(\d+) % par cumul/, 'stack', 0.01],
];

export function parseUpgrade(text: string): Partial<SkillMods> | null {
  for (const [re, key, f] of RULES) {
    const m = text.match(re);
    if (m) return { [key]: Number(m[1]) * f };
  }
  return null;
}

export function skillMods(skill: SkillDef, level: number): SkillMods {
  const mods: SkillMods = { dmg: 0, chance: 0, heal: 0, cd: 0, shield: 0, tm: 0, lifesteal: 0, revive: 0, stack: 0 };
  for (const u of skill.upgrades.slice(0, Math.max(0, level - 1))) {
    const p = parseUpgrade(u);
    if (p) for (const [k, v] of Object.entries(p)) mods[k as keyof SkillMods] += v as number;
  }
  return mods;
}

export function effectiveCooldown(skill: SkillDef, level: number): number {
  return Math.max(skill.cooldown > 0 ? 1 : 0, skill.cooldown + skillMods(skill, level).cd);
}

import type { AffinityId, SkillDef } from '../../data/types';

// IDENTITÉ VISUELLE ET SONORE DES COMPÉTENCES
// Chaque compétence est décrite par : une ARME (le geste), un ÉLÉMENT (la matière de l'effet)
// et un MOUVEMENT (au corps à corps, projectile, zone, pluie, soutien). On les déduit du nom et
// de la description ; quelques cas particuliers sont fixés à la main dans OVERRIDES.

export type FxWeapon = 'blade' | 'blunt' | 'pierce' | 'claw' | 'whip' | 'none';
export type FxElement = 'fire' | 'ice' | 'poison' | 'lightning' | 'tech' | 'void' | 'holy' | 'nature' | 'star' | 'sand' | 'sound' | 'chain' | 'steel';
export type FxMotion = 'melee' | 'projectile' | 'aoe' | 'rain' | 'support' | 'self';
export interface SkillFx { weapon: FxWeapon; element: FxElement; motion: FxMotion; color: string }

export const ELEMENT_COLOR: Record<FxElement, string> = {
  fire: '#ff8a3a', ice: '#9fe3ff', poison: '#8be04e', lightning: '#d9e8ff', tech: '#5ff0ff', void: '#b07cff',
  holy: '#ffe08a', nature: '#7fd65a', star: '#c9d4ff', sand: '#e8c27a', sound: '#ffd6a0', chain: '#c9b7a0', steel: '#e8e2d6',
};

const has = (txt: string, re: RegExp) => re.test(txt);

const WEAPON_RULES: [FxWeapon, RegExp][] = [
  ['whip', /fouet|chaîne|fléau|entrave|fil noir|fil d’étoile/],
  ['claw', /croc|griffe|morsure|pince|bond/],
  ['pierce', /flèche|carreau|trait|volée|lance|estoc|scalpel|stylet|dague|dard|piqûre|pluie de la lisière/],
  ['blade', /lame|épée|hache|khopesh|faux|exécution|tranch|entaille|tourbillon/],
  ['blunt', /marteau|massue|pavois|poing|sceptre|branche|coup|assaut|ruée|séisme|phalange|bouclier réfracté/],
];

const ELEMENT_RULES: [FxElement, RegExp][] = [
  ['chain', /chaîne|fléau|entrave/],
  ['ice', /gel|glace|givre|cryo|froid|brume/],
  ['fire', /brûl|feu|flamm|braise|soufre|bûcher|brasier|encensoir|ardent|coulée|fumée|souffle doré|cendre/],
  ['poison', /poison|venin|toxi|corrosi|spore|empoison|dard|piqûre|sève noire/],
  ['tech', /drone|nanite|plasma|ionique|laser|rayon|salve|protocole|grille|calcul|essaim|surcharge|mémoire|corruption|réinitialisation|prisme|réfract/],
  ['lightning', /foudre|éclair|électr|décharge/],
  ['sound', /cloche|glas|cri |cri$|hymne|cantique|psaume|murmure|chant|rythme|écho|horde|défi/],
  ['star', /étoile|astr|météore|parallaxe|alignement|orbite|gravit|supernova|destin|trame/],
  ['sand', /sable|dune|simoun|mirage|tempête|oasis/],
  ['nature', /épine|ronce|racine|sève|floraison|forêt|écorce|liane|branche/],
  ['void', /néant|vide|ombre|éclipse|soleil noir|effacement|oubli|page blanche|découture|fil noir|terni|morte|creux|contrat|pacte|silence/],
  ['holy', /lumière|aube|aeon|cœur|battement|pulsation|sacré|recoudre|serment|rempart|muraille/],
];

const AFFINITY_ELEMENT: Record<AffinityId, FxElement> = { solar: 'fire', lunar: 'ice', telluric: 'steel', void: 'void' };

/** Cas où le texte induirait en erreur. */
const OVERRIDES: Record<string, Partial<SkillFx>> = {
  hesper_1: { weapon: 'none', element: 'tech', motion: 'projectile' },
  idris_1: { weapon: 'pierce', element: 'tech', motion: 'melee' },
  idris_3: { weapon: 'pierce', element: 'holy', motion: 'projectile' },
  isel_1: { weapon: 'none', element: 'star', motion: 'projectile' },
  caelum_1: { weapon: 'none', element: 'star', motion: 'projectile' },
  vaelshira_1: { weapon: 'whip', element: 'star', motion: 'projectile' },
  sulfura_1: { weapon: 'whip', element: 'fire', motion: 'projectile' },
  azhar_1: { weapon: 'blunt', element: 'void', motion: 'melee' },
  solenne_1: { weapon: 'none', element: 'holy', motion: 'projectile' },
  ondine_1: { weapon: 'pierce', element: 'star', motion: 'melee' },
  ondine_2: { weapon: 'pierce', element: 'star', motion: 'melee' },
  ondine_3: { element: 'star' },
  liran_1: { weapon: 'none', element: 'sound', motion: 'projectile' },
};

/** Même principe, par nom (compétences d'ennemis). */
const NAME_OVERRIDES: Record<string, Partial<SkillFx>> = {
  'Silence de cendre': { element: 'void' },
  'Éclipse calculée': { element: 'star' },
  'Tourbillon': { element: 'sand' },
  'Cantique de lumière': { element: 'holy' },
  'Effacement de mémoire': { element: 'void' },
};

export function skillFx(sk: SkillDef, affinity: AffinityId): SkillFx {
  const txt = `${sk.name} ${sk.description}`.toLowerCase();
  const nameTxt = sk.name.toLowerCase();
  const dmg = sk.effects.find((e) => e.kind === 'damage');
  const support = !dmg && sk.effects.some((e) => (e.kind === 'heal' || e.kind === 'shield' || e.kind === 'status' || e.kind === 'cleanse' || e.kind === 'revive') && (e.target === 'ally' || e.target === 'allAllies' || e.target === 'lowestAlly'));
  const foeStatus = !dmg ? sk.effects.find((e) => e.kind === 'status' && (e.target === 'enemy' || e.target === 'allEnemies' || e.target === 'randomEnemies')) : undefined;
  const selfOnly = !dmg && !support && !foeStatus;

  let weapon: FxWeapon = 'none';
  for (const [w, re] of WEAPON_RULES) if (has(nameTxt, re)) { weapon = w; break; }
  if (weapon === 'none') for (const [w, re] of WEAPON_RULES) if (has(txt, re)) { weapon = w; break; }

  let element: FxElement | null = null;
  for (const [el, re] of ELEMENT_RULES) if (has(nameTxt, re)) { element = el; break; }
  if (!element) for (const [el, re] of ELEMENT_RULES) if (has(txt, re)) { element = el; break; }
  if (!element) element = support ? 'holy' : weapon !== 'none' ? 'steel' : AFFINITY_ELEMENT[affinity];

  let motion: FxMotion;
  if (support) motion = 'support';
  else if (selfOnly) motion = 'self';
  else if (foeStatus) motion = foeStatus.target === 'allEnemies' ? 'aoe' : 'projectile';
  else if (dmg && (dmg.target === 'allEnemies')) motion = /pluie|volée|météore|tempête|averse|astres|salve/.test(txt) ? 'rain' : 'aoe';
  else if (weapon === 'pierce' && /flèche|carreau|trait|volée|dard/.test(txt)) motion = 'projectile';
  else if (weapon === 'blade' || weapon === 'blunt' || weapon === 'claw' || weapon === 'pierce') motion = 'melee';
  else if (weapon === 'whip') motion = 'melee';
  else motion = 'projectile';

  const base: SkillFx = { weapon, element, motion, color: ELEMENT_COLOR[element] };
  const o = OVERRIDES[sk.id] ?? NAME_OVERRIDES[sk.name];
  if (o) { Object.assign(base, o); base.color = ELEMENT_COLOR[base.element]; }
  return base;
}

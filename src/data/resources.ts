export type ResourceId =
  | 'gold' | 'crystals'
  | 'shardDim' | 'shardAeon' | 'shardPrimal' | 'shardEvent'
  | 'xpElixir' | 'skillTome' | 'rankSigil'
  | 'potionMinor' | 'potionGreater' | 'potionSupreme'
  | 'forgeOre' | 'awakenEssence' | 'masteryScroll';

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  icon: string; // identifiant d'icône SVG (ui/art/icons.tsx)
  color: string;
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  gold: { id: 'gold', name: 'Or', description: 'Monnaie universelle : améliorations, forge, montée de niveau.', icon: 'coin', color: '#ffcf5a' },
  crystals: { id: 'crystals', name: 'Cristaux d’Aeon', description: 'Ressource rare : recharge d’énergie, invocations spéciales. Obtenue uniquement en jouant.', icon: 'crystal', color: '#7fe7ff' },
  shardDim: { id: 'shardDim', name: 'Éclat terne', description: 'Invocation standard (Commun → Rare).', icon: 'shard', color: '#a9b0b8' },
  shardAeon: { id: 'shardAeon', name: 'Éclat d’Aeon', description: 'Invocation rare (Rare → Légendaire).', icon: 'shard', color: '#3d8bff' },
  shardPrimal: { id: 'shardPrimal', name: 'Éclat primordial', description: 'Ancienne monnaie, convertie en cristaux.', icon: 'shard', color: '#ffae2b' },
  shardEvent: { id: 'shardEvent', name: 'Éclat de faille', description: 'Invocation spéciale des événements.', icon: 'shard', color: '#ff3d6e' },
  xpElixir: { id: 'xpElixir', name: 'Élixir d’expérience', description: 'Donne de l’expérience à un héros.', icon: 'flask', color: '#9bdc6a' },
  skillTome: { id: 'skillTome', name: 'Grimoire de compétence', description: 'Améliore une compétence d’un héros.', icon: 'book', color: '#c7a0ff' },
  rankSigil: { id: 'rankSigil', name: 'Sceau de rang', description: 'Augmente le rang d’un héros (et son niveau maximum).', icon: 'sigil', color: '#ffd48a' },
  potionMinor: { id: 'potionMinor', name: 'Potion d’ascension mineure', description: 'Ascension des premiers paliers.', icon: 'potion', color: '#7fbf4d' },
  potionGreater: { id: 'potionGreater', name: 'Potion d’ascension majeure', description: 'Ascension des paliers intermédiaires.', icon: 'potion', color: '#6fa8ff' },
  potionSupreme: { id: 'potionSupreme', name: 'Potion d’ascension suprême', description: 'Ascension des derniers paliers.', icon: 'potion', color: '#ff6a9a' },
  forgeOre: { id: 'forgeOre', name: 'Minerai de forge', description: 'Améliore les équipements.', icon: 'ore', color: '#c08a5a' },
  masteryScroll: { id: 'masteryScroll', name: 'Parchemin de maîtrise', description: 'Apprend les maîtrises d’un héros (Sanctuaire, à partir du niveau 20).', icon: 'mscroll', color: '#c78bff' },
  awakenEssence: { id: 'awakenEssence', name: 'Essence d’éveil', description: 'Éveille les héros les plus avancés.', icon: 'essence', color: '#ff9bb5' },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

export type Reward = Partial<Record<ResourceId | 'energy', number>>;

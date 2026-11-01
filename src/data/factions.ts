import type { FactionDef, FactionId } from './types';

export const FACTIONS: Record<FactionId, FactionDef> = {
  valcrest: {
    id: 'valcrest',
    name: 'Empire de Valcrest',
    short: 'Valcrest',
    motto: '« Le serment tient quand les murs tombent. »',
    description:
      "Dernier grand royaume humain, Valcrest a survécu à la Fracture derrière ses murailles de pierre blanche. Chevaliers, prêtres-guerriers et espions y servent une couronne vacillante, dont l'autorité ne repose plus que sur des serments vieux de mille ans.",
    ambiance: 'Acier poli, bannières pourpres, cathédrales fortifiées, pluie sur les remparts.',
    colors: { primary: '#8e1b2b', secondary: '#d4a64a', glow: '#ffcf7a' },
    synergy: "Discipline : bonus de défense quand au moins 3 héros de Valcrest combattent ensemble.",
  },
  prism: {
    id: 'prism',
    name: 'Ordre du Prisme',
    short: 'Prisme',
    motto: '« La lumière se calcule. »',
    description:
      "Venus d'un futur que la Fracture a arraché à son époque, les ingénieurs-soldats du Prisme vivent dans des citadelles de verre et de métal. Ils réfractent l'énergie des éclats d'Aeon dans leurs armures et leurs lances à plasma.",
    ambiance: 'Exo-armures blanches, lignes cyan, hologrammes, drones silencieux.',
    colors: { primary: '#0f4c63', secondary: '#7fe7ff', glow: '#b8f6ff' },
    synergy: 'Réseau : la vitesse des héros du Prisme augmente pour chaque allié du Prisme.',
  },
  ash: {
    id: 'ash',
    name: 'Légion de Cendre',
    short: 'Cendre',
    motto: '« Tout brûle. Seul le pacte demeure. »',
    description:
      "Par la plus profonde des failles s'est déversée la Légion : seigneurs infernaux, damnés enchaînés et mortels ayant vendu leur nom. Certains de ses champions ont rompu avec leurs maîtres et combattent désormais le Néant — pour leurs propres raisons.",
    ambiance: 'Obsidienne fendue, braises, chaînes, cuir brûlé, cornes et fumée soufrée.',
    colors: { primary: '#5a1405', secondary: '#ff6a1f', glow: '#ffb35c' },
    synergy: 'Pacte : les héros de Cendre infligent plus de dégâts quand leurs PV sont bas.',
  },
  sylvaran: {
    id: 'sylvaran',
    name: 'Gardiens de Sylvaran',
    short: 'Sylvaran',
    motto: '« Nous étions là avant les rois. Nous serons là après. »',
    description:
      "Gardiens des forêts primordiales et des cercles de pierre, les Sylvarans se souviennent du monde d'avant. Druides, sentinelles de pierre et archers silencieux protègent les racines du Cœur d'Aeon enfouies sous leurs terres.",
    ambiance: 'Mousse, bronze patiné, runes gravées, brume de sous-bois, lumière dorée.',
    colors: { primary: '#1f3d22', secondary: '#9bbf5a', glow: '#d8f29a' },
    synergy: 'Racines : soins reçus augmentés pour toute l’équipe si un Sylvaran est présent.',
  },
  astral: {
    id: 'astral',
    name: 'Concordat Astral',
    short: 'Astral',
    motto: '« Les étoiles ne mentent pas ; elles se taisent. »',
    description:
      "Une civilisation d'observateurs venue d'au-delà du ciel déchiré. Le Concordat a vu d'autres mondes se faire dévorer par le Néant et refuse que cela se reproduise. Ses tisseurs manipulent la gravité et la trame du destin.",
    ambiance: 'Argent, violet profond, constellations vivantes, voiles flottants, silence.',
    colors: { primary: '#2a1650', secondary: '#c7b6ff', glow: '#efe6ff' },
    synergy: 'Constellation : les effets de soutien des héros Astraux durent un tour de plus.',
  },
  akkar: {
    id: 'akkar',
    name: "Hordes d'Akkar",
    short: 'Akkar',
    motto: '« Le désert garde les noms des braves. »',
    description:
      "Héritiers de civilisations antiques — cités de briques, rois-soleils et légions de bronze — les clans d'Akkar errent sur les Terres Dévastées. Ils combinent armes antiques et technologie récupérée dans les ruines des autres époques.",
    ambiance: 'Bronze, sable rouge, peintures de guerre, étendards en lambeaux, métal récupéré.',
    colors: { primary: '#6b3a12', secondary: '#e3a457', glow: '#ffd59a' },
    synergy: 'Fureur : chaque ennemi vaincu augmente l’attaque des héros d’Akkar.',
  },
};

export const FACTION_LIST = Object.values(FACTIONS);

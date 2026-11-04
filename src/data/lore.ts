// Récit principal — affiché dans le Codex. La campagne (phase 2) suivra ces chapitres.

export const GAME_TITLE = 'Aeonfall';
export const GAME_SUBTITLE = 'Les Héritiers de la Fracture';

export interface LoreEntry {
  id: string;
  title: string;
  text: string[];
}

export const LORE: LoreEntry[] = [
  {
    id: 'fracture',
    title: 'La Fracture',
    text: [
      "Au centre du monde battait le Cœur d'Aeon, un astre de cristal enfoui sous les montagnes, qui maintenait chaque époque à sa place : le passé derrière, l'avenir devant.",
      "Il y a douze ans, le Cœur s'est brisé. En une nuit, le ciel s'est ouvert en longues cicatrices de lumière violette. Les époques se sont effondrées les unes sur les autres.",
      "Des cités antiques de bronze sont apparues au milieu des forêts. Des citadelles de verre venues du futur se sont plantées dans les plaines. Par les failles les plus profondes, une légion infernale s'est déversée. Et au-delà du ciel déchiré, des étoiles se sont mises à regarder.",
      "Ce monde recousu de morceaux d'âges différents, ses habitants l'appellent désormais le Monde Cousu.",
    ],
  },
  {
    id: 'neant',
    title: 'Le Néant Silencieux',
    text: [
      "Par les coutures du Monde Cousu, quelque chose s'infiltre. Ce n'est ni un démon ni une armée : c'est une absence. Le Néant Silencieux efface. Les villages touchés ne sont pas détruits : ils cessent d'avoir existé, et même les souvenirs s'en vont.",
      "Ses serviteurs, les Effacés, sont des êtres de toutes les époques vidés de leur nom. Ils ne parlent pas. Ils avancent.",
    ],
  },
  {
    id: 'heritiers',
    title: 'Les Héritiers',
    text: [
      "Lorsque le Cœur s'est brisé, ses éclats se sont logés dans certaines personnes, sans distinction d'époque ou de peuple. Un chevalier, une ingénieure du futur, un démon renégat, une étoile vivante.",
      "Ces Héritiers résistent à l'Effacement. Mieux : ensemble, leurs éclats résonnent. Seuls, ils ne sont que des survivants. Réunis, ils sont la seule force capable de recoudre le monde.",
      "Tu es le Lien, celui ou celle dont l'éclat permet d'appeler les autres Héritiers à travers les failles. Ta mission : rassembler les Héritiers, reprendre les territoires au Néant et retrouver les fragments du Cœur d'Aeon.",
    ],
  },
  {
    id: 'coutures',
    title: 'Les Coutures du Monde',
    text: [
      "Après la Fracture, quelqu'un a recousu le monde, fil par fil : le Tisserand des Âges. Les coutures ont tenu douze ans.",
      "Quand le Cœur s'est remis à battre, elles ont commencé à lâcher. Par les déchirures reviennent les Échos : les effacés, qui ne savent plus leur nom. Les rappeler par leur nom suffit parfois à les ramener.",
    ],
  },
  {
    id: 'secret',
    title: 'Ce que personne ne sait',
    text: [
      "Les érudits de Valcrest accusent la Légion. Le Prisme accuse une erreur de calcul. Les Sylvarans accusent les rois. Tous se trompent.",
      "Quelque part dans les Terres Dévastées, un roi antique sait exactement pourquoi le Cœur s'est brisé. Il attend le bon moment pour le dire. Ou pour ne jamais le dire.",
    ],
  },
];


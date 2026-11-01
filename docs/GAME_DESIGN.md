# Game design — Aeonfall

*Nom provisoire : **Aeonfall — Les Héritiers de la Fracture**.*

## L'histoire

Au centre du monde battait le **Cœur d'Aeon**, un astre de cristal qui maintenait chaque époque à sa
place. Il y a douze ans, il s'est brisé : c'est **la Fracture**. Les époques se sont effondrées les
unes sur les autres — cités antiques de bronze au milieu des forêts, citadelles de verre venues du
futur, légion infernale jaillie des failles, observateurs stellaires derrière le ciel déchiré. Ce
patchwork d'âges s'appelle désormais **le Monde Cousu**.

Par ses coutures s'infiltre **le Néant Silencieux** : une absence qui efface villages, peuples et
souvenirs. Ses serviteurs, **les Effacés**, sont des êtres de toutes les époques vidés de leur nom.

Les éclats du Cœur se sont logés dans certaines personnes, sans distinction de peuple : **les
Héritiers**. Ils résistent à l'Effacement et, réunis, leurs éclats résonnent. Le joueur est **le
Lien**, l'Héritier capable d'appeler les autres à travers les failles (ce qui justifie les
invocations). But : rassembler les Héritiers, reprendre les territoires et retrouver les fragments
du Cœur. *Secret : le roi antique Azhar-Kesh sait que son rituel d'il y a 4 000 ans est la cause de
la Fracture.*

Pourquoi des civilisations ennemies combattent ensemble : face au Néant, aucune faction ne survit
seule, et seuls les Héritiers — quelle que soit leur origine — résistent à l'Effacement.

### Campagne prévue (7 chapitres × 10 niveaux × 4 difficultés)

| # | Chapitre | Région | Boss envisagé |
|---|---|---|---|
| 1 | Les Remparts de Cendre | Marches de Valcrest | Le Héraut Effacé |
| 2 | La Forêt qui Crie | Sylves de Sylvaran | L'Arbre-Mère corrompu |
| 3 | Verre et Poussière | Citadelle du Prisme | L'Intelligence Mère dévoyée |
| 4 | Les Dunes Rouges | Terres Dévastées d'Akkar | Le Colosse de bronze |
| 5 | Sous la Fosse | Abîme de la Légion | Un Seigneur de Cendre |
| 6 | Le Ciel Déchiré | Observatoire du Concordat | La Constellation Éteinte |
| 7 | Le Cœur d'Aeon | Le Cœur du Monde Cousu | La Voix du Néant |

Difficultés : Normal, Difficile, Expert, Cauchemar (ennemis plus forts, nouveaux effets, meilleures récompenses).

## Les six factions

| Faction | Inspiration | Ambiance | Synergie |
|---|---|---|---|
| **Empire de Valcrest** | Empire humain médiéval | Acier poli, bannières pourpres, cathédrales fortifiées | Discipline (défense) |
| **Ordre du Prisme** | Ordre technologique futuriste | Exo-armures blanches, lignes cyan, drones | Réseau (vitesse) |
| **Légion de Cendre** | Légion infernale (renégats) | Obsidienne, braises, chaînes | Pacte (dégâts à PV bas) |
| **Gardiens de Sylvaran** | Gardiens ancestraux | Mousse, bronze patiné, runes | Racines (soins) |
| **Concordat Astral** | Civilisation stellaire | Argent, violet, constellations vivantes | Constellation (durée des bonus) |
| **Hordes d'Akkar** | Civilisations antiques / terres dévastées | Bronze, sable rouge, métal récupéré | Fureur (attaque par ennemi vaincu) |

## Systèmes

- **Raretés** (6) : Commun, Peu commun, Rare, Épique, Légendaire, Mythique — multiplicateur de stats
  (×0,82 à ×1,35), rang de départ (1 à 6), plus de compétences, probabilités d'invocation.
- **Rôles** (6) : Attaquant, Défenseur, Support, Soigneur, Contrôleur, Assassin — chacun a son gabarit
  de statistiques (`data/roles.ts`).
- **Affinités** : Solaire ▸ Tellurique ▸ Lunaire ▸ Solaire (+30 % / −20 %), Néant neutre.
- **Statistiques** : PV, ATQ, DÉF, VIT, taux critique, dégâts critiques, précision, résistance.
  Formule unique dans `game/stats.ts` : gabarit du rôle × rareté × biais du héros × niveau × rang ×
  ascension × éveil (+ équipement en phase 3).
- **Progression** : niveau (max = rang × 10), rang 1→6, ascension 0→6, éveil 0→5, compétences
  améliorables, 7 emplacements d'équipement (arme, casque, armure, gants, bottes, accessoire, artefact).
- **Compétences** : attaque de base, spéciale, ultime, passif — effets structurés (dégâts, poison,
  brûlure, gel, étourdissement, baisse/hausse ATQ/DÉF/VIT, soin, bouclier, purification, jauge de
  tour, résurrection, vol de vie) interprétés par le moteur de combat.
- **Équipe** : 5 héros, 3 en première ligne et 2 en seconde ligne, un chef avec aura.
- **Combat** (phase 2) : tour par tour à jauge de vitesse, manuel ou automatique, vitesses ×1/×2/×3.
- **Économie** : or, énergie (1 / 4 min, max 120), cristaux, éclats d'invocation (terne, Aeon,
  primordial, faille), fragments de héros, élixirs d'XP, grimoires, sceaux de rang, potions
  d'ascension (3 tailles), minerai de forge, essence d'éveil. Constantes dans `data/balance.ts`.
- **Quotidien** : cycle de connexion de 28 jours sans pénalité en cas d'absence ; missions, défis
  et événements en phase 4.
- **Invocations** (phase 3) : taux affichés, invocations ×1 / ×10, garantie (pitié) pour les
  légendaires et mythiques, animation spéciale.

## Les 15 premiers héros

| Héros | Faction | Rareté | Rôle | Affinité |
|---|---|---|---|---|
| **Aldric Vaunt** — Capitaine du Mur Blanc | Valcrest | Rare | Défenseur | Tellurique |
| **Séraphine de Lys** — Prêtresse de la Dernière Aube | Valcrest | Épique | Soigneur | Solaire |
| **Corvin Ash** — Lame de la Chancellerie | Valcrest | Peu commun | Assassin | Lunaire |
| **Hesper K-7** — Ingénieure de l’Essaim | Prisme | Rare | Contrôleur | Lunaire |
| **Idris Kael** — Commandeur de la Lance Réfractée | Prisme | Légendaire | Attaquant | Solaire |
| **Varkhaal** — le Brisé, Chevalier du Pacte Rompu | Cendre | Épique | Défenseur | Néant |
| **Mère Sulfura** — Matriarche des Braises | Cendre | Légendaire | Contrôleur | Solaire |
| **Elowen Racine-Ancienne** — Druidesse du Cercle Vert | Sylvaran | Rare | Soigneur | Tellurique |
| **Torvald Pierre-Veille** — Sentinelle du Cromlech | Sylvaran | Commun | Défenseur | Tellurique |
| **Maëlis** — l’Archère Grise | Sylvaran | Peu commun | Attaquant | Lunaire |
| **Vael’Shira** — Tisseuse d’Étoiles | Astral | Légendaire | Support | Lunaire |
| **Isel** — Veilleuse d’Orbite | Astral | Peu commun | Support | Néant |
| **Brann** — Pillard des Dunes Rouges | Akkar | Commun | Attaquant | Solaire |
| **Kaedra Hurlecendre** — Lame du Simoun | Akkar | Épique | Assassin | Solaire |
| **Azhar-Kesh** — Roi-Soleil Déchu d’Ur-Akkar | Akkar | Mythique | Contrôleur | Néant |

Héros de départ : Torvald, Brann, Corvin, Elowen (une équipe équilibrée : défenseur, attaquant, assassin, soigneuse).

Fiches complètes (compétences, histoire, citations) : `src/data/heroes.ts` et dans le jeu.

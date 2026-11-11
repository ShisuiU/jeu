# Direction artistique

## Intentions

Réalisme stylisé de RPG mobile premium : proportions humaines crédibles, visages travaillés et
expressifs, armures et vêtements détaillés et uniques, armes reconnaissables, effets magiques et
technologiques lumineux. **Pas** de cartoon, de chibi, de proportions enfantines ni de visuels
génériques. Ambiance sérieuse, mystérieuse, parfois sombre, éclairée par la lueur violette de la
Fracture.

**Interface** : fond quasi noir, or vieilli pour les accents, violet « faille » pour le surnaturel,
typographie Cinzel (titres gravés) + Inter (lisibilité). Panneaux sombres translucides, liserés
dorés, lueurs discrètes, animations courtes.

## Ressources par héros

| Fichier | Usage | Format conseillé |
|---|---|---|
| `src/assets/heroes/<id>/portrait.webp` | cartes, avatar, formation | 768×1024, buste, fond de faction |
| `src/assets/heroes/<id>/full.webp` | fiche du héros, accueil | 1024×1536, en pied, fond de faction |
| `src/assets/heroes/<id>/battle.webp` | modèle de combat | PNG/WebP transparent, pose de combat |

Déposer le fichier suffit : il est détecté à la compilation et mis en cache hors ligne. En
l'absence d'illustration, un portrait vectoriel provisoire (silhouette, emblème, accessoire du
rôle aux couleurs du héros) est affiché.

## Intégrer une illustration

```bash
python3 scripts/import-art.py chemin/vers/image.png aldric          # héros
python3 scripts/import-art.py chemin/vers/image.png herald enemies  # ennemi
```

Le script produit `full.webp` (768×1152) et `portrait.webp` (recadrage buste 3:4, 600×800) dans
`src/assets/<heroes|enemies>/<id>/`. Format source conseillé : vertical 2:3 (1024×1536), tête dans
le tiers supérieur. Illustrations générées dans le fichier Figma « Aeonfall — Illustrations des héros ».

**Avancement :** les 88 héros ✓, les 40 ennemis ✓ (dont 17 boss), les 77 équipements ✓ et les 15 ressources du sac ✓, générés avec Figma (modèle gpt-image). Les ennemis n'utilisent que `portrait.webp`.

## Modèle de prompt de génération

> Digital painting, premium mobile RPG character art, realistic human proportions, detailed face,
> {LOOK}. Faction mood: {AMBIANCE}. Dramatic rim lighting, subtle violet rift glow in background,
> color palette {PALETTE}, highly detailed armor and fabric, three-quarter view, waist-up portrait,
> dark atmospheric background, no text, no watermark, not cartoon, not chibi.

## Fiches visuelles des héros

### Aldric Vaunt (`aldric`)
Homme d'une quarantaine d'années, barbe courte grisonnante, cicatrice sur la pommette gauche. Armure de plates complète en acier poli rehaussée d'or, tabard pourpre au lion de Valcrest. Immense pavois rectangulaire gravé de noms, épée bâtarde à la hanche.

*Palette : #8e1b2b, #d4a64a, #c9ccd2 · Faction : Empire de Valcrest — Acier poli, bannières pourpres, cathédrales fortifiées, pluie sur les remparts.*

### Séraphine de Lys (`seraphine`)
Femme d'une trentaine d'années, visage grave, cheveux blond cendré nattés sous une coiffe de mailles. Armure de plates légère sous une longue robe blanche et or, mains gantées tenant un encensoir de bronze qui brûle d'une flamme dorée.

*Palette : #f2e8d0, #d4a64a, #8e1b2b · Faction : Empire de Valcrest — Acier poli, bannières pourpres, cathédrales fortifiées, pluie sur les remparts.*

### Corvin Ash (`corvin`)
Homme mince d'environ vingt-cinq ans, visage anguleux, cheveux noirs mi-longs. Cape à capuche gris anthracite, brigandine de cuir noir cloutée, arbalète de poing ouvragée et stylet effilé.

*Palette : #1e1f26, #6b6f7a, #8e1b2b · Faction : Empire de Valcrest — Acier poli, bannières pourpres, cathédrales fortifiées, pluie sur les remparts.*

### Hesper K-7 (`hesper`)
Jeune femme d'environ vingt-huit ans, cheveux argentés coupés court, implants lumineux cyan le long de la tempe. Combinaison technique blanche et graphite, gantelet de contrôle holographique, nuée de petits drones triangulaires autour d'elle.

*Palette : #e9f3f7, #7fe7ff, #2c3a44 · Faction : Ordre du Prisme — Exo-armures blanches, lignes cyan, hologrammes, drones silencieux.*

### Idris Kael (`idris`)
Homme noir d'une quarantaine d'années, crâne rasé, regard dur, fine barbe. Exo-armure lourde blanche et dorée aux plaques segmentées, cœur réacteur lumineux sur le torse, longue lance à lame de plasma solaire.

*Palette : #f4f1ea, #ffbe4a, #0f4c63 · Faction : Ordre du Prisme — Exo-armures blanches, lignes cyan, hologrammes, drones silencieux.*

### Varkhaal (`varkhaal`)
Guerrier massif à la peau grise fissurée de veines incandescentes, deux cornes brisées, visage marqué mais humain. Armure d'obsidienne fendue d'où suinte une lueur orange, chaînes brisées enroulées autour des avant-bras.

*Palette : #1a1414, #ff6a1f, #5a1405 · Faction : Légion de Cendre — Obsidienne fendue, braises, chaînes, cuir brûlé, cornes et fumée soufrée.*

### Mère Sulfura (`sulfura`)
Femme d'âge indéterminé, grande et austère, peau pâle, yeux couleur de braise, longue chevelure noire tressée de fils d'or. Robe de cérémonie noire et pourpre brodée de runes incandescentes, couronne de fer à pointes, sceptre fumant.

*Palette : #120c10, #ff4f1f, #c9a14a · Faction : Légion de Cendre — Obsidienne fendue, braises, chaînes, cuir brûlé, cornes et fumée soufrée.*

### Elowen Racine-Ancienne (`elowen`)
Femme d'une vingtaine d'années, peau mate, longs cheveux châtains entrelacés de lierre, tatouages runiques verts sur les bras. Tenue de cuir souple et de lin, plastron de bronze patiné, bâton noueux surmonté d'un cristal ambré.

*Palette : #1f3d22, #9bbf5a, #b07a3c · Faction : Gardiens de Sylvaran — Mousse, bronze patiné, runes gravées, brume de sous-bois, lumière dorée.*

### Torvald Pierre-Veille (`torvald`)
Homme robuste d'une cinquantaine d'années, larges épaules, longue barbe tressée rousse et grise. Armure de cuir épais renforcée de plaques de pierre gravée, cape de fourrure, lourd marteau de pierre cerclé de bronze.

*Palette : #3b3a33, #9bbf5a, #8a6a3b · Faction : Gardiens de Sylvaran — Mousse, bronze patiné, runes gravées, brume de sous-bois, lumière dorée.*

### Maëlis (`maelis`)
Jeune femme élancée, cheveux gris clair tressés, visage fin couvert de traits de peinture cendrée. Manteau de chasse gris-vert à capuche, armure de cuir légère, grand arc long en bois clair gravé de runes.

*Palette : #3f4a44, #a9c4c9, #9bbf5a · Faction : Gardiens de Sylvaran — Mousse, bronze patiné, runes gravées, brume de sous-bois, lumière dorée.*

### Vael’Shira (`vaelshira`)
Femme grande et sereine à la peau bleu nuit parsemée de points lumineux comme des étoiles, longs cheveux blanc argenté flottant en apesanteur. Robe-armure argentée à voiles translucides violets, fils de lumière tissés entre ses doigts, halo en anneau derrière la tête.

*Palette : #1a1240, #c7b6ff, #efe6ff · Faction : Concordat Astral — Argent, violet profond, constellations vivantes, voiles flottants, silence.*

### Isel (`isel`)
Jeune femme d'environ dix-neuf ans (adulte), peau gris-lavande, grands yeux argentés, cheveux sombres coupés au carré. Combinaison argentée près du corps sous une cape courte violette, trois petites sphères en orbite autour de sa main.

*Palette : #2a1650, #b07cff, #d7d9e0 · Faction : Concordat Astral — Argent, violet profond, constellations vivantes, voiles flottants, silence.*

### Brann (`brann`)
Homme trapu et musclé d'une trentaine d'années, peau tannée, crâne rasé sur les côtés avec une crête de cheveux noirs, peinture de guerre rouge. Cuirasse de bronze cabossée renforcée de plaques de métal récupéré, cape en toile déchirée, hache de bronze à large lame.

*Palette : #6b3a12, #c2401c, #e3a457 · Faction : Hordes d'Akkar — Bronze, sable rouge, peintures de guerre, étendards en lambeaux, métal récupéré.*

### Kaedra Hurlecendre (`kaedra`)
Femme athlétique d'environ trente ans, peau brune, yeux soulignés de khôl, longue tresse noire, voile de sable sur le bas du visage. Armure de cuir et d'écailles de bronze, brassards dorés, deux khopesh courbes à lames sombres.

*Palette : #3d2414, #e3a457, #c2401c · Faction : Hordes d'Akkar — Bronze, sable rouge, peintures de guerre, étendards en lambeaux, métal récupéré.*

### Azhar-Kesh (`azhar`)
Homme d'une cinquantaine d'années à la stature royale, peau bronze, barbe noire tressée et ornée d'anneaux d'or, regard d'ambre lumineux. Armure cérémonielle de bronze et d'or noir, pectoral en disque solaire fissuré d'où s'échappe une lumière violette, cape pourpre, sceptre surmonté d'un soleil éclipsé.

*Palette : #2b1a0c, #ffcc66, #9a4dff · Faction : Hordes d'Akkar — Bronze, sable rouge, peintures de guerre, étendards en lambeaux, métal récupéré.*

### Merrin la Lanternière (`merrin`)
Femme d'une trentaine d'années au visage doux et fatigué, cheveux châtains noués sous un voile de lin blanc. Robe grise d'hospitalière avec un tablier taché, ceinture de fioles et de bandages, cotte de mailles légère dessous. Elle tient haut une lanterne de laiton dont la flamme dorée éclaire son visage.

*Palette : #e9e2cf, #f2b84b, #7a6a58 · Faction : Empire de Valcrest*

### Jory Fronde-Vive (`jory`)
Garçon d'environ seize ans, visage criblé de taches de rousseur, cheveux roux en bataille, sourire effronté. Tunique de laine verte rapiécée, cape de berger en peau de mouton, sacoche pleine de pierres rondes. Il fait tournoyer une fronde de cuir, une pierre gravée d'une rune luisante dans la poche.

*Palette : #4d6b3a, #c8742f, #a89a7a · Faction : Gardiens de Sylvaran*

### Sefa Dent-de-Sable (`sefa`)
Jeune femme d'une vingtaine d'années, peau hâlée, yeux noirs soulignés de khôl, cheveux noirs tressés serrés. Voile de sable couvrant le bas du visage, gilet de cuir clouté, bandes de tissu rouge aux bras. Deux poignards courbes à lame sombre, l'un dégoulinant d'un poison verdâtre.

*Palette : #b5562c, #2a1d18, #7bd84f · Faction : Hordes d'Akkar*

### Ansel Rivet (`ansel`)
Homme trapu d'une quarantaine d'années, moustache épaisse, nez cassé, regard placide. Exo-armure blanche usée et rayée aux plaques dépareillées, lignes cyan à moitié éteintes. Grand bouclier rectangulaire qui projette un champ d'énergie bleu pâle, matraque électrique à la ceinture.

*Palette : #d9dee2, #7fb8ff, #3a4048 · Faction : Ordre du Prisme*

### Rhoswen Voile-Pâle (`rhoswen`)
Jeune femme d'environ vingt-cinq ans, peau très pâle, longs cheveux argentés presque blancs, yeux gris lumineux. Robe de voiles violet profond et argent brodée de constellations qui scintillent, longs gants de soie. Elle tient un astrolabe d'argent ouvert d'où s'échappent de petites étoiles flottantes.

*Palette : #2a1f4a, #c9c3ff, #e8e6f2 · Faction : Concordat Astral*

### Brakka Cuir-Noir (`brakka`)
Homme colossal d'une quarantaine d'années, crâne rasé couvert de tatouages de braises, barbe noire tressée, petites cornes sombres sur le front. Tablier de cuir noir brûlé sur une armure d'obsidienne fissurée de lueurs orange. Immense couperet de boucher incandescent dans une main, crochet à viande enchaîné dans l'autre.

*Palette : #1a1414, #ff7a2f, #6b3a22 · Faction : Légion de Cendre*

### Ilse Corne-de-Brume (`ilse`)
Femme d'environ trente-cinq ans, visage anguleux, cheveux noirs coupés au carré mêlés de mèches blanches, yeux violets cernés. Long manteau de laine gris sombre à col de fourrure, plastron d'acier aux armes pourpres de Valcrest. Elle porte en bandoulière une grande corne de bronze gravée d'où s'échappe une brume violette glacée.

*Palette : #3a3a48, #9b7bff, #8e1b2b · Faction : Empire de Valcrest*

### Naerys Plume-d'Orage (`naerys`)
Femme élancée d'environ trente ans, peau brune, longs cheveux blancs ébouriffés par le vent, yeux d'un bleu électrique qui crépitent. Armure légère d'argent et de voiles violets, plumes sombres sur les épaules. Grand arc d'argent tendu, une flèche de verre chargée de foudre bleu-violet, éclairs autour d'elle.

*Palette : #2d2350, #8fd0ff, #d8d4ea · Faction : Concordat Astral*

### Gorm Poing-de-Lave (`gorm`)
Géant massif au corps de roche noire craquelée, des fissures de lave orange lumineuse sur les bras et le torse, visage humain aux traits lourds et yeux de braise. Restes de chaînes rompues aux poignets, pagne et épaulières de cuir brûlé. Ses poings énormes rougeoient comme du métal en fusion, fumée et braises autour de lui.

*Palette : #1c1714, #ff6a1f, #4a3a30 · Faction : Légion de Cendre*

### Zahra Lune-des-Puits (`zahra`)
Femme d'une quarantaine d'années, peau brun foncé, visage serein, yeux clairs couleur de lune, tatouages argentés sur le menton. Longue robe indigo et voile de lin blanc, bijoux de bronze et de lapis-lazuli. Elle porte une jarre de bronze d'où s'élève une eau lumineuse argentée qui flotte en spirale autour d'elle.

*Palette : #1f2a5a, #cfe3ff, #b0773a · Faction : Hordes d'Akkar*

# Architecture technique

## Choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Langage | **TypeScript** | Le typage protège le contenu (héros, compétences, sauvegarde) des erreurs quand le jeu grossit. |
| Interface | **React 18** | Écrans riches (collection, fiches, formations) ; écosystème mature, bon support Safari iOS. |
| Compilation | **Vite** | Chargement très rapide, code découpé et optimisé, images empreintées automatiquement. |
| État du jeu | **Zustand + Immer** | Un seul store minuscule (≈ 3 Ko) ; les mutations Immer gardent la sauvegarde immuable. |
| Sauvegarde | **IndexedDB** (via `idb`) | Robuste, gros volume, non effacé pour une PWA installée. Miroir de secours en localStorage. |
| Hors ligne | **Service worker Workbox** (`vite-plugin-pwa`) | Pré-cache de tout le jeu (code, polices, illustrations). |
| Combat (phase 2) | Moteur TypeScript pur + rendu DOM/CSS | Le combat au tour par tour n'a pas besoin d'un moteur de jeu lourd ; les animations CSS sont accélérées par le GPU sur iPhone. Un rendu canvas/PixiJS pourra être ajouté pour les effets si nécessaire. |
| Polices | Cinzel + Inter auto-hébergées | Fonctionnent hors ligne, pas d'appel à Google Fonts. |
| Sons | WebAudio synthétisé | Aucun fichier à télécharger. Des musiques pourront être ajoutées plus tard. |

**Orientation : portrait.** Le jeu se joue à une main, en sessions courtes (15 min / jour), et iOS
ne permet pas de verrouiller l'orientation d'une PWA de façon fiable : le portrait est le mode
naturel du téléphone. Les écrans de gestion (collection, équipement, fiches) sont aussi bien plus
lisibles en portrait. Le combat sera conçu en portrait : équipe du joueur en bas, ennemis en haut.

## Organisation des dossiers

```
src/
  core/        utilitaires purs : horloge de confiance, empreinte, identifiants
  data/        TOUT le contenu du jeu (piloté par les données)
    heroes.ts      les héros (stats, compétences, histoire, description visuelle)
    factions.ts    rarities.ts  roles.ts  affinities.ts
    resources.ts   ressources de l'économie
    balance.ts     constantes d'équilibrage centralisées
    dailyRewards.ts  lore.ts
  game/        règles du jeu, sans interface : stats, énergie, récompenses, connexion quotidienne
  save/        schéma versionné, migrations, IndexedDB, export/import, interface cloud future
  state/       store du jeu (état + actions) et navigation
  audio/       effets sonores
  ui/
    art/         emblèmes, icônes, portraits (images ou vectoriel provisoire), décors
    components/  briques d'interface
    screens/     un fichier par écran
  assets/heroes/ illustrations (détectées automatiquement)
tests/         tests unitaires (Vitest)
```

Règle : `data/` et `game/` ne dépendent jamais de l'interface. Le moteur de combat (phase 2) sera
dans `game/battle/`, testable sans navigateur, ce qui permettra plus tard de le faire tourner
côté serveur (arène entre joueurs) sans réécriture.

## Moteur de combat

`src/game/battle/` — TypeScript pur, aucune dépendance à l'interface, **déterministe** (graine aléatoire) :

- `engine.ts` : création du combat (aura du chef, synergies), jauge de tour, résolution des effets,
  dégâts, statuts, vagues, fin de combat. `beginTurn()` avance jusqu'à la prochaine unité capable
  d'agir ; `performAction()` exécute une compétence. Chaque étape produit des **événements**
  (dégâts, soins, statuts…) que l'interface anime.
- `ai.ts` : choix de compétence et de cible (mode auto et ennemis).
- `skillMods.ts` : traduit les textes d'amélioration (« +10 % dégâts », « Recharge -1 ») en chiffres.
- `simulate.ts` : joue un combat entier ; sert aux tests d'équilibrage et servira à l'arène.

Formules : dégâts = stat × multiplicateur × 600 / (600 + DÉF cible) × affinité × critique × ±5 %.
Chance d'effet néfaste = chance de la compétence, puis résistance = (RÉS − PRÉ) / 200 (max 80 %).

La campagne (`data/campaign.ts`) et les ennemis (`data/enemies.ts`) sont des données : ajouter un
chapitre ou un ennemi ne demande aucune modification du moteur. La progression est enregistrée par
difficulté (`normal:1-3`), prête pour les difficultés de la phase 4.

## Progression (phase 3)

- `game/summon.ts` — tirages, garanties, doublons → fragments.
- `game/upgrade.ts` — élixirs, rang, ascension, éveil, compétences : chaque action a une fonction
  `…Check()` (conditions + coût, utilisée par l'interface) et une fonction d'exécution.
- `game/gear.ts` — génération, forge, ensembles, calcul des bonus ; `game/heroStats.ts` combine
  progression et équipement. Le combat reçoit ces bonus via `teamSetups()`.

## Sauvegarde

- **Format versionné** (`SAVE_VERSION` dans `save/schema.ts`). Toute évolution de structure ajoute
  une migration dans `save/migrations.ts` ; les anciennes sauvegardes passent par toutes les étapes.
- **Normalisation** : au chargement, les champs manquants sont complétés, les héros retirés du jeu
  et les références cassées (équipes) sont nettoyés.
- **Autosauvegarde** 1,5 s après chaque modification + écriture immédiate quand l'app passe en
  arrière-plan (`visibilitychange`, `pagehide`) — iOS peut fermer l'app sans prévenir.
- **Intégrité** : chaque enregistrement porte une empreinte ; une sauvegarde corrompue est ignorée
  au profit de la plus récente valide (IndexedDB, miroir localStorage, puis copies de secours).
- **Copies de secours** : 6 copies tournantes (démarrage, toutes les 10 min, avant import /
  restauration / réinitialisation). Une réinitialisation reste donc annulable.
- **Export / import** : texte `AEONFALL1:…` (fichier via la feuille de partage iOS, ou copier-coller).
  Empreinte vérifiée, confirmation avec résumé avant remplacement.
- **Cloud (futur)** : interface `SyncProvider` dans `save/sync.ts`, résolution de conflit par
  `saveId` + `revision`. Aucune dépendance serveur aujourd'hui.

## Temps, énergie et anti-triche hors ligne

Sans serveur, l'heure du téléphone n'est pas fiable. `core/time.ts` mémorise la plus grande heure
jamais observée (`highWater`). Si l'horloge recule, le jeu continue d'utiliser `highWater` :
avancer l'heure pour récolter puis revenir en arrière ne fait qu'emprunter sur l'avenir — énergie
et récompenses quotidiennes restent gelées jusqu'à ce que le temps réel rattrape. L'énergie ne
s'accumule jamais au-delà du maximum, donc avancer l'heure ne rapporte pas plus qu'attendre.

## Performance

- Écrans chargés à la demande (`React.lazy`) : l'écran titre et l'accueil s'affichent avec ~64 Ko
  de code compressé ; les autres écrans sont pré-cachés par le service worker et s'ouvrent
  instantanément, même hors ligne.
- Animations en CSS (accélérées par le GPU), illustrations vectorielles légères, sons et musique
  synthétisés (aucun fichier audio).
- L'horloge du jeu tourne une fois par seconde mais n'écrit la sauvegarde que lorsqu'une valeur
  change réellement (énergie, réinitialisations).

## Hors ligne et mises à jour

Le service worker pré-cache tout le jeu au premier chargement. Une nouvelle version publiée est
téléchargée en arrière-plan ; le joueur voit « Nouvelle version disponible » et choisit quand
recharger (la partie est sauvegardée avant). Les événements temporaires (phase 4) seront décrits
par un fichier JSON séparé, mis à jour sans republier le code.

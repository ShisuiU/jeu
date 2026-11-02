# Feuille de route

## ✅ Phase 1 — Fondations (terminée)

- Nom provisoire, univers, histoire, 6 factions, 15 héros complets (stats, compétences structurées, histoire, description visuelle)
- Architecture React + TypeScript + Vite, contenu piloté par les données
- PWA : installable sur l'écran d'accueil iPhone, plein écran, hors ligne (pré-cache Workbox), mises à jour proposées
- Sauvegarde IndexedDB versionnée + miroir localStorage + 6 copies de secours + export/import + migrations
- Horloge de confiance anti-recul, énergie régénérée même app fermée
- Écrans fonctionnels : titre, accueil, collection (filtres, tri, héros à découvrir), fiche héros (stats calculées, compétences, histoire), équipe et formation (3 équipes, chef, synergies), sac (ressources), connexion quotidienne (28 jours), codex, paramètres, sauvegarde
- Tests : 22 tests unitaires + test de bout en bout sur dimensions iPhone (persistance, export/import, hors ligne)

## ✅ Phase 2 — Premier contenu jouable (terminée)

- Moteur de combat au tour par tour (`src/game/battle/`) : jauge de vitesse, dégâts (ATQ/DÉF/PV, critiques, affinités, ignorance de DÉF), 13 effets (poison, brûlure, gel, étourdissement, baisses/hausses ATQ/DÉF/VIT, bouclier, régénération, provocation, purification, jauge de tour, résurrection, vol de vie), recharges, niveaux de compétences, passifs (Varkhaal, Hesper, Azhar, Kaedra, Sulfura), aura du chef, 6 synergies de faction, formation (seconde ligne protégée), vagues, boss (immunités, furie)
- IA du mode automatique (utilisée aussi par les ennemis), combat manuel avec choix de compétence et de cible, vitesses ×1/×2/×3 mémorisées
- 7 types d'Effacés + le boss « Le Héraut Effacé »
- Chapitre 1 « Les Remparts de Cendre » : 10 niveaux, dialogues avant/après, étoiles (★★★ sans K.O.), récompenses de première victoire et de rejeu, coût en énergie, déblocage d'Aldric en battant le boss
- Expérience des héros (niveau limité par le rang) et niveau de compte (or + énergie à chaque niveau)
- Équilibrage vérifié par simulation automatique (tests/balance.test.ts)
- 38 tests unitaires + tests de bout en bout (combat manuel, auto, boss, résultats, persistance)

## ✅ Phase 3 — Collection et progression (terminée)

- Invocations : 5 bannières (standard, rare, épique, légendaire, événement « Faille de Cendre » avec héros en vedette), taux affichés, ×1 / ×10, garanties (pitié par bannière, Épique garanti dans un ×10 rare), animation de portail et animation spéciale Légendaire/Mythique, historique
- Doublons → fragments ; obtenir un héros manquant avec ses fragments
- Amélioration des héros : élixirs d'expérience, rang (niveau max +10), ascension (6 paliers, potions), éveil (5 niveaux, fragments + essence), compétences (grimoires) — coûts centralisés dans `data/balance.ts`
- Équipement : 7 emplacements, 5 raretés, stat principale + jusqu'à 4 secondaires, 7 ensembles (dont Célérité et Sang-vif), forge jusqu'à +15 (secondaires aux niveaux 4/8/12), verrou, démantèlement (unitaire et groupé), butin de campagne
- Équipement et bonus d'ensemble appliqués en combat
- Butin aléatoire de campagne (élixirs, minerai, potions, grimoires, sceaux, essence)
- Courrier (récompenses uniques pilotées par les données), cadeau de mise à jour
- Sauvegarde v2 avec migration automatique depuis la v1
- 57 tests unitaires + tests de bout en bout (invocation, amélioration, équipement)

## ✅ Phase 4 — Contenu avancé (terminée)

- Écran de combat et écran de préparation communs à tous les modes (`game/modes.ts`)
- 4 donjons de 10 étages (Forge Engloutie : équipement garanti ; Grotte d'Ambre : élixirs ; Laboratoire Brisé : potions ; Archives Effacées : grimoires, sceaux, essence), chacun avec son gardien
- Tour des Âges : 50 étages générés, sans énergie, Sentinelle tous les 10 étages
- Boss mondial (Colosse de Bronze) : 4 niveaux, 45 actions par combat, récompenses selon 6 paliers de dégâts, 3 clés par jour
- Arène contre l'ordinateur : adversaires calibrés sur la puissance du joueur, classement, 5 ligues, 5 tickets par jour
- Missions journalières (7 + coffre) et hebdomadaires (7 + coffre), 19 récompenses de progression
- Événements téléchargés depuis `public/events.json` (objectifs, défi spécial, bannière, bonus de donjon) — voir [EVENTS.md](EVENTS.md)
- Difficultés Difficile / Expert / Cauchemar pour la campagne
- Réinitialisations quotidiennes et hebdomadaires fondées sur l'horloge de confiance
- Sauvegarde v3 avec migration ; 70 tests unitaires + 5 parcours de bout en bout

## ✅ Phase 5 — Finitions (terminée, version 1.0.0)

- Performance : écrans chargés à la demande (code de démarrage divisé par deux : 127 → 64 Ko compressés), tout reste pré-caché pour le hors-ligne
- Robustesse : filet de sécurité en cas d'erreur d'écran (retour à l'accueil, sauvegarde de secours copiable), alerte en cas d'échec d'écriture
- Animations : entailles colorées par affinité, ondes des attaques de zone, effets de soin/bouclier/bonus/malus, flash critique, mise en scène des ultimes (respecte « Animations réduites »)
- Musique d'ambiance procédurale (menu et combat), réglable, coupée en arrière-plan
- Guide de démarrage au premier lancement (relançable), réglages de combat par défaut
- Tests : sauvegarde de référence v1 migrée vers la version actuelle, 300 actions aléatoires sans corruption, manifeste d'installation, service worker, hors-ligne — 72 tests unitaires + 6 parcours de bout en bout

## ✅ Version 1.1.0 — Chapitres 2 à 7

- 6 nouveaux chapitres (60 niveaux) : Sylvaran, Prisme, Akkar, la Fosse, le Ciel déchiré, le Cœur d'Aeon — fin de l'histoire principale
- 24 nouveaux ennemis (dont 6 boss), 6 nouveaux héros obtenus en battant chaque boss (dont Solenne, Mythique)
- Un décor par région (combat, donjons, tour, boss mondial), sélecteur de chapitre
- Récompenses de progression par chapitre ; puissance des ennemis calibrée par simulation et testée

## ✅ Version 1.2.0 — Confort de jeu

- Balayage : rejouer instantanément (×1, ×5, ×10, max) un niveau de campagne à 3 étoiles ou un étage de donjon terminé — mêmes coûts, mêmes récompenses, résultat calculé par le moteur
- Recharge d'énergie contre cristaux (+60, 3 fois par jour : 50 / 100 / 200 cristaux)
- « Équiper le meilleur » sur la fiche d'un héros (n'emprunte jamais l'équipement d'un autre héros)
- « Composer l'équipe recommandée » (défenseur devant, soigneur derrière, meilleure aura de chef)

## ✅ Version 1.3.0 — Illustrations des héros

- Les 21 héros ont leur illustration définitive (portrait + illustration complète), générées avec Figma à partir des fiches visuelles
- Intégration automatique via `scripts/import-art.py` ; ~5 Mo, mis en cache pour le hors-ligne

## ✅ Version 1.4.0 — Illustrations des ennemis

- Les 36 ennemis illustrés (Effacés, créatures des six régions, 7 boss de chapitre, 4 gardiens de donjon, Sentinelle de la Tour, Colosse du boss mondial)
- Plus aucune silhouette provisoire dans le jeu

## ✅ Version 1.5.0 — Interface allégée

- Accueil épuré : grande illustration du chef d'équipe, 3 raccourcis (Missions, Événements, Courrier) et le bouton Campagne
- Nouvelle barre du bas : Accueil, Héros, Invoquer, Combats, Menu ; nouvel écran « Combats » qui regroupe tous les modes
- Menu rangé par thèmes ; filtres des héros sur une seule ligne
- Combat plus lisible : décors peints selon la région, moins de textes flottants, effets d'état en pastilles, personnages plus grands
- Écran titre illustré, messages plus discrets en bas d'écran, missions et sac simplifiés, divers défauts d'alignement corrigés

## ✅ Version 1.6.0 — Sanctuaire et Forge

- **Sanctuaire** : lieu dédié aux améliorations des héros (niveau, rang, ascension, éveil, compétences), avec sélecteur de héros et pastille quand une amélioration est possible
- **Forge** : lieu dédié à l'équipement (renforcer, démanteler, démantèlement groupé)
- Accès depuis l'accueil (colonne de gauche), le Menu et la fiche du héros (« Améliorer au Sanctuaire », « Renforcer à la Forge »)
- La fiche du héros garde Infos et Équipement (équiper/retirer) ; une illustration déposée dans `src/assets/places/<sanctuary|forge>.webp` remplace automatiquement la scène dessinée

## Suites possibles

- Nouveaux arcs narratifs et héros après la fin de l'histoire principale
- Synchronisation cloud facultative (interface `SyncProvider` prête), classements, arène entre joueurs, guildes

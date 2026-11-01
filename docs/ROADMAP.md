# Feuille de route

## ✅ Phase 1 — Fondations (terminée)

- Nom provisoire, univers, histoire, 6 factions, 15 héros complets (stats, compétences structurées, histoire, description visuelle)
- Architecture React + TypeScript + Vite, contenu piloté par les données
- PWA : installable sur l'écran d'accueil iPhone, plein écran, hors ligne (pré-cache Workbox), mises à jour proposées
- Sauvegarde IndexedDB versionnée + miroir localStorage + 6 copies de secours + export/import + migrations
- Horloge de confiance anti-recul, énergie régénérée même app fermée
- Écrans fonctionnels : titre, accueil, collection (filtres, tri, héros à découvrir), fiche héros (stats calculées, compétences, histoire), équipe et formation (3 équipes, chef, synergies), sac (ressources), connexion quotidienne (28 jours), codex, paramètres, sauvegarde
- Tests : 22 tests unitaires + test de bout en bout sur dimensions iPhone (persistance, export/import, hors ligne)

## Phase 2 — Premier contenu jouable

- Moteur de combat au tour par tour (jauge de vitesse, effets, affinités, IA du mode auto, vitesses ×1/×2/×3)
- Écran de combat portrait avec animations et effets
- Ennemis (Effacés) et premier boss
- Chapitre 1 de la campagne (10 niveaux, dialogues, étoiles, récompenses, coût en énergie)
- Expérience de combat → montée de niveau des héros et du compte

## Phase 3 — Collection et progression

- Invocations (5 types, taux affichés, ×1/×10, garantie, animations légendaire/mythique), fragments
- Montée de niveau, rang, ascension, éveil, amélioration des compétences
- Équipement (7 emplacements, raretés, stats principales/secondaires, ensembles, forge)

## Phase 4 — Contenu avancé

- Donjons (équipement, expérience, potions, compétences), tour de progression, boss mondial
- Missions journalières/hebdomadaires, récompenses de progression, événements (fichier JSON distant)
- Difficultés Difficile / Expert / Cauchemar, arène contre l'IA

## Phase 5 — Finitions

- Illustrations définitives, animations, musique, optimisation, tests iPhone réels, déploiement

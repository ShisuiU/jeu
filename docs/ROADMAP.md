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

## ✅ Version 1.7.0 — Écran d'ouverture

- Illustration réaliste du Monde Cousu (Valcrest, Akkar, le Prisme, Sylvaran, les failles de cendre sous le Cœur d'Aeon brisé), générée avec Figma
- Animations : travelling de caméra, pulsation du Cœur, braises, apparition du logo ; titre adapté aux petits écrans

## ✅ Version 1.8.0 — Lieux illustrés et combats lisibles

- Illustrations réalistes du Sanctuaire et de la Forge (bannière + fond flouté de l'écran)
- Combat : la taille des cartes s'adapte au nombre réel de rangées et à la hauteur de l'écran — plus aucun chevauchement, cartes plus grandes quand il y a de la place ; pastilles d'état posées sur le portrait

## ✅ Version 1.9.0 — Sanctuaire et Forge simplifiés

- Un héros à la fois : bande de portraits en haut, l'illustration du lieu en fond
- Sanctuaire : une ligne par amélioration (Niveau, Rang, Ascension, Éveil, Compétences) avec un seul bouton ; cadenas quand une condition manque ; compétences dans une fenêtre
- Forge : on choisit un héros (ou le Sac) et on voit ses 7 emplacements ; Démanteler ne montre que les objets libres ; filtres réduits aux emplacements

## ✅ Version 1.10.0 — Style « métal forgé »

- Blocs refaits : coins presque droits, boutons en plaques biseautées, matière granuleuse, équerres dorées aux coins, onglets soulignés ; plus de pilules, de halos ni de reflets animés
- Textes : suppression des tirets cadratins au milieu des phrases (histoire, dialogues, fiches, aide)

## ✅ Version 1.11.0 — Tri, filtres et confort

- Tri par menu déroulant et filtres dans un panneau qui monte du bas (Héros, choix d'un héros pour une équipe, Forge) ; filtres actifs affichés en étiquettes retirables ; choix mémorisés
- Héros : filtres Faction, Rôle, Rareté, Affinité ; tri Puissance, Rareté, Niveau, Nom. Objets : Emplacement, Rareté, Ensemble
- Retour en arrière par glissement depuis le bord gauche ; position dans les listes retrouvée au retour
- Combat : appui long sur une carte pour voir ses PV, ses statistiques et ses effets en cours
- Plus de voile flou en haut des écrans ; logo de l'écran d'ouverture animé sans à-coups
- Correctif iPhone (1.11.1) : barre d'état opaque. Le mode transparent faisait flouter le haut de l'écran par iOS et raccourcissait la zone d'affichage (bande vide en bas) ; énergie au-delà du maximum affichée en vert

## ✅ Version 1.12.0 — Retours de joueurs

- Missions : notification « Mission accomplie » (avec bouton Voir) dès qu'une récompense devient réclamable ; nombre de récompenses sur chaque onglet ; pastille sur l'icône de l'app quand l'appareil le permet
- Sanctuaire : porte-monnaie des ressources d'amélioration (or, élixirs, sceaux, grimoires, potions, essence), aussi dans la fenêtre des compétences
- Combat : descriptions des compétences affichées en entier (hauteur calculée sur la plus longue description de l'équipe) ; boutons ronds remplacés par des cartes de compétences (type, nom, recharge) ; message d'état quand ce n'est pas votre tour

## ✅ Version 1.13.0 — Animations et bruitages par compétence

- Chaque compétence a une identité (arme, élément, trajet) déduite de son nom et de sa description, avec quelques réglages à la main (`src/ui/fx/skillFx.ts`)
- Trajets : projectiles orientés (flèches, carreaux, boules de feu, éclats de glace, lasers, étoiles, ondes), pluies (flèches, météores), explosions de zone, rayons de soutien, auras
- Impacts par arme (entailles, onde de choc avec secousse, éclats, griffures, claquement) et par élément (flammes, cristaux, bulles, éclair, parasites, implosion, rayons, épines…)
- Bruitages synthétisés (sans fichier) pour le lancement et l'impact de chaque arme et élément, les soins, boucliers, états, K.O. et résurrections (`src/audio/battleSfx.ts`)
- États visibles en permanence : givre, braises, bulles de poison, étoiles d'étourdissement, halo de bouclier et de provocation

## ✅ Version 1.14.0 — L'Autel des Failles

- Invocation refaite dans l'univers : le Lien pose un éclat du Cœur d'Aeon sur l'autel (illustration dédiée) ; choix de l'éclat (Terne, Aeon, Épique, Primordial, Faille) avec le nombre possédé
- Garantie présentée comme la « fissure du Cœur » ; taux et derniers appels dans des fenêtres
- Révélation : l'éclat monte et se fissure, vole en morceaux, une faille se déchire du ciel à l'autel à la couleur de la rareté (secousse et titre pour Légendaire/Mythique), puis l'Héritier en sort en silhouette avant d'être éclairé ; en ×10, les cartes jaillissent de la faille
- Bruitages dédiés (éclat qui vibre, éclatement, déchirure, accord selon la rareté, sortie de l'Héritier)
- iPhone : marge du bas supprimée quand iOS réserve déjà le bas de l'écran ; barre du bas affinée ; mesures d'affichage dans Paramètres
- 1.14.1 : fiche du héros allégée, Compétences et Histoire repliées par défaut (touchez pour les ouvrir)

## ✅ Version 1.15.0 — Fiches et textes allégés

- Fiche du héros : résumé doux (niveau, puissance, rang, ascension, éveil) avec un petit bouton « Améliorer » ; statistiques compactes à abréviations (PV, ATQ, DÉF, VIT, CRIT %, CRIT DMG %, PRÉ, RÉS) avec icônes et bonus d'équipement en vert
- Moins de texte partout : explications déplacées derrière un petit bouton « i » (Équipe, Tour, Boss mondial, Campagne), phrases superflues retirées (connexion, sac, forge, objets, balayage, sauvegarde, combats)

## ✅ Version 1.16.0 — Affinités et identités

- Logos communs : affinité (soleil Solaire, montagne Tellurique, croissant Lunaire, faille-œil Néant) et rôle (lame, bouclier, étendard, croix, maillons, dague)
- Fiche du héros : bandeau Rareté · Affinité · Rôle · Famille ; chaque pastille s'explique au toucher (avantages d'affinité, rôle, synergie de faction)
- Cartes de héros : affinité et rôle en haut à droite, famille à côté des étoiles
- Combat : logo d'affinité sur chaque carte ; au ciblage, « ▲ +30 % » (avantage) ou « ▼ −20 % » (faiblesse) au-dessus des ennemis ; ▲/▼ sur les dégâts ; affinité dans la fiche d'unité (appui long)
- Préparation : affinité et rôle de chaque ennemi, conseil « Ennemis surtout X · conseillé Y »

## ✅ Version 1.17.0 — Fiche du héros avec équipement

- Vitrine du héros : illustration au centre, 7 emplacements d'équipement autour (arme, casque, armure à gauche ; gants, bottes, accessoire à droite ; artefact en bas), cadre à la couleur de la rareté de l'objet, niveau de forge et ensemble
- Emplacement vide : choix d'un objet ; emplacement plein : fiche de l'objet avec Changer, Retirer, Renforcer à la Forge
- Flèches héros précédent / suivant (dans l'ordre et les filtres de l'écran Héros) ; ensembles actifs et bouton « Auto » sous le nom
- Plus d'onglets Infos / Équipement : tout est sur la même fiche

## ✅ Version 1.18.0 — Tutoriel guidé

- Tutoriel en situation (`Coach.tsx`) : l'élément à toucher est éclairé, le reste assombri, une phrase courte. 11 étapes dans l'ordre : Campagne, premier niveau, Combattre, choix de compétence, cible (▲/▼ d'affinité), AUTO et vitesse, Invoquer, premier appel, Sanctuaire, élixirs, équipement
- Toucher l'élément valide l'étape ; « OK » ou « Passer le tutoriel » à tout moment ; joueurs déjà avancés dispensés ; relance depuis Paramètres
- Guide d'ouverture réduit à une page ; pas de message « Mission accomplie » par-dessus le tutoriel

## ✅ Version 1.19.0 — Chapitre 8 : Les Coutures du Monde

- Suite de l'histoire après la Voix du Néant : les coutures entre les époques lâchent, les Échos (les effacés) reviennent sans nom, et le Tisserand des Âges veut découdre le monde pour en tisser un « parfait »
- 10 niveaux × 4 difficultés, dialogues écrits, décor dédié, équilibrage vérifié par simulation (niveaux 58 à 66)
- 2 nouveaux héros illustrés : Liran Nom-Rendu (Épique, Support, Néant, débloqué au niveau 8-5) et Ondine Fil-d'Argent (Légendaire, Assassin, Lunaire, débloquée au boss)
- 4 nouveaux ennemis illustrés : Écho errant, Golem recousu, Rôdeur des coutures et le boss, le Tisserand des Âges
- Codex : « Les Coutures du Monde » ; nouvelles récompenses (chapitre 8, posséder les 23 héros)
- Tutoriel : validation d'une étape au doigt relevé (plus de message qui surgit sous le doigt)

## ✅ Version 1.20.0 — Expéditions

- Nouveau mode (Combats → Expéditions) : 4 expéditions par jour vers les régions du Monde Cousu (1 h à 12 h, 1 à 3 héros), retour en temps réel même jeu fermé
- Butin selon la région (or, élixirs, minerai, grimoires, sceaux, potions, essence, cristaux, éclats) ; +30 % si un héros de l'affinité, du rôle ou de la famille demandés part ; ×0,6 à ×1,3 selon la puissance de l'équipe ; aperçu avant le départ
- Héros en expédition toujours disponibles pour combattre ; « Rappeler » pour annuler
- Notification « expédition de retour », pastille sur Combats, nouvelle mission quotidienne « Terminer 1 expédition »
- Offres déterministes par jour et par partie (horloge de confiance) ; sauvegarde complétée automatiquement pour les anciennes parties
- 1.20.1 : correctif iPhone de la bande du bas, d'après les mesures d'un vrai appareil (écran 932, zone 873, haut 59) : quand la zone d'affichage est raccourcie de la hauteur de la barre d'état, la marge du bas est supprimée

## ✅ Version 1.21.0 — Comptes et sauvegarde en ligne

- Menu → Compte : compte gratuit facultatif (e-mail + mot de passe, Firebase Authentication), mot de passe oublié, déconnexion, suppression définitive du compte et de la sauvegarde en ligne
- Sauvegarde en ligne (Firestore, document `saves/{uid}`, règles : chaque compte n'accède qu'à son document) ; le jeu reste entièrement jouable hors ligne
- Synchronisation : à l'ouverture, à la connexion, au retour du réseau, envoi automatique au plus une fois par minute et quand l'app passe en arrière-plan ; envoi vérifié par transaction
- Conflit (deux appareils ont avancé) : le joueur choisit la partie à garder, l'autre est rangée dans les copies de secours ; jamais d'écrasement silencieux
- Module Firebase chargé seulement si un compte est utilisé (aucun coût pour les joueurs sans compte)

## ✅ Version 1.22.0 — Événements de la semaine

- Un événement différent chaque semaine (du lundi 5 h au lundi suivant), sans serveur ni mise à jour : 6 thèmes qui tournent (Marée d’Éther, Tournoi des Bannières, Forge Ardente, Grande Chasse, Pèlerinage des Héritiers, Nuit des Coutures)
- Chaque thème : un bonus ×1,5 (expéditions, arène, donjons, boss mondial, XP ou or de campagne), 5 objectifs à points, une épreuve en 3 combats contre les ennemis de sa région, 5 paliers de points (jusqu’à 500)
- Difficulté de l’épreuve calée sur le chapitre où en est le joueur (fixée au premier combat), calibrée par simulation pour chaque thème et chaque chapitre
- Écran Événements refait (bannière illustrée, jauge de paliers, épreuve par étapes), carte en tête de Combats, pastilles quand un événement est nouveau ou qu’une récompense attend
- Les événements spéciaux décrits dans `public/events.json` continuent de fonctionner à côté

## ✅ Version 1.23.0 — Ne perds pas ta partie

- Invitation à créer un compte, sur l’accueil, quand la partie a un peu avancé (3 victoires, tutoriel terminé) et n’est sauvegardée que sur l’appareil : « Créer un compte », « Plus tard » (redemande après 1, 3 puis 7 jours, 4 fois au plus) ou « Ne plus me demander »
- Écran Sauvegarde : rappel « Uniquement sur ce téléphone · Créer un compte gratuit » ou adresse du compte en ligne
- Correctif : le bouton « Partir » des expéditions pouvait être caché sur iPhone ; les fenêtres et panneaux s’affichent désormais au-dessus de tout, et le bouton dit « Choisis 1 héros » tant qu’aucun héros n’est choisi

## ✅ Version 1.24.0 — Héros vivants

- Fiche du héros : le portrait respire doucement, des particules propres à l’affinité flottent (braises solaires, poussière tellurique, éclats lunaires, volutes du Néant)
- Le héros parle : un mot d’accueil à l’ouverture, une nouvelle réplique à chaque fois qu’on touche son portrait (3 répliques écrites pour chacun des 23 héros, plus sa citation)
- Après une victoire, un héros encore debout dit un mot
- Animations coupées avec l’option « Réduire les animations »

## ✅ Version 1.25.0 — Doublons de héros et parcours simplifié

- Doublons : un héros déjà possédé obtenu par invocation (ou en récompense) devient un doublon. Chacun sert une fois, au choix : éveiller le héros (+5 % à toutes ses stats, 1 doublon + essence + or), le lien de sa famille ou le lien de son affinité (+1 % PV, ATQ et DÉF à tous les héros concernés par niveau, 10 niveaux)
- Fiche héros : encart « Doublons » ; écran Héros : bouton « Liens » (familles et affinités) ; pastille sur l’onglet Héros quand de nouveaux doublons arrivent
- Anciennes sauvegardes : les fragments sont convertis en doublons (format de sauvegarde v4, arrondi en faveur du joueur)
- Un seul chemin par fonction : Menu réduit à Sac, Codex, Sauvegarde et compte, Paramètres ; Courrier = récompense de connexion + messages ; Compte et Sauvegarde réunis
- Modes débloqués au fil de la campagne (Expéditions et événements après 1-3, Donjons 1-5, Boss mondial 1-8, Arène 1-10, Tour 2-3) ; seul le prochain mode fermé est affiché
- Pastilles déplacées vers l’onglet où se trouve l’action (Accueil pour missions, courrier et événements)
- Fiche héros : plus de bulles de texte au milieu

## ✅ Version 1.26.0 — Nouveaux modes annoncés

- Quand la campagne ouvre un mode, une fenêtre « Nouveau mode » le présente en une phrase avec « Y aller » ou « Plus tard » (une fois par mode, jamais pendant le tutoriel ; les parties existantes ne reçoivent pas de rafale)
- Combats : une seule carte « Événements » pour tous les événements en cours
- Fiche héros : l’encart Doublons n’apparaît que s’il y a un doublon à utiliser

## ✅ Version 1.27.0 — Sept nouveaux héros et L’Appel des Sept Aubes

- Six héros de plus à invoquer, surtout de raretés basses pour varier les tirages : Garrek Main-de-Suie (commun, défenseur), Nyra Fil-d’Acier (commune, attaquante), Osric de la Garde Blanche (peu commun, défenseur), Tavi aux Mille Sources (peu commune, soigneuse), Mirelle Cendre-Douce (rare, soutien), Thalor, Bastion du Prisme (légendaire, défenseur) ; illustrations peintes, compétences, histoire et répliques
- Élyra de la Septième Aube (légendaire, soutien solaire) : héroïne exclusive, jamais à l’invocation
- Événement « L’Appel des Sept Aubes » (jusqu’au 7 décembre 2026) : un cadeau par jour de connexion (pas forcément consécutifs), Élyra au 7e jour (ou un doublon si elle est déjà là) ; annonce à la première visite, pastille quand le cadeau du jour attend
- 30 héros au total

## ✅ Version 1.28.0 — Mise en page revue

- Préparation des combats (campagne, donjons, boss, arène, épreuves) : ennemis regroupés (un portrait par type, ×nombre, boss en tête), équipe juste dessous, récompenses sur une ligne ; « Combattre » et « Balayer » dans une barre toujours visible au-dessus de la navigation ; la raison d’un blocage (énergie, équipe vide) s’affiche dans la barre
- Missions et objectifs d’événement : bouton « Y aller » qui mène à l’écran où on les accomplit (ou indique le niveau qui ouvre le mode)
- Invocation : boutons « Appeler » toujours visibles ; Boss mondial : « Affronter » à côté de chaque niveau, image réduite
- Petits écrans (iPhone SE) : statistiques de la fiche héros dans la largeur ; notifications relevées au-dessus des barres d’action
- Correctif : la fenêtre des doublons ne se ferme plus d’un coup après avoir utilisé le dernier

## ✅ Version 1.29.0 — Test complet et nouveau visuel réversible

- Test complet : robot de logique (9 parties, 13 500 actions au hasard : invocations, améliorations, combats de tous les modes, équipement, expéditions, événements, doublons, sauvegarde) sans aucune incohérence ; exploration de tous les écrans et de leurs boutons dans le navigateur (nouvelle partie et partie avancée, iPhone 14 Pro et SE) sans erreur
- Correctif : le calendrier de connexion du Courrier débordait de 46 px sur iPhone SE
- Nouveau visuel « Grimoire du Monde Cousu » (par défaut) : paysage peint derrière les écrans, filigrane gravé sur les barres, blocs en pierre ancienne avec équerres et losanges dorés, titres encadrés de filets, boutons en or poli, onglet actif marqué d’un losange
- Réversible : Paramètres → Apparence → « Classique » remet l’ancien visuel à l’identique (tout le nouveau style est dans `src/styles/theme-v2.css`, appliqué seulement avec la classe `theme-v2`) ; le choix est gardé dans la sauvegarde

## ✅ Version 1.30.0 — Audit UI/UX et identité visuelle par onglet

- Audit de tous les écrans avec axe-core (contraste, tailles de cible, champs sans nom) et un contrôle de la mise en page des textes (polices trop petites, textes coupés, titres trop longs) : 0 défaut axe restant
- Corrections : texte discret plus contrasté (4,5:1 minimum), nom de famille lisible (Hordes d’Akkar), difficultés verrouillées lisibles, tailles minimales relevées (niveaux, calendrier, paliers, équipe), onglets qui ne coupent plus les noms, champs des Paramètres nommés
- Nouveau visuel : chaque partie du jeu a sa couleur et son décor peint (Accueil or, Héros bleu royal avec la salle des héros, Invoquer violet, Combats rouge braise avec le champ de bataille, Menu vert-de-gris avec la bibliothèque) ; titres, filets, ornements, onglets et barre du bas suivent la couleur ; les boutons d’action restent dorés partout
- Missions : une récompense à réclamer ressort (bandeau doré), les missions terminées s’effacent
- Le visuel « Classique » (Paramètres → Apparence) reste inchangé

## ✅ Version 1.31.0 — Équipement complet

- Étoiles (1 à 6 ★) sur chaque objet : elles fixent la force de la statistique principale ; plus d’étoiles dans les derniers chapitres (+1 sur les boss) et en haut des donjons (6 ★ possibles au 10e étage)
- Nouvelle rareté Mythique (rouge, lueur animée) : 4 secondaires dès l’obtention, dont une déjà renforcée ; seulement aux étages 9 et 10 de la Forge Engloutie
- Amélioration jusqu’à +16, avec renforcement ou nouvelle secondaire aux niveaux 4, 8, 12 et 16
- 11 ensembles (4 nouveaux) : Massacre (+20 % dégâts critiques), Résolution (+40 RÉS), Pérennité (4 pièces : +3 % PV au début de chaque tour), Élan (4 pièces : 30 % de jauge de tour au départ) ; chacun a son emblème
- Cartes d’objet : cadre et lueur de la rareté, étoiles, emblème d’ensemble, niveau ; fiche d’objet : rareté, étoiles, barre de niveau avec les paliers, ensemble avec pièces portées (2/4), secondaires avec leurs renforcements, prochain palier
- Forge : filtre et tri par étoiles, emblèmes dans le filtre d’ensemble ; fiche du héros : étoiles et emblème sur chaque emplacement
- Anciennes sauvegardes (format v5) : chaque objet reçoit autant d’étoiles que son rang de rareté, sa puissance ne change pas

## ✅ Version 1.32.0 — Bulles d’ensemble et invocations rééquilibrées

- Fiche du héros : bulles rondes avec l’emblème de chaque ensemble porté (actif en lumière, ×2 s’il compte deux fois ; en cours estompé avec 2/4) ; toucher une bulle ouvre le détail de tous les ensembles
- Fiche du héros : plus d’effet « élastique » qui découvrait le décor au-dessus de l’image
- Invocations plus exigeantes, à la manière des grands jeux du genre :
  - « Invocation sacrée » (éclats primordiaux, ex-« légendaire ») : épique garanti, légendaire 9 %, mythique 1 %, un légendaire garanti au plus tard au 10e appel (avant : légendaire garanti à chaque appel)
  - Invocation épique (cristaux) : légendaire 4,5 % (avant 12,5 %), garanti tous les 40 (avant 20)
  - Invocation rare (éclats d’Aeon) : légendaire 0,9 % (avant 2,3 %), garanti tous les 100 (avant 60)
  - Faille de Cendre : légendaire 3 % (avant 7 %), garanti tous les 50 (avant 40)

## ✅ Version 1.33.0 — Sanctuaire en pages, absorption de héros

- Sanctuaire découpé en 4 onglets, à la manière des tavernes des grands jeux du genre : **Niveau**, **Rang**, **Ascension** (avec l’Éveil) et **Compétences** ; un point rouge signale l’onglet où une amélioration est possible
- **Absorber des héros** (onglet Niveau) : jusqu’à 6 héros donnés à un autre pour lui faire gagner de l’expérience
  - chaque héros rend une base selon sa rareté (Commun 400 XP … Mythique 6 000 XP) plus 80 % de l’expérience déjà investie
  - coût : 400 or par niveau du héros absorbé ; aperçu du niveau atteint avant de confirmer ; plafond du rang respecté
  - protégés : héros verrouillés, dans une équipe, en expédition ou en avatar ; l’équipement des héros absorbés retourne au sac
- **Invocation primordiale retirée** : les récompenses qui donnaient des éclats primordiaux donnent désormais 300 cristaux par éclat (une invocation épique) ; les éclats déjà possédés sont convertis automatiquement (sauvegarde v6)

## ✅ Version 1.34.0 — Huit nouveaux héros

- 8 héros de plus à invoquer (38 en tout), surtout des raretés modestes pour varier les tirages :
  - Commun : **Pia Mousse-Claire** (soigneuse, Sylvaran, Lunaire), **Dorn Lame-Grise** (attaquant, Valcrest, Néant)
  - Peu commun : **Lio Rouage-d’Or** (soutien : boucliers et vitesse, Prisme, Solaire), **Vesk Croc-de-Braise** (assassin à brûlures, Cendre, Solaire)
  - Rare : **Fenn Pas-de-Loup** (assassin et son loup, poison et vol de vie, Sylvaran, Tellurique), **Nakht Bouclier-de-Bronze** (défenseur provocateur et étourdissant, Akkar, Tellurique), **Kiro** (assassin qui ignore la défense et ralentit, Prisme, Néant)
  - Épique : **Odalie Voix-de-Givre** (contrôleuse qui gèle et repousse la jauge, Valcrest, Lunaire ; chef : +15 % VIT pour Valcrest)
- Chacun a son illustration, son histoire, sa citation et ses répliques
- Nouveau succès : posséder 32 héros
- Test : chaque héros a bien son portrait, son illustration en pied et ses répliques

## ✅ Version 1.35.0 — Marché

- Bilan de l’économie : un joueur gratuit qui joue chaque jour gagne environ 270 cristaux (≈ une invocation épique) et 0,4 éclat d’Aeon par jour ; c’est dans la norme des grands jeux du genre, rien à corriger d’urgence
- **Marché** (nouveau lieu de l’accueil, ouvert après le niveau 1-6, annoncé une fois) :
  - 6 offres par jour, une seule fois chacune, surtout payées en or (l’or s’accumulait sans usage) : éclats ternes, élixirs, grimoires, sceaux de rang, potions d’ascension, minerai, équipements rares à légendaires (stats visibles avant d’acheter)
  - quelques offres en cristaux : éclat d’Aeon (180), essence d’éveil (90), équipement légendaire (250)
  - les offres avancées n’apparaissent qu’avec la progression dans l’histoire ; nouvelles offres chaque jour, ou « Renouveler » jusqu’à 3 fois par jour (20, 40, 80 cristaux)
- Les messages en bas de l’écran passent en haut quand une fenêtre est ouverte, pour ne plus jamais cacher ses boutons

## ✅ Version 1.36.0 — Classements en ligne

- **Classements** (Menu → Classements, et bouton « Classement » dans l’Arène, la Tour et le Boss mondial) : les 50 meilleurs Héritiers en Arène (points), Tour (étage), Boss mondial (meilleurs dégâts) et Puissance d’équipe
- Il faut un compte pour y figurer ; on peut choisir de ne plus apparaître. Seuls le nom, l’avatar et les scores sont publiés (document Firestore `ranks/{uid}`, mis à jour avec la sauvegarde en ligne)
- Règles Firestore à ajouter : lecture pour tous, écriture par le propriétaire uniquement (sans cela, l’écran affiche « pas encore ouverts »)

## ✅ Version 1.37.0 — Maîtrises

- Nouvel onglet **Maîtrises** au Sanctuaire : 3 branches (Offensive, Défensive, Soutien) de 4 paliers, dès le niveau 20 du héros
  - Offensive : ATQ +5 %, critique +5 %, dégâts critiques +12 %, ultime « Soif de sang » (vol de vie 8 %)
  - Défensive : PV +5 %, DÉF +6 %, RÉS +15, ultime « Second souffle » (2 % des PV max par tour)
  - Soutien : VIT +4, PRÉ +15, PV et DÉF +3 %, ultime « Initiative » (15 % de jauge au départ)
  - 2 maîtrises ultimes au plus par héros : il faut choisir ; réinitialisation contre 100 cristaux (parchemins rendus)
- Nouvelle ressource : **Parchemin de maîtrise** (bonus des missions hebdomadaires, Boss mondial Difficile et plus, paliers de la Tour, Marché)
- Absorber un héros rend les parchemins investis dans ses maîtrises

## ✅ Version 1.38.0 — Chapitre 9 : la Mer des Oublis

- Nouveau chapitre (10 niveaux, 4 difficultés) après les Coutures du Monde : sous le Monde Cousu, une mer recueille tout ce qui est oublié, et elle monte
- 5 nouveaux ennemis illustrés : Sentinelle noyée, Sirène d’amertume, Pêcheur des abysses, Chevalier des marées et le boss, le **Léviathan des Oublis** (gel, vol de jauge, soin)
- 2 nouveaux héros : **Maren Chante-Houle** (Épique, soigneuse, rejoint au niveau 9-5) et **Sire Corentin le Noyé** (Légendaire, défenseur, récompense du boss)
- Nouveau décor de combat (les abysses), une page du Codex, une nouvelle expédition (le Rivage gris, riche en parchemins de maîtrise), un succès de chapitre
- Équilibrage par simulation : au-delà du niveau maximum des héros, une équipe au maximum sans équipement gagne le boss environ une fois sur deux ; l’équipement et les maîtrises font la différence

## ✅ Version 1.39.0 — Finitions

- Audit d’accessibilité (axe-core) étendu aux nouveaux écrans (Marché, Classements, Ascension, Maîtrises) : 0 problème sur tout le jeu
- Maîtrises verrouillées plus lisibles (contraste suffisant), textes à 11 px minimum partout (compteur d’énergie, Sac de la Forge, badge « Chef », noms des héros en préparation de combat)
- Sanctuaire : les 5 onglets ne sont plus écrasés sur petit écran (défilement horizontal, l’onglet choisi se place en vue)
- Onglet Ascension : le porte-monnaie (potions, essence, or) tient sur une seule ligne

## ✅ Version 1.40.0 — Premier lancement plus clair (retours d’une critique)

- Premier lancement : plus de calendrier de connexion avant l’histoire ; il reste dans le Courrier et s’ouvre seul une fois le tutoriel fini
- Accueil : « Bienvenue dans le Monde Cousu » explique tout de suite que le joueur est le Lien, et lui demande son nom (« Lien » par défaut, à la place de « Héritier »)
- Étoiles : conditions affichées avant chaque niveau de campagne (Victoire · 1 KO max · Aucun KO) avec le meilleur résultat, et la raison après le combat
- Premier combat allégé : une seule bulle d’aide, placée en haut pour ne jamais cacher l’équipe ; les affinités sont expliquées à la préparation du 2ᵉ combat, AUTO au 2ᵉ combat (activer AUTO soi-même valide l’étape) ; jamais deux bulles à la fois
- Textes coupés à 375 px corrigés : onglets de difficulté, chapitres (le chapitre en cours se place en vue), récompense du chapitre, noms des héros sur les petites cartes, nom du joueur en haut
- Invocation : l’onglet Épique montre l’icône des cristaux (le « 300 » était le nombre de cristaux, pas des éclats)
- Ce qui rend le jeu unique, mis en avant : avant chaque combat, « Ton équipe : X avantagés ▲ · Y désavantagés ▼ » ; au premier doublon, une fenêtre présente les Liens (famille et affinité) et le cycle des affinités

## ✅ Version 1.41.0 — Moins d’alertes, combat plus riche, tutoiement partout (critique complète, points 1 à 4)

- Alertes : une pastille d’onglet ne s’allume que s’il y a quelque chose à récupérer (Combats : une expédition revenue ; Invoquer : cadeau d’événement ou 10 éclats d’Aeon ; Menu : jusqu’à la première visite de la Sauvegarde). Les clés et tickets du jour restent signalés sur les cartes
- Messages : « missions accomplies » au plus une fois toutes les 3 minutes, jamais au chargement d’une partie ni sur l’écran des missions, et disparaît en 4 s (12 s avant) ; en combat, les messages s’affichent en haut et ne cachent plus les compétences
- Moins de systèmes affichés d’un coup : le Sac masque les objets jamais obtenus ; l’onglet Maîtrises du Sanctuaire apparaît quand un héros atteint le niveau 20
- Combat : nouvelles mécaniques **combo** (dégâts accrus sur une cible empoisonnée, gelée, provoquée, à DÉF réduite…), **achèvement** (+50 % sous 30 % de PV) et **retrait des bonus** ennemis. Les 9 héros Communs et Peu communs ont gagné un effet propre (Corvin, Brann, Torvald, Maëlis, Isel, Garrek, Nyra, Pia, Dorn) ; « Combo ! » et « Bonus retirés » s’affichent ; l’IA en tient compte ; page « Combos » dans le Codex
- Terrain de combat resserré : les deux équipes plus proches et des cartes un peu plus grandes
- Tutoiement partout : une cinquantaine de phrases au « vous » corrigées (astuces, erreurs, Sauvegarde, compte, combat…)

## ✅ Version 1.42.0 — Le joueur dans l’histoire, une Arène honnête (critique complète, points 5 et 6)

- Le Lien parle : nouvel orateur « joueur » dans les dialogues (bulle dorée à son nom, « · le Lien »), et les héros l’appellent par le nom choisi au début
- Dès le premier niveau, Elowen demande son nom au joueur ; une réplique du joueur ou à son nom dans chaque chapitre (2 à 9), et une réponse à la Voix du Néant au boss du chapitre 7
- Arène : avec un compte, les adversaires sont les reflets de vrais joueurs du classement en ligne de puissance proche (nom et puissance réels, équipe menée par leur avatar), marqués « Joueur » ; sinon, des Héritiers imaginaires marqués « Imaginaire », avec une phrase qui l’explique
- Les adversaires imaginaires ne portent plus de noms de héros du jeu (Ysolde, Tamsin) ; 22 noms au lieu de 12
- Prénoms courts : plus de virgule collée (« Thalor, » → « Thalor ») sur les cartes et les listes

## ✅ Version 1.43.0 — Fin de jeu plus longue et butin d’absence (critique complète, point 7)

- **Camp des Héritiers** (nouveau lieu de l’Accueil, ouvert après le niveau 1-4) : pendant l’absence, le butin s’accumule jusqu’à 12 h, même jeu fermé (or, élixirs, minerai, cristaux), et grandit avec l’avancée dans la campagne. Pastille quand 4 h de butin attendent
- **Tour des Âges : 100 étages** au lieu de 50. Les Sommets (51 à 100) mélangent les ennemis de toutes les régions, plus forts à chaque étage (+15 % par étage), avec un boss de chapitre tous les 10 étages (Roi-Scorpion, Seigneur de Cendre, Constellation morte, Tisserand des Âges, Léviathan). Récompenses : cristaux, éclats d’Aeon, parchemins de maîtrise, essence d’éveil
- **Donjons : 15 étages** au lieu de 10 ; les étages 11 à 15 (niveaux 42 à 58) ont des ennemis renforcés et de meilleures récompenses
- Équilibrage vérifié par simulation : une équipe au maximum sans équipement passe l’étage 70 de la Tour mais pas le 100 (il faut l’équipement et les maîtrises), et l’étage 13 de chaque donjon
- Nouveaux succès : Tour étage 75 et sommet (100), donjon étage 15

## ✅ Version 1.44.0 — Nouvelle musique et rangement (critique complète, points 8 et 9)

- **Musique entièrement recomposée** (toujours générée en direct, sans fichier, hors ligne) : un vrai petit compositeur avec tonalité, grille d’accords, tempo, basse, arpèges, mélodie (un motif propre à chaque morceau, varié au fil des sections) et réverbération
- Un morceau par lieu : Accueil (harpe, nappe, flûte), Invocation (cloches de verre, chœur), Combat avec une couleur par région (Valcrest, Sylvaran, Prisme, Akkar en mode oriental, Abîme, Concordat, Cœur, Coutures, Mer des Oublis : tambours, ostinato, cuivres ou synthé) et un thème de Boss plus rapide et plus lourd qui démarre à l’arrivée de la vague du boss
- **Combats** : la campagne en grand, les autres modes en grille de deux : tout tient sans défiler ; la carte Événements n’est plus en double (le raccourci de l’Accueil suffit) ; le compteur des donjons affiche bien 15 étages
- **Menu** : une carte du joueur en haut (avatar, nom modifiable, niveau, et le bilan de la partie : héros, histoire, Tour, Arène, victoires, invocations) ; la pastille du Menu suit la même règle que la barre du bas

## ✅ Version 1.45.0 — Multijoueur (1/3) : l’Arène réelle

- Avec un compte, ton **équipe de défense** est publiée en ligne (document `defenses/{uid}`) : héros, niveaux, rangs, ascension, éveil, compétences et équipement. Tu choisis quelle équipe défend dans l’Arène
- Les adversaires « Joueur » sont les **vraies équipes** d’autres joueurs de puissance proche (de 50 % à 170 % de la tienne) ; sans compte, sans réseau ou sans joueur proche, des Héritiers imaginaires annoncés comme tels
- **Journal de défense** : chaque attaque est inscrite chez le défenseur (`defenses/{uid}/log`). Une défense qui gagne rapporte 3 points, une défense battue en coûte 6 ; un message résume les combats reçus depuis la dernière visite
- **Vengeance** : un bouton « Venger » contre chaque joueur qui a battu ta défense (une fois par combat)
- Supprimer son compte efface aussi sa défense et son journal ; ne pas apparaître dans les classements retire aussi la défense
- Règles de sécurité dans `firestore.rules` (à publier dans la console Firebase), vérifiées par des tests sur l’émulateur (`npm run test:rules`) ; test de bout en bout à deux joueurs sur les émulateurs

## ✅ Version 1.46.0 — Multijoueur (2/3) : les clans

- **Clans** (lieu « Clan » sur l’Accueil, ouvert après le niveau 1-10, compte nécessaire) : chercher un clan par son nom ou parmi les clans ouverts, le rejoindre, ou créer le sien (nom, présentation, ouvert ou fermé). 30 membres au plus
- **Discussion de clan** : les 50 derniers messages, actualisés toutes les 8 s ; chacun peut effacer ses messages, le chef tous
- **Boss de clan** chaque semaine (la Constellation morte, 40 actions, 2 essais par jour) : les dégâts de tous les membres s’additionnent ; 6 paliers de 250 000 à 15 millions, chacun récompense tous les membres qui ont attaqué dans la semaine. Les dégâts sont gardés dans la sauvegarde tant qu’ils ne sont pas envoyés (rien ne se perd hors ligne)
- **Chef** : exclure un membre, ouvrir ou fermer le clan, nommer un autre chef ; le dernier membre peut dissoudre le clan
- Combat : sur un boss aux PV gigantesques, poisons et brûlures sont plafonnés (sinon un pourcentage de ses PV écrasait tout)
- Règles Firestore des clans et de leur discussion (`guilds/{gid}`, `guilds/{gid}/chat`) dans `firestore.rules`, vérifiées sur l’émulateur ; test de bout en bout à deux joueurs (création, adhésion, discussion, boss, exclusion)

## ✅ Version 1.47.0 — Multijoueur (3/3) : les amis

- **Amis** (Menu → Entre joueurs → Amis, compte nécessaire) : chacun a un **code ami** de 6 caractères (sans 0/O ni 1/I) ; on ajoute un ami avec son code, il accepte la demande. 30 amis au plus
- **Cadeaux d’énergie** : chaque jour, 10 énergie à envoyer à chaque ami (« Tout envoyer »), et leurs cadeaux à recevoir (« Tout recevoir », 20 par jour au plus)
- **Renfort d’un ami** : en campagne et en donjon, le meilleur héros d’un ami (avec son équipement) peut prendre une place libre de l’équipe pour un combat, une fois par jour et par ami
- Fiche publique `profiles/{uid}` (nom, avatar, niveau, puissance, héros prêté), codes `codes/{code}`, amitiés `friendships/{a_b}` ; supprimer son compte efface aussi tout cela
- Règles Firestore des amis dans `firestore.rules` (19 tests sur l’émulateur au total) ; test de bout en bout à deux joueurs (code, demande, acceptation, cadeau, renfort en combat)

## ✅ Version 1.47.1 — Correctif des règles des classements

- Vérification du multijoueur sur le vrai serveur (Arène réelle, clans, amis) : tout fonctionne
- Correctif : les règles Firestore empêchaient d’effacer sa propre ligne de classement (option « ne pas apparaître dans les classements », suppression du compte). Nouvelles règles à publier

## ✅ Version 1.48.0 — Ménage : réglages et données inutiles

- Paramètres allégés : plus de réglage « Apparence » (l’ancien visuel « Classique » est retiré, le visuel actuel est le seul), plus de champ « Nom » en double (il se change sur la carte du joueur du Menu), plus d’informations techniques (position de l’écran, version de sauvegarde, reculs d’horloge). Restent : Son, Jeu (vitesse, combat auto, animations réduites) et Application (installation, version, mise à jour, guide)
- Sauvegardes plus légères : anciens fragments de héros et ancien réglage de visuel retirés à l’ouverture de la partie
- Code inutilisé supprimé : décors dessinés remplacés par les illustrations, fonctions jamais appelées, mesure de l’écran de débogage, dossier vide

## ✅ Version 1.49.0 — Clans : membres et rôles

- Nouveau rôle **Adjoint** (5 au plus) : exclut les simples membres, change la présentation, ouvre ou ferme le clan, efface les messages. Le **Chef** nomme ou retire les adjoints et peut passer la main ; les **Membres** discutent et attaquent le boss
- Onglet **Membres** refait (« Membres · 12 ») : rôle de chacun, puissance, dégâts de la semaine ; toucher un membre ouvre sa **fiche** (membre depuis, dégâts) avec les actions permises par ton rôle (Nommer adjoint, Retirer le rôle, Nommer chef, Exclure)
- Tableau des rôles et ce que chacun peut faire ; réglages du clan (ouvrir/fermer, présentation) pour le chef et les adjoints
- **Aperçu d’un clan avant de le rejoindre** : toucher un clan de la liste montre sa présentation, sa puissance totale et ses membres avec leurs rôles
- Règles Firestore mises à jour (liste `officers`, 23 tests sur l’émulateur) : **à republier** ; test de bout en bout à trois joueurs (aperçu, adjoint, exclusion par l’adjoint, passation de chef)

## ✅ Version 1.49.1 — Clans : rôles mieux expliqués, erreurs en français

- Onglet Membres : « Les rôles du clan » en haut (ce que peut faire le Chef, un Adjoint, un Membre), ton rôle et ce que tu peux faire, le rôle de chaque membre affiché (y compris « Membre »), et sa description dans la fiche du membre
- Erreurs du serveur en français : un refus des règles affiche « Action refusée par le serveur : ses règles ne sont pas à jour… » au lieu du message anglais de Firebase
- Vérifié sur le vrai serveur : le refus de « Nommer adjoint » venait des règles en ligne pas encore republiées (version 1.49.0 de `firestore.rules`)

## ✅ Version 1.50.0 — Nom obligatoire

- Au premier lancement, le nom n’est plus facultatif : impossible de commencer sans en choisir un (3 à 18 caractères ; lettres, chiffres, espaces, apostrophes, points, tirets)
- Les joueurs qui ont encore un nom par défaut (« Lien », « Héritier », « Joueur »…) doivent choisir le leur : une fenêtre impossible à fermer s’ouvre au lancement (jamais en plein combat)
- Le changement de nom depuis la carte du joueur (Menu) suit les mêmes règles ; le nouveau nom est publié avec la sauvegarde en ligne (classements, Arène, clans, amis)

## ✅ Version 1.51.0 — Connexion avec Google, « nouveau ou ancien joueur »

- **Continuer avec Google** (Menu → Sauvegarde et compte) : créer son compte ou s’y connecter en un geste ; la sauvegarde en ligne fonctionne comme avec un e-mail
- Un compte e-mail existant peut **lier Google** (on se connecte ensuite des deux façons, même sauvegarde) ; un compte Google seul se confirme avec Google pour être supprimé (pas de mot de passe demandé)
- **Premier lancement** : « As-tu déjà joué à Aeonfall ? » — **Nouveau joueur** (l’aventure commence, choix du nom) ou **Ancien joueur** (se connecter à son compte Google / e-mail, ou charger un code de sauvegarde) : la partie revient, sans refaire le début
- Messages d’erreur Google en français (fenêtre bloquée, annulée, connexion pas encore activée sur le serveur…)
- À activer une fois dans la console Firebase : fournisseur Google (Authentication → Sign-in method), et le domaine du jeu dans les domaines autorisés
- Testé de bout en bout sur l’émulateur Firebase : un joueur crée son compte avec Google, puis sur un autre appareil choisit « Ancien joueur », se connecte avec Google et retrouve sa partie

## ✅ Version 1.51.1 — Connexion Google sur iPhone, noms à jour dans les clans

- iPhone et jeu installé : la connexion Google passe par une **redirection** (la page part chez Google puis revient au jeu) au lieu d’une fenêtre séparée qui ne revenait pas ; au retour, un message confirme « Connecté avec Google » ou « Compte Google lié » (ou explique l’erreur)
- La connexion passe par l’adresse du jeu (`/__/auth`, relayée vers Firebase par `vercel.json`) : Safari ne bloque plus le retour. Le service hors ligne laisse passer ces pages
- Bouton Google blanc, comme il se doit, sur tous les écrans
- Clans : la fiche de chaque membre (nom, avatar, puissance) se met à jour à chaque sauvegarde en ligne, même sans ouvrir l’écran du clan (un nouveau nom apparaît donc chez les autres membres)
- Testé sur l’émulateur : iPhone (lier Google à un compte e-mail, puis « Ancien joueur » + Google sur un autre iPhone) et ordinateur (fenêtre Google)

## ✅ Version 1.52.0 — Plus de sauvegarde par texte

- Retrait du « code de sauvegarde » en texte : plus de « Copier le code », de zone où coller un code, ni de « Copier une sauvegarde de secours » sur l’écran d’erreur
- Restent : la **sauvegarde en ligne** (compte Google ou e-mail), le **fichier de sauvegarde** (« Enregistrer » dans Fichiers / iCloud Drive, « Ouvrir un fichier ») et les copies de secours automatiques de l’appareil
- Premier lancement, « Ancien joueur » : « J’ai un fichier de sauvegarde » à la place du code

## ✅ Version 1.53.0 — Modération

- **Filtre d’insultes** (français et anglais, même déguisées : C0NNARD, f.u.c.k…) : noms de joueur et de clan refusés ; présentation de clan et messages de discussion masqués (« ****** ») ; noms et messages déjà publiés masqués à l’affichage
- **Signaler** : depuis les classements (toucher un joueur), la discussion de clan (⚑ sur un message), la fiche d’un membre et l’Arène ; motif (nom, message, triche, clan) et précision facultative
- **Bloquer** : ses messages, ses demandes d’ami et son équipe d’Arène ne s’affichent plus ; liste des joueurs bloqués (Amis) avec « Débloquer »
- **Écran Modération** (modérateurs seulement, Menu → Entre joueurs) : signalements regroupés par joueur, **Bannir** (retiré des classements, de l’Arène et des fiches d’amis, ne peut plus rien publier en ligne), **Retirer des classements**, **Ignorer**, liste des bannis avec « Lever »
- Un joueur banni voit un avis dans « Sauvegarde et compte » ; sa partie reste jouable et sauvegardée
- « Identifiant du compte » affiché (et copiable) dans « Sauvegarde et compte », pour se déclarer modérateur dans la console Firebase (collection `admins`)
- Règles Firestore : `reports`, `admins`, `bans`, contrôle des bannis sur toutes les écritures (27 tests sur l’émulateur) — **à republier**

## ✅ Version 1.54.0 — Anti-triche

- Le serveur refuse les valeurs impossibles : puissance d’équipe au-delà de 150 000 (≈ 100 000 au maximum réel avec tout l’équipement), Tour au-delà de 100 étages, Boss mondial au-delà de 100 %, Arène au-delà de 5 000 (3 000 à la première publication)
- **L’Arène ne monte pas plus vite qu’en jouant** : 60 points, plus 15 par heure écoulée depuis la dernière publication (heure du serveur)
- **Boss de clan** : 1,5 million de dégâts au plus par envoi, 6 millions par membre et par semaine
- **Défenses vérifiées** : avant d’être proposée, chaque défense est recalculée (niveaux, rangs, équipement) ; une défense trafiquée (niveaux impossibles, équipement gonflé, puissance annoncée fausse) n’est jamais proposée
- Règles Firestore mises à jour (31 tests sur l’émulateur) — **à republier**

## ✅ Version 1.55.0 — Téléchargement léger et finitions

- **Installation 7 fois plus légère** : 2,4 Mo au lieu d’environ 17 Mo. Les illustrations des héros et des ennemis ne sont plus toutes téléchargées d’un coup : chacune l’est quand elle s’affiche, puis reste en cache (le jeu reste jouable hors ligne, avec tout ce qui a déjà été vu)
- Le service hors ligne prend la main dès la première visite (les illustrations vues sont gardées tout de suite)
- **Arrivée plus calme** : la présentation d’un nouvel événement et l’invitation à créer un compte attendent une minute de jeu, au lieu de s’ouvrir dès l’arrivée
- Combat : l’astuce s’affiche sous la barre d’ordre des tours, au lieu de la couvrir
- Sanctuaire : les 5 onglets tiennent sur la largeur d’un téléphone (plus d’onglet « Maîtrises » coupé)

## ✅ Version 1.56.0 — Notifications

- **Paramètres → Notifications** : le téléphone prévient quand le jeu est fermé : **camp plein**, **énergie au maximum**, **cadeau d’énergie d’un ami** (avec son nom). Chaque type se coupe à part ; jamais la nuit (22 h – 8 h, heure du joueur : l’annonce attend 8 h)
- Il faut un compte. Sur iPhone, le jeu doit être installé sur l’écran d’accueil (iOS 16.4 ou plus) : le réglage l’explique
- Rien n’est envoyé pendant qu’on joue ; chaque annonce n’est faite qu’une fois ; se déconnecter ou supprimer son compte coupe les notifications de ce téléphone
- **Envoi** : un petit programme (`scripts/push/send.mjs`) tourne sur GitHub Actions toutes les 10 minutes (`.github/workflows/notifications.yml`). Il lit les heures à annoncer dans Firestore (`push/{uid}`) et les cadeaux récents (`friendships`, champ `giftAt`), puis envoie les notifications (Web Push, clés VAPID tirées de la clé du compte de service ; clé publique publiée dans `config/push`). Abonnements expirés effacés automatiquement
- **À faire une fois** : ajouter le secret GitHub `FIREBASE_SERVICE_ACCOUNT` (clé du compte de service Firebase) et republier les règles Firestore (35 tests sur l’émulateur)

## ✅ Version 1.57.0 — Version ordinateur

- **Sur ordinateur et tablette, le jeu n'est plus étiré sur toute la largeur** : il s'affiche dans une colonne centrale (640 px, 680 px sur grand écran), avec le monde peint et flouté tout autour. Fini les cartes de héros géantes, les cases de forge immenses et les tuiles de menu d'une demi-page
- **Combat agrandi** : cartes jusqu'à 150 px (160 px sur grand écran), compétences juste sous les cartes au lieu du coin de l'écran
- 4 héros par ligne dans la collection ; bulles du tutoriel, messages et volets alignés sur la colonne
- Souris : survol lumineux de ce qui se clique, **clic droit sur une carte de combat** pour voir ses effets (l'astuce l'indique), barre de défilement discrète
- Sur téléphone, rien ne change

## ✅ Version 1.58.0 — Découverte progressive et navigation regroupée

- **Les modes s'ouvrent un par un, sur les chapitres 1 à 4** (au lieu de huit modes en dix niveaux) : Camp 1-4, Événements 1-8, Donjons 2-2, Marché 2-6, Expéditions 2-10, Arène 3-4, Tour 3-8, Boss mondial 4-3, Clan 4-7. Un joueur ne perd jamais un mode qu'il a déjà découvert
- Les missions d'un mode pas encore ouvert sont masquées (et ne bloquent plus le bonus du jour ou de la semaine)
- **Accueil épuré** : Missions, Courrier, Événements, Camp et Marché, chacun n'apparaissant qu'une fois ouvert (un nouveau joueur ne voit que Missions et Courrier)
- **Onglet Héros** : Sanctuaire, Forge, Équipes et Liens en tête de la collection ; la pastille de l'onglet signale un héros de l'équipe qui peut progresser
- **Clan** rangé dans le Menu, avec Amis et Classements ; le tutoriel montre le chemin Héros → Sanctuaire

## ✅ Version 1.59.0 — Profondeur de combat

- **Pouvoir du Lien** : le joueur (le Lien) agit lui-même. Une jauge commune se remplit à chaque action d'un héros (+5) et à chaque ennemi vaincu (+5) ; pleine, au tour d'un héros et sans lui faire perdre son tour, on choisit **Souffle de vie** (soin de 20 %, effets néfastes retirés), **Frappe des Héritiers** (toute l'équipe frappe l'ennemi le plus affaibli, 50 % de l'ATQ chacun) ou **Rempart** (bouclier de 20 % des PV, +15 % de jauge de tour). Deux fois par combat au plus ; le combat automatique s'en sert seul (soin si l'équipe souffre, sinon frappe)
- **Carapace des boss** (niveau 20 et plus) : −30 % de dégâts, 3 charges, une en moins par coup (les attaques à plusieurs coups et de zone la brisent vite) ; brisée, le boss perd 30 % de DÉF pendant 2 tours ; elle se reforme 8 tours plus tard. Pas pour les boss à score (mondial, clan)
- **La rage des boss se voit** : sous la moitié de leurs PV, « Enragé ! +30 % ATQ » (elle existait sans être montrée)
- Fiche d'unité (appui long / clic droit) et Codex → Règles expliquent ces mécaniques
- Équilibrage vérifié par simulation (80 combats par cas) : difficulté des boss inchangée en moyenne, combats en retard de niveau un peu plus abordables ; tests d'équilibrage portés à 40 combats par cas pour mesurer la difficulté plutôt que le hasard

## ✅ Version 1.59.1 — Boîte de cadeaux et notifications réparées

- **Courrier → Cadeaux** : l'énergie envoyée par les amis s'y récupère d'un geste (« Tout récupérer »), même avec l'énergie pleine (le surplus est gardé), et on rend la pareille avec « Tout envoyer » ; pastille sur le Courrier et l'Accueil quand un cadeau attend (vérifié au lancement, au retour dans le jeu et toutes les 5 minutes)
- **Notifications** : l'envoi programmé ne s'était jamais lancé tout seul (GitHub n'avait pas pris en compte la programmation) ; nouvelle programmation aux minutes 4, 14, 24… Les cadeaux envoyés depuis une ancienne version du jeu sont aussi annoncés (relecture complète une fois par heure)

## ✅ Version 1.60.0 — Équilibrage

- **Plus de cristaux** : bonus des missions du jour 150 (au lieu de 80), missions « Dépenser 60 énergie » 50 et « Combattre 2 fois dans l'arène » 40, bonus de la semaine 400 (au lieu de 200) : environ une invocation épique et demie par jour au lieu d'une
- **Légendaire garanti au 30ᵉ appel épique** (au lieu du 40ᵉ)
- **Éveil sans doublon** : possible avec 6 essences d'éveil de plus à la place du doublon (un légendaire n'est plus presque impossible à éveiller)
- **Tour : montée rapide** des étages dont les ennemis ont 10 niveaux de moins que l'équipe (hors Sommets), avec toutes leurs récompenses
- **Butin du chapitre 1** : seulement ce qui sert tout de suite (élixirs, minerai, grimoires) ; les potions d'ascension arrivent au chapitre 2
- Mission du jour renommée « Récupérer la récompense du jour (Courrier) » (« Se connecter » restait à 0/1 tant que la récompense n'était pas prise)
- **Classements complétés** jusqu'à 10 lignes par des Héritiers imaginaires, signalés comme tels, tant qu'il y a peu de joueurs
- **Cadeaux d'amis sans limite** : tous les cadeaux reçus se récupèrent, chaque jour, même avec l'énergie pleine

## ✅ Version 1.61.0 — Finitions visuelles

- **Combat** : les deux camps se regroupent au milieu de l'écran (plus de grand vide sous l'équipe)
- **Illustrations en chargement** : une lueur aux couleurs de la faction au lieu d'un cadre vide, le temps du téléchargement
- **Récompenses** en grille équilibrée (4 sur une ligne, 5-6 en deux lignes de 3) : fini la récompense seule sur sa ligne (Camp, victoires)
- Sanctuaire : texte du niveau maximum en entier ; Forge : explique comment obtenir et équiper de l'équipement quand un héros ne porte rien
- Préparation de combat : « Ton équipe : 2 ▲ · 1 ▼ » avec le détail des affinités dans le ⓘ
- Boss mondial : un seul repère par difficulté, le prochain palier et sa barre (au lieu de six pastilles)
- Choix du nom : l'astuce « Safari → Sur l'écran d'accueil » n'apparaît que sur iPhone et iPad

## ✅ Version 1.62.0 — Objectifs, sensations et musiques

- **Paliers de collection** (onglet Héros) : à 10, 15, 20, 25, 30, 35 et 40 héros différents, des cristaux, des éclats d'Aeon et un **bonus permanent de +1 % PV, ATQ et DÉF à tous les héros** (jusqu'à +7 %) ; pastille sur l'onglet quand un palier attend
- **Sensations en combat** : l'écran tremble sur les coups critiques et les gros coups (plus d'un quart des PV), chiffres critiques plus grands, **ralenti et « Coup fatal ! »** quand le dernier ennemi tombe (rien de tout cela avec « Animations réduites »)
- **Une musique par lieu** : Forge (lourde et grave), Sanctuaire (chœur), Tour (mystérieuse), Arène (martiale), Marché, Camp ; les boss gardent la leur
- **Arène : correction** : depuis la v1.54, une défense dont l'équipement donnait plus de 3 % de bonus était écartée par erreur (les joueurs bien équipés n'apparaissaient presque jamais) ; plafond réaliste de 400 %, la vérification de puissance reste

## ✅ Version 1.82.2 — Caméra sans va-et-vient gauche-droite

- La caméra de combat ne se déplace presque plus vers la gauche ou la droite (15 % de son mouvement d'avant). Elle avance surtout en profondeur, avec un léger zoom.

## ✅ Version 1.82.1 — Caméra plus douce en accéléré

- En ×2 et ×3, la caméra bouge beaucoup moins : son zoom et son décalage sont réduits (environ la moitié en ×2, un tiers en ×3).
- Ses mouvements restent plus lents que le reste du combat accéléré, pour éviter les allers-retours brusques à chaque action.

## ✅ Version 1.82.0 — Scène de combat façon prototype

- Le combat n'est plus une grille : chaque unité est posée librement sur un sol en perspective. Les héros forment un arc au premier plan, les ennemis se tiennent plus loin et paraissent plus petits.
- Deux cercles runiques au sol (violet côté ennemis, doré côté héros) et un anneau lumineux sous l'unité dont c'est le tour.
- À chaque vague, les ennemis arrivent par le haut, l'un après l'autre.
- Le bandeau du haut (titre, ordre des tours, Effets, Pause) est transparent et posé sur la scène, qui gagne ainsi toute la hauteur de l'écran au-dessus des commandes.
- Les cartes sont un peu plus petites et les héros des bords sont ramenés vers l'intérieur pour ne jamais être coupés.

## ✅ Version 1.81.0 — Combats en 2,5D

- **Profondeur** : un sol en perspective sous les deux camps, les ennemis plus loin (plus petits), les cartes inclinées vers le sol avec une ombre portée, et les illustrations qui respirent doucement.
- **Caméra** : à chaque action, la vue se rapproche de l'échange (plus encore pour une ultime) ; le décor bouge moins vite que les cartes.
- **Assauts** : au corps à corps, la carte prend son élan, se rue sur sa cible en rapetissant avec la distance, frappe, puis revient à sa place.
- **Impacts** : traînée d'arme, gerbe d'étincelles, éclair blanc et recul de la cible dans le sens du coup.
- **Dissolution** : une unité vaincue blanchit puis s'éteint en poussière (violette pour les ennemis) ; lueurs vertes sur les soins, bleues sur les boucliers, dorées sur les résurrections, et une poussière d'ambiance qui monte sur le terrain.
- Rien de tout cela avec « Animations réduites ».

## ✅ Version 1.80.0 — Nyxa Point-Zéro, nouvelle Mythique

- **Nyxa Point-Zéro, Lame de la Réfraction** : 3ᵉ héros Mythique du jeu — Assassin, affinité Néant, famille du Prisme. Prototype zéro de l'Ordre, perdue dans la Fracture et revenue avec le Néant dans son armure.
- Compétences : *Lame réfractée* (2 frappes qui ignorent 20 % de la DÉF), *Pas de phase* (avance sa jauge de 30 %, frappe en ignorant 30 % de la DÉF et peut réduire la DÉF de 30 %), *Point zéro* (retire les bonus de la cible puis une frappe énorme : combo si DÉF réduite, achèvement sous 35 % de PV).
- Aura de chef : +13 % de taux critique pour toute l'équipe.
- Elle rejoint les invocations comme les autres Mythiques. Portrait peint avec SpriteCook (le portrait choisi par le joueur parmi quatre propositions).

## ✅ Version 1.79.2 — Commandes de combat lisibles

- Boutons AUTO et vitesse (×1, ×2, ×3) : le texte est centré dans son cadre peint (il débordait en haut ou en bas).
- La jauge ronde à côté est nommée « LIEN » au-dessus du pourcentage : c'est le Pouvoir du Lien. La toucher avant 100 % explique comment elle se remplit (+5 % par action d'un héros, +5 % par ennemi vaincu) ; à 100 %, elle propose un pouvoir (soin, frappe ou rempart), 2 fois par combat (le « 2/2 »).

## ✅ Version 1.79.1 — Listes sans niveau d'ennemis

- Les listes d'étages et de niveaux n'affichent plus le niveau ni la puissance des ennemis : donjons (« Ennemis niv. 38 · puissance +55 % » retiré), Tour des Âges, Donjon des familles et Campagne (« niv. 51 » retiré). Il reste l'énergie, les étoiles d'équipement et la récompense.
- L'explication des difficultés de la Campagne ne donne plus de niveaux : « ennemis bien plus puissants ».

## ✅ Version 1.79.0 — Donjon des familles

- **Combats → Donjon des familles** (ouvert avec les Donjons, après le niveau 2-2) : chaque jour, le donjon d'une famille de héros — Bastion du Serment (Valcrest), Spire des Calculs (Prisme), Fosse des Braises (Cendre), Racines Profondes (Sylvaran), Observatoire Éteint (Astral), Arène des Dunes (Akkar).
- **Seuls les héros de la famille du jour** peuvent y combattre : l'écran de préparation propose une équipe à part (les 5 meilleurs héros de la famille par défaut), à modifier en touchant l'équipe ; le premier choisi est le chef.
- Le donjon dure 24 h et change au renouvellement quotidien ; les 6 familles reviennent tous les 6 jours. La rotation des 5 prochains jours est affichée, avec l'étage atteint dans chacun. **La progression de chaque famille est gardée** : on reprend où on en était quand son donjon revient.
- 30 étages par famille, sans énergie, ennemis de la région de la famille (niveau 6 à 64) et un gardien aux étages 10, 20 et 30. Récompense à la première victoire de chaque étage : or et élixirs, grimoires et potions tous les 5 étages, et aux étages 10/20/30 cristaux, essence d'éveil, parchemins de maîtrise et **5 diamants**.

## ✅ Version 1.78.1 — Les diamants servent à recharger et actualiser

- **Recharge d'énergie** (+60) : payée en diamants, 10 puis 20 puis 40 par jour (au lieu de 50/100/200 cristaux).
- **Marché** : renouveler les offres coûte 5 puis 10 puis 20 diamants (au lieu de 20/40/80 cristaux) ; le porte-monnaie du Marché montre aussi les diamants.
- **Arène** : toujours une actualisation gratuite par jour, puis 5 diamants (au lieu de 20 cristaux).
- Code promo : le champ est vide, sans exemple de code.

## ✅ Version 1.78.0 — Bâtiments : Mine de diamants et Terrain d'entraînement

- **Diamants** : nouvelle monnaie précieuse (future monnaie payante), avec son icône peinte par SpriteCook. Sur l'accueil, le compteur en haut à droite affiche désormais les diamants (le « + » mène aux Bâtiments) ; les cristaux restent visibles dans le Sac et les écrans qui les utilisent.
- **Accueil → Bâtiments** (nouveau bouton peint sous Marché, pastille rouge quand la Mine a 8 h de production en réserve).
- **Mine de diamants** : extrait 1 diamant par heure, même jeu fermé ; 2 par heure au niveau 2 (120 diamants), 3 par heure au niveau 3 (300 diamants). La réserve s'arrête à 24 h de production : il faut passer récolter.
- **Terrain d'entraînement** : les héros placés gagnent un peu d'expérience chaque heure (3 % d'un niveau, jusqu'à 24 h sans passer), donnée en entrant dans les Bâtiments ou avec « Donner l'expérience ». 1 place gratuite, 2ᵉ place 100 diamants, 3ᵉ place 250 diamants. Les héros placés peuvent toujours combattre ; ceux au niveau maximum de leur rang n'y gagnent rien.
- Illustrations de la Mine et du Terrain générées avec SpriteCook dans le style de l'accueil.

## ✅ Version 1.77.3 — Fiche du héros sans flèches

- Les flèches ‹ › pour passer d'un héros au suivant sur la fiche d'un héros sont retirées : on revient à la liste des héros pour en ouvrir un autre.

## ✅ Version 1.77.2 — Fiche d'équipement plus nette

- La statistique principale n'est plus précédée de « Principale » : elle est alignée à gauche comme les secondaires, en gardant sa grande taille dorée.
- Ensemble porté en double (ex. 4 pièces de Fureur) : la pastille affiche « ×2 » au lieu de « 4/2 » ; un ensemble complet affiche « Actif ».

## ✅ Version 1.77.1 — Fin de l'Appel des Sept Aubes

- L'événement de connexion « L'Appel des Sept Aubes » (Élyra, légendaire exclusive, au 7ᵉ jour) se termine désormais le **17 novembre 2026 à 5 h 59 (heure de Paris)**, soit 5 jours après cette mise à jour, au lieu du 7 décembre. Le compte à rebours de l'écran Événements suit cette nouvelle date.

## ✅ Version 1.77.0 — Codes promo

- **Menu → Système → Code promo** : un champ pour entrer un code. S'il est valable, la récompense est ajoutée tout de suite et affichée ; chaque code ne sert qu'une fois par partie (« Tu as déjà utilisé ce code »). Majuscules, espaces et tirets sont ignorés.
- Codes de départ : **AEONFALL** (300 cristaux, 50 000 or, 2 éclats d'Aeon) et **FRACTURE** (10 éclats ternes, 10 élixirs d'expérience, 60 énergie).
- Les codes ne sont pas écrits en clair dans le jeu (seule leur empreinte l'est) ; on peut en ajouter, avec une date de fin si besoin, dans `src/data/promoCodes.ts`.

## ✅ Version 1.76.3 — Croix de fermeture sur les fenêtres

- Toutes les fenêtres qui peuvent se fermer (fiche d'un équipement, choix d'un objet, pause, explications « i », pastilles d'identité du héros, confirmations…) ont maintenant une **croix ✕ ronde en haut à droite**. Elle reste visible même quand le contenu défile. Toucher à côté de la fenêtre la ferme toujours aussi.

## ✅ Version 1.76.2 — Critiques à 0 % de base

- Tous les héros ont maintenant **0 % de taux critique et 0 % de dégâts critiques de base** (l'ascension et l'éveil n'en donnent plus). Ils montent uniquement avec l'**équipement** (gants critiques, secondaires, ensemble Acuité…), les **auras de chef** et, en option, les **maîtrises** (« Œil vif » +5 %, « Coup fatal » +12 %).
- Les auras de chef critiques ajoutent désormais des points (+11 % = +11 points) au lieu de multiplier : Nerissa donne +11 % de taux critique à l'équipe.
- Les ennemis gardent leurs critiques d'avant.
- Épreuve de la semaine « pèlerin » très légèrement allégée.

## ✅ Version 1.76.1 — Boutons rouges peints

- Les boutons d'action risquée (« Exclure » dans le clan, « Abandonner », « Démanteler », « Supprimer »…) ont maintenant la même texture peinte que les boutons dorés, en rouge, au lieu d'un aplat sans relief.

## ✅ Version 1.76.0 — Démantèlement groupé et comparatif d'équipement

- **Forge, onglet Démanteler** : toucher un objet le coche (pastille rouge) ; « Tout cocher » prend tous les objets affichés (filtres compris). Une barre en bas montre le nombre d'objets et le gain (or et minerai), puis démantèle la sélection après confirmation. Les objets équipés ou verrouillés restent protégés ; les boutons « Tout démanteler : Communs / Peu communs / Rares » restent là.
- **Comparatif** : depuis la fiche d'un héros, la fiche d'un objet qu'on peut équiper montre l'objet porté actuellement et les statistiques du héros avant → après (ensembles compris), en vert ce qui monte, en rouge ce qui baisse, plus la puissance.
- Fiche d'objet : boutons sur deux colonnes, « Verrouiller » n'est plus coupé.

## ✅ Version 1.75.1 — Auras de chef plafonnées, demande d'ami depuis un profil

- **Auras de chef** : chaque aura a désormais un plafond selon la rareté du héros, la statistique (la vitesse coûte deux fois plus cher, la précision et la résistance moins) et sa portée (toute l'équipe, ou seulement une famille ou une affinité, qui peut monter plus haut). Principales baisses : Nerissa (taux critique de l'équipe +60 % → +23 %), Vael'Shira (VIT de l'équipe → +7 %), Liran (VIT +12 % → +6 %), Mère Sulfura (PRÉ +30 % → +23 %), Azhar-Kesh (ATQ +20 % → +13 %), Idris (ATQ Solaires +25 % → +19 %), Aldric (DÉF +20 % → +10 %), Caelum et Tamsin (ATQ +20 % → +16 %), Solenne (PV +20 % → +16 %). Un test vérifie toutes les auras.
- Épreuve de la semaine : premier combat très légèrement adouci pour rester une entrée en matière.
- **Classements** : en touchant un joueur, un bouton « Demander en ami » envoie directement la demande (il affiche « Demande d'ami envoyée » ou « Déjà dans tes amis » selon le cas). Sur sa propre ligne, ni demande ni signalement.

## ✅ Version 1.75.0 — Rééquilibrage des héros

- **Enveloppe de puissance** : chaque compétence offensive est comparée à la norme de son rôle (Attaquant, Assassin, Contrôleur…), de son type (base, spéciale, ultime), de sa recharge et de sa rareté (+4 % par cran à partir de Rare). Trop forte, elle est ramenée au plafond ; trop faible, elle remonte au plancher ; dans la norme, rien ne change. Un test vérifie désormais les 88 héros à chaque mise à jour.
- **Baisses principales** : Azhar-Kesh (ultime −43 %, spéciale −23 %), Caelum (ultime −33 %, spéciale −19 %), Mère Sulfura (ultime −29 %), Idris (ultime −18 %, et sa baisse de DÉF passe de 50 % à 30 %), Maëlis (−17 %), Nyra (−21 %), Rook, Nim, Sefa.
- **Hausses** : Ilse (+43 % sur Glas glacé), Brévine (+21 %), Kaedra (+18 %, baisse de DÉF 50 % → 40 %), Ysmaë, Nerissa, Brakka, Kiro, Oriane.
- **Vitesse** : chaque héros reste dans la fourchette de son rôle et de sa rareté (Lyssandre 112 → 106, Zéphine 110 → 104, Élyra 118 → 115, Naerys 109 → 105, Sorcha 108 → 105).
- Ysolde : baisse de DÉF de son ultime 40 % → 30 %.
- Chapitre 7 légèrement allégé pour garder la même difficulté sans Caelum surpuissant.

## ✅ Version 1.74.0 — Symboles d'affinité, de rôle et blasons de famille peints

- **Affinités** : de nouveaux symboles simples, peints avec SpriteCook (soleil Solaire, montagne Tellurique, croissant Lunaire, étoile du Néant), lisibles même en tout petit. Ils remplacent les anciens logos partout : cartes de héros, fiche, combat, préparation, filtres, liens, expéditions.
- **Familles** : les blasons de la maquette SpriteCook (lion de Valcrest, cristal du Prisme, crâne de Cendre, arbre de Sylvaran, étoile Astrale, soleil et sabres d'Akkar) remplacent les anciens emblèmes, en un peu plus grand sur les cartes et la fiche.
- **Rôles** : de nouvelles icônes dorées dans le même style (épée de l'Attaquant, bouclier du Défenseur, bannière du Support, croix du Soigneur, chaîne du Contrôleur, dague de l'Assassin).

## ✅ Version 1.73.7 — Bouton pause, cartes de combat épurées, campagne alignée

- **Combat** : le bouton en haut à droite devient un vrai bouton **pause** (deux barres). Il fige le combat et propose « Reprendre » ou « Abandonner » (compté comme une défaite).
- **Combat** : les cartes des héros et des ennemis perdent leur cadre doré et leurs barres de vie à pointes ; les barres redeviennent simples et lisibles.
- **Campagne et donjons** : le numéro du niveau est centré dans son médaillon (chiffres alignés, plus de « 3 » ou « 9 » qui descendent) et le texte ne touche plus le médaillon. Les textes trop longs s'arrêtent proprement au lieu de passer à la ligne.
- **Titres d'écran** : le titre (« Campagne »…) est centré verticalement dans sa plaque à cristal.

## ✅ Version 1.73.6 — Fiche du héros allégée

- La phrase du héros (sa citation) et son nom en grand sous l'illustration sont retirés de la fiche : le nom reste dans le titre en haut, le titre du héros (« Druidesse du Cercle Vert »…) et ses rareté, affinité, rôle et famille restent sous l'illustration.

## ✅ Version 1.73.5 — Barre du bas centrée sur iPhone

- Sur iPhone, la zone au-dessus de la barre d'accueil restait vide et les icônes touchaient le haut de la barre. Icônes et noms sont maintenant centrés sur toute la hauteur de la barre (seule une petite marge de 10 px est gardée pour la barre d'accueil), « Invocation » est aligné avec les autres noms et le soulignement doré de l'onglet actif est juste sous son nom.

## ✅ Version 1.73.4 — Barre du bas, Combats, fiche du héros

- **Barre du bas** sobre : fond sombre jusqu'en bas de l'écran (zone de l'iPhone comprise), filet doré en haut, icônes et noms alignés et centrés ; le cristal d'Invocation dépasse au-dessus. Le cadre peint, qui ne s'ajustait pas aux iPhone, est retiré.
- **Combats** : ornements dorés et médaillons retirés des cartes des modes ; la carte Campagne s'affiche de nouveau normalement.
- **Fiche du héros** : le bouton retour ramène bien en arrière (le bouton du verrou avait pris son apparence et sa place) ; le verrou a son propre bouton rond à droite. En-tête opaque sur tous les écrans : plus de bande de couleur au-dessus du héros.

## ✅ Version 1.73.3 — Passe de propreté sur tous les écrans

- **Cartes de héros** : retour au style d'avant le kit SpriteCook (cadres peints retirés).
- Vérification de chaque écran (31 écrans, iPhone avec zones du haut et du bas) et corrections :
  - **titres d'écran** toujours entiers et centrés (plus de « RENE » à l'Arène ni de titres coupés), petits boutons du haut compacts ;
  - **boutons dorés** : texte plus petit, sur une ou deux lignes qui restent sur l'or ;
  - **panneaux** : marges intérieures, le texte ne touche plus le cadre ni ses coins ornés ;
  - **onglets** sur une ligne (Sanctuaire, Équipes, Événements…) ;
  - **Combats** : titres et textes à l'intérieur des cadres ; **Invocation** : la description reste dans son panneau ; **Préparation** : « Combattre » lisible ;
  - **Menu** : les six statistiques tiennent dans la carte ; **Équipe** : le ruban « Chef » ne recouvre plus le niveau ; sélecteur de vitesse lisible.

## ✅ Version 1.73.2 — Cartes de héros et barre du bas remises au propre

- **Cartes de héros** : le niveau (chiffre seul) dans le médaillon de gauche, l'**affinité** dans le médaillon de droite (l'emblème peint qui pouvait passer pour une affinité a été retiré du cadre), le rôle juste dessous ; les étoiles et l'emblème de famille au-dessus de la plaque du nom ; le nom sur une ligne (prénom seul pour les noms longs) ; les doublons et le verrou dans de petits badges sur le côté, plus au milieu du portrait. Tailles proportionnelles à la carte, avec un minimum lisible pour les petites cartes.
- **Barre du bas** : le cadre peint ne couvre plus la zone du bas de l'iPhone ; icônes et noms sont centrés dans leur emplacement.

## ✅ Version 1.73.1 — Kits SpriteCook : Campagne, Préparation, Combat

Trois nouvelles maquettes et leurs kits (43 pièces peintes) :
- **bouton retour** rond peint sur tous les écrans ; **onglets** (difficultés…) en plaques sombres, l'onglet choisi s'allume en or ;
- **Campagne et donjons** : chaque niveau sur une plaque peinte (or ; rouge au crâne pour le boss ; grise au cadenas si verrouillé) ; carte du chapitre dans un cadre doré ;
- **Préparation** : cases de l'équipe et ennemis dans des cadres peints, gros bouton « Combattre » doré aux épées croisées, « Répéter » en pierre, ruban « Chef » ;
- **Combat** : barres de vie (verte pour l'équipe, rouge pour les ennemis) et de tour peintes, cartes des combattants cerclées d'or, boutons AUTO et vitesse, jauge du Lien et compétences dans des cadres dorés (l'ultime en or).

## ✅ Version 1.73.0 — Kit d'interface SpriteCook dans tout le jeu, récompenses des donjons

- **Quatre nouvelles maquettes SpriteCook** (Héros, Invocation, Combats, Menu), dans le même style que l'accueil, et leurs kits de pièces peintes (61 pièces) appliqués dans le jeu :
  - **titres d'écran** sur une plaque ornée (une par onglet), **boutons** dorés et pierre sombre, **panneaux** à cadre doré, **barres de progression** peintes ;
  - **cartes de héros** dans un cadre peint selon la rareté (Commun gris, Peu commun vert, Rare bleu, Épique violet, Légendaire or, Mythique rouge) ;
  - Héros : les quatre lieux en tuiles peintes ; Invocation : onglets d'éclats peints, panneau de l'appel, jauge et boutons d'appel dorés ; Combats : cadres dorés et médaillons par mode ; Menu : carte de profil, statistiques avec icônes et tuiles peintes, séparateurs ornés.
- **Donjons : récompenses par difficulté** : comme les ennemis, chaque difficulté reprend là où la précédente s'arrête. L'étage 1 en Difficile rapporte maintenant plus que l'étage 15 en Normal (base de l'étage 15, ×1,1 → ×1,6 en Difficile, ×1,7 → ×2,4 en Expert, ×2,5 → ×3,5 en Cauchemar), expérience des héros comprise.
- **Barre du haut** : chiffres des compteurs dans une police nette, compteur d'énergie aligné avec l'or et les cristaux (le minuteur passe dessous sans le décaler).
- Barre du bas : plus de carré noir autour du cristal d'Invocation quand l'onglet est ouvert.

## ✅ Version 1.72.4 — Accueil : kit d'interface SpriteCook complet

Toutes les pièces de l'accueil viennent maintenant du **kit d'interface généré par SpriteCook** à partir de la maquette (22 composants, deux fois plus détaillés) :
- les six boutons à cadre doré et le panneau Campagne orné ;
- la barre du haut : anneau d'avatar peint avec médaillon de niveau, barre d'expérience violette peinte, compteurs d'énergie, d'or et de cristaux à cadre peint (icône et « + » dans l'image) ;
- la barre du bas (sur tous les écrans) : bandeau peint à filet doré, icônes peintes grises qui deviennent dorées sur l'onglet actif, cristal d'invocation rond.

## ✅ Version 1.72.3 — Accueil en pièces séparées (plein écran sur tous les téléphones)

- Le décor de la maquette, **refait par SpriteCook sans aucun bouton**, remplit maintenant tout l'écran quelle que soit sa hauteur (plus de grand ciel vide en haut sur les iPhone allongés).
- Les six cadres d'icônes peintes et le panneau Campagne sont devenus des **pièces séparées** (tirées de la maquette, textes effacés) : les boutons se rangent juste sous la barre du haut, comme sur la maquette, et le panneau se pose au-dessus de la barre du bas ; les textes et points rouges restent écrits par le jeu.

## ✅ Version 1.72.2 — Accueil : plus de bande noire sur les grands iPhone

- Sur les téléphones plus hauts que la maquette (iPhone Pro Max, etc.), une grande bande noire restait entre la barre du haut et le décor. Le ciel d'orage est maintenant prolongé au-dessus de l'image (ciel peint assorti, fondu sans raccord), quelle que soit la hauteur de l'écran.

## ✅ Version 1.72.1 — Accueil identique à la maquette SpriteCook

- **La maquette sert maintenant de décor** : son image (le Monde Cousu, le Lien de dos, les six cadres d'icônes peintes et le panneau orné de la Campagne) est utilisée telle quelle, textes effacés. Le jeu pose dessus, exactement aux mêmes endroits, les vrais boutons, les étiquettes, les points rouges et les textes de la campagne (chapitre, nom, étoiles). L'image suit la largeur de l'écran et le ciel se prolonge au-dessus.
- Un lieu pas encore ouvert (Camp, Marché, Événements) reste visible, assombri avec un cadenas ; le toucher dit quand il s'ouvre.
- **Barre du haut comme la maquette** : avatar rond cerclé d'or avec le niveau en médaillon, barre d'expérience violette, compteurs à bord doré avec les icônes peintes (éclair, pièce, cristal), minuteur de la prochaine énergie et « + » vers le Marché.
- **Police de la maquette** (Cormorant Garamond) pour l'accueil et la barre du bas ; onglets « Invocation » et « Combat » comme sur la maquette.

## ✅ Version 1.72.0 — Nouvel accueil (maquette SpriteCook)

Accueil redessiné d'après une maquette générée avec SpriteCook, à partir du décor du jeu :
- **Nouveau décor** (Figma) : le Cœur d'Aeon brisé dans un ciel d'orage violet au-dessus du Monde Cousu (château, ziggourat, citadelle de cristal, grand arbre, terres de lave), et **le Lien de dos** au premier plan, la main lumineuse.
- **Six boutons à icônes peintes** (boussole, tente, échoppe, parchemin, lettre, trophée) découpées dans la maquette, dans des cadres dorés avec leur étiquette sur une petite plaque ; lieux à gauche (Roue, Camp, Marché), suivi à droite (Missions, Courrier, Événements). Les points rouges restent.
- **Panneau Campagne orné** : double filet doré, fond violet, coins en losange et cristal au sommet ; il affiche le chapitre en cours, le prochain niveau et les étoiles.
- **Barre du bas** (sur tous les écrans) : icônes peintes, filet doré, onglet actif qui s'illumine en or, et **Invoquer devient un cristal rond** qui dépasse de la barre.

## ✅ Version 1.71.1 — Écran de victoire : blocs de récompense plus propres

- Les ressources gagnées se partagent toute la largeur (plus de case vide à droite, « Minerai de forge » tient sur une ligne).
- L'objet gagné a sa propre ligne, teintée de sa rareté : pièce, rareté, étoiles, statistique principale et ensemble (avec son emblème), et une flèche pour ouvrir sa fiche.

## ✅ Version 1.71.0 — 4 donjons d'équipement

Pour les joueurs qui ont tout fini : l'ancienne Forge Engloutie est remplacée par **4 donjons d'équipement**, chacun avec son gardien (portrait peint), ses ennemis, ses 15 étages et ses 4 difficultés. Chacun donne un objet garanti à chaque victoire, **uniquement dans ses propres ensembles** :
- **Forge de Guerre** (gardien : le Forgeur de Guerre) : attaque, avec Fureur, Acuité et Massacre.
- **Bastion Englouti** (le Rempart Noyé) : défense, avec Vigueur, Rempart et Résolution.
- **Galerie des Vents** (la Matriarche des Vents) : vitesse, avec Célérité, Élan et Concentration.
- **Jardin Vermeil** (la Reine des Ronces) : survie, avec Sang-vif et Pérennité.

L'écran Donjons sépare « Équipement » et « Ressources » et montre les ensembles de chaque donjon ; dans le donjon, chaque ensemble est détaillé avec son bonus. La progression et une éventuelle série en arrière-plan de l'ancienne Forge sont effacées. Étoiles, rareté et minerai de forge suivent les mêmes règles qu'avant.

## ✅ Version 1.70.1 — Retours : combat, donjons, niveau de compte, classements

- **Plus de flashs quand les cartes frappent** : l'écran ne blanchit plus sur les coups critiques, et l'éclair coloré et le voile rouge sur la carte touchée ont disparu. Restent les traits de l'arme et de l'élément, et le léger tremblement.
- **Donjons : difficultés qui se suivent.** Difficile ne s'ouvre qu'une fois le Normal terminé (étage 15), Expert une fois Difficile terminé, etc. Chaque difficulté reprend là où la précédente s'arrête : l'étage 1 en Difficile est déjà plus dur que l'étage 15 en Normal (force des ennemis : Normal jusqu'à ~20, Difficile 21 → 33, Expert 34 → 50, Cauchemar 52 → 80). Chaque étage affiche le niveau et la puissance de ses ennemis.
- **Équipement gagné visible** : sur l'écran de victoire, l'objet montre ses étoiles, sa pièce et sa statistique principale ; le toucher ouvre sa fiche complète (secondaires, ensemble, renforcer, verrouiller, démanteler). Pareil dans le résumé des combats en arrière-plan.
- **Niveau de compte plus lent** : il fallait moins d'expérience pour un niveau qu'une barre d'énergie n'en rapporte, et chaque niveau rechargeait l'énergie : on montait en boucle. Désormais ~2 barres par niveau au niveau 10, 3 au niveau 20, 4 au niveau 30, 6 au niveau 50.
- **Cible prioritaire en combat auto** : toucher un ennemi le désigne (viseur rouge) ; l'équipe le vise dès qu'elle peut, la provocation restant prioritaire. Re-toucher l'annule.
- **Classements : aperçu du joueur** : toucher un joueur ouvre sa fiche (avatar, niveau, ligue, scores, puissance et son équipe de défense d'Arène) ; « Signaler ou bloquer » reste en bas.

## ✅ Version 1.70.0 — Vague C : 12 héros de plus (88 en tout)

Troisième des 4 vagues de `docs/HEROES_PLAN.md`.
- **4 Communs** : Mirka Fil-de-Lune (novice brodeuse d'étoiles, soins), Dov Poing-Sec (lutteur des arènes, étourdissement), Hesta Pelle-à-Feu (cantinière, soupe qui soigne et régénère), Rook Plume-Grise (braconnier, pièges et poison).
- **4 Peu communs** : Cyprien Sceau-Clair (héraut, ATQ de l'équipe), Zéphine Brise-Vitre (pilote d'essai, gantelets propulseurs), Tarq Mâchoire-d'Os (dompteur de hyènes, défenseur), Elwy Sève-Ardente (gardienne des ruches, régénération et purification).
- **3 Rares** : Anouk Tisse-Orage (augure des tempêtes, étourdissements de groupe), Brévine Croc-Rouge (éclaireuse, fait reculer la jauge de tour), Malo Ancre-Grise (docker, boucliers pour toute l'équipe).
- **1 Épique** : Sahar aux Mille Puits (reine des sables, ATQ et VIT de l'équipe, purification).
- Répartition : 24 Communs, 22 Peu communs, 19 Rares, 13 Épiques, 8 Légendaires, 2 Mythiques.
- **Campagne : plus de héros Mythique offert.** Le boss du chapitre 7 donnait Solenne ; il donne désormais 3 Éclats de faille. Solenne reste dans l'histoire et dans les invocations.

## ✅ Version 1.69.0 — Vague B : 13 héros de plus (76 en tout)

Deuxième des 4 vagues de `docs/HEROES_PLAN.md`.
- **5 Communs** : Ivo Pique-Feu (recrue de la Légion, lance brûlante), Pell Carapace (pêcheur d'oasis, bouclier-carapace), Linnea Rosée (cueilleuse de rosée, accélère l'équipe), Gaspard Pot-de-Colle (alchimiste, ralentit les ennemis), Nim Étincelle (gamin des conduits, double frappe).
- **4 Peu communs** : Maud Cloche-Noire (fossoyeuse-prêtresse, soins et résurrection), Arek Tranche-Dune (lame des caravanes, achèvement), Selka Nuage-Bas (brumière, gel), Fennor Racine-Lente (jeune sylvain, régénération et provocation).
- **3 Rares** : Isaure Lame-Vitrail (duelliste à la rapière de vitrail), Quill Chante-Vide (barde du Néant, ATQ et DÉF de l'équipe), Okoro Corne-Brûlée (bélier de la Légion, défenseur).
- **1 Épique** : Lyssandre l'Inachevée (androïde éveillée, frappes multiples).
- Chacun a son portrait peint, ses compétences, son histoire et ses répliques (aura de chef dès Peu commun).
- Répartition : 20 Communs, 18 Peu communs, 16 Rares, 12 Épiques, 8 Légendaires, 2 Mythiques.

## ✅ Version 1.68.21 — Accueil, page de profil, rôles du clan

- **Accueil** : le décor est celui de l'écran de lancement (le Monde Cousu sous le Cœur d'Aeon, halo et particules) au lieu du portrait du chef d'équipe ; le nom du chef en bas est retiré.
- **Page de profil**, en touchant ton avatar en haut à gauche (avant : les paramètres) :
  - avatar (touche-le pour le changer parmi tes héros), nom (Modifier), niveau de compte et barre d'expérience ;
  - **cadres d'avatar** : « Lien » (le tien) et trois cadres à venir (Gladiateur, Cauchemar, Cœur d'Aeon), marqués « Bientôt » ;
  - **ma progression** : héros possédés, bonus de collection, Tour, ligue d'Arène, combats gagnés, invocations ; campagne par difficulté (niveaux finis et étoiles) ; meilleure difficulté et étage de chaque donjon ;
  - raccourcis vers Sauvegarde et compte, et Paramètres. La carte de profil du Menu y mène aussi.
- **Clan** : le panneau « Les rôles du clan » est retiré ; **seul le chef peut ouvrir ou fermer le clan** (les adjoints gardent la présentation et l'exclusion de simples membres). Les règles du serveur (firestore.rules) et leur test sont mis à jour.

## ✅ Version 1.68.20 — Rotation de l'écran sur iPhone

- **Correctif** : après être passé en paysage puis revenu en portrait, on ne pouvait plus rien toucher. En paysage, un iPhone est assez large pour que le jeu passe dans sa disposition « ordinateur » (colonne centrale) ; au retour, iOS gardait des zones de toucher décalées.
  - Un téléphone couché garde maintenant la disposition téléphone : la disposition ordinateur demande aussi au moins 560 px de hauteur.
  - À chaque rotation, le jeu se recale (page remise en haut, champ de saisie relâché, mise en page recalculée).

## ✅ Version 1.68.19 — Roue de fortune ancienne

- **Nouvel habillage de la roue**, façon roue de fortune ancienne : secteurs de pierre peinte teintés, épais cerclage d'or gravé et clouté, gemmes rouges au bout des rayons d'or, cristal d'Aeon au moyeu, griffe dorée en guise d'aiguille (qui vibre pendant que la roue tourne), halo lumineux. Chiffres en lettres de titre.
- **12 cases** : énergie 5 / 10 / 30 / 50, **élixirs 1 / 3 / 5 / 10**, or 5 000 / 15 000, 30 cristaux, et l'Éclat de faille (toujours 3 %).

| Case | Chance |
|---|---|
| 5 énergie | 14 % |
| 10 énergie | 12 % |
| 30 énergie | 7 % |
| 50 énergie | 4 % |
| 1 élixir | 12 % |
| 3 élixirs | 10 % |
| 5 élixirs | 7 % |
| 10 élixirs | 4 % |
| 5 000 or | 12 % |
| 15 000 or | 6 % |
| 30 cristaux | 9 % |
| Éclat de faille | 3 % |

- L'Accueil montre une **icône de roue** (au lieu d'une étoile).

## ✅ Version 1.68.18 — Roue quotidienne

- **Nouveau bouton « Roue » sur l'Accueil** (point rouge quand le tour du jour est disponible) : **un tour gratuit par jour**.
- 8 cases : **5, 10, 30 et 50 énergie** (l'énergie gagnée peut dépasser le maximum), 5 000 or, 30 cristaux, 3 élixirs d'expérience, et une **case rare avec un Éclat de faille** (3 % de chances).

| Case | Chance |
|---|---|
| 5 énergie | 22 % |
| 10 énergie | 18 % |
| 30 énergie | 9 % |
| 50 énergie | 5 % |
| 5 000 or | 18 % |
| 30 cristaux | 12 % |
| 3 élixirs d'expérience | 13 % |
| Éclat de faille | 3 % |

- La case gagnée est tirée et donnée dès le toucher, puis la roue tourne jusqu'à elle ; le gain du jour reste affiché, avec le temps avant le prochain tour.
- Tests : un tour par jour, récompense donnée, cases et rareté de l'Éclat de faille.

## ✅ Version 1.68.17 — Écran de victoire compact

- La phrase d'un héros en haut de l'écran de victoire est retirée.
- **Récompenses compactes** : petites tuiles de 3 par ligne (icône à gauche, quantité en gros, nom en dessous sur deux lignes au plus) ; l'équipement gagné s'y range aussi (miniature, nombre d'étoiles, « Nouvel équipement »). Sur un combat normal, tout l'écran tient désormais sans défiler.

## ✅ Version 1.68.16 — Écran de victoire plus court

- **Une seule liste de héros** (« Tes héros ») au lieu de deux : chaque ligne montre la part des dégâts (barre, %, total, « Meilleur ») et, juste dessous, le niveau (« Niv. 37 ▲ » en vert s'il monte, ou « Niveau max ») et l'expérience gagnée.
- **Les boutons Retour, Rejouer et Suivant restent toujours visibles en bas** de l'écran de résultat : plus besoin de faire défiler pour passer au niveau suivant.

## ✅ Version 1.68.15 — Saisons d'Arène

- **L'Arène se joue en saisons d'une semaine** (elles finissent au renouvellement hebdomadaire, le lundi à 5 h). Le compte à rebours est affiché dans l'Arène.
- **Plus de récompense à chaque victoire** : les victoires ne donnent que des points de classement (et l'expérience habituelle). **La récompense arrive en fin de saison**, selon la ligue où tu termines, si tu as combattu au moins une fois :

| Ligue | Récompense de saison |
|---|---|
| Bronze | 10 000 or, 50 cristaux, 3 éclats ternes |
| Argent | 20 000 or, 100 cristaux, 1 éclat d'Aeon |
| Or | 35 000 or, 180 cristaux, 2 éclats d'Aeon |
| Platine | 50 000 or, 260 cristaux, 3 éclats d'Aeon, 1 éclat de faille |
| Diamant | 80 000 or, 400 cristaux, 5 éclats d'Aeon, 2 éclats de faille |

- La récompense t'attend dans l'Arène (« Saison terminée » → Récupérer) ; un point rouge le signale sur la carte Arène.
- **Nouvelle saison** : le classement repart de plus bas (tu gardes la moitié de tes points au-dessus de 1000 ; un classement sous 1000 ne baisse pas).
- Le fonctionnement est expliqué dans la fenêtre **« Ligues »** (saisons, récompenses par ligue, points, défense, tickets).
- L'événement « Tournoi des Bannières » donne maintenant **plus de points** à chaque victoire (au lieu de plus de récompenses).
- Tests : pas de récompense à la victoire, récompense de fin de saison selon la ligue, remise à niveau du classement, rien sans combat.

## ✅ Version 1.68.14 — Coffres d'étoiles par difficulté

- Les coffres d'étoiles ne sont plus par chapitre mais **par difficulté** (Normal, Difficile, Expert, Cauchemar) : toutes les étoiles gagnées dans les 9 chapitres d'une difficulté (270 au plus) ouvrent **un coffre tous les 30 étoiles** (9 coffres par difficulté), sur une piste en haut de l'écran de campagne.
- Un coffre sur trois (90, 180, 270 étoiles) donne des **Éclats de faille** (1 / 2 / 3 / 4 selon la difficulté) et des cristaux ; les autres donnent des éclats d'Aeon (ou ternes en Normal), de l'or et des cristaux ; le dernier coffre ajoute des essences d'éveil. Tout est multiplié par 1, 2, 3 ou 4 selon la difficulté.
- Les étoiles déjà gagnées comptent. Un point rouge sur l'onglet de la difficulté et sur la carte Campagne signale un coffre prêt.

## ✅ Version 1.68.13 — Arène par ligue, adversaires actualisables

- **Les adversaires sont des joueurs de ta ligue** (Bronze, Argent, Or, Platine, Diamant), quelle que soit leur puissance, au lieu d'un filtre de puissance (50 à 170 % de la tienne) qui écartait les nouveaux joueurs. Les 3 adversaires sont choisis au plus près de 70 %, 95 % et 115 % de ta puissance, puis rangés du plus faible au plus fort (Accessible, Équilibré, Redoutable). S'il n'y a pas assez de joueurs dans ta ligue, l'Arène complète avec des Héritiers imaginaires.
- Les joueurs de ta ligue sont rechargés à **chaque visite** de l'Arène (avant : une fois par session), pour que les nouveaux joueurs apparaissent vite.
- **Bouton « Actualiser »** : de nouveaux adversaires, **une fois gratuitement par jour**, ensuite **20 cristaux**. Une vengeance en cours est gardée.
- **Écran allégé** : le bouton « Classement » et le texte d'explication sont retirés (les classements restent dans Menu → Classements). À la place, un bouton **« Défense »** ouvre la gestion de ton équipe de défense (choix de l'équipe, et accès direct aux équipes).
- **Bouton « Ligues »** à côté de « Défense » : les 5 ligues avec leurs points (et la tienne mise en avant), la récompense de chaque victoire, les points gagnés ou perdus (victoire, défaite, défense), les tickets et l'actualisation.
- Rappel : un joueur apparaît dans l'Arène une fois connecté à son compte et l'Arène débloquée (après le niveau 3-4).
- Tests : choix dans la ligue, bornes des ligues, actualisation gratuite puis payante.

## ✅ Version 1.68.12 — Coffres d'étoiles de la campagne

- **Dans chaque chapitre et chaque difficulté, 3 coffres d'étoiles** (à 10, 20 et 30 étoiles), sous la carte du chapitre, avec une barre de progression. Un coffre prêt brille ; on le touche pour le récupérer.
- Récompenses, de plus en plus généreuses avec la difficulté (par chapitre) :

| Difficulté | 10 ★ | 20 ★ | 30 ★ |
|---|---|---|---|
| Normal | 3 éclats ternes, 5 000 or | 1 éclat d'Aeon, 50 cristaux | **1 éclat de faille**, 100 cristaux |
| Difficile | 1 éclat d'Aeon, 10 000 or | **1 éclat de faille**, 80 cristaux | **2 éclats de faille**, 150 cristaux |
| Expert | 2 éclats d'Aeon, 20 000 or | **2 éclats de faille**, 100 cristaux | **3 éclats de faille**, 200 cristaux, 1 essence d'éveil |
| Cauchemar | 3 éclats d'Aeon, 40 000 or | **3 éclats de faille**, 150 cristaux | **4 éclats de faille**, 300 cristaux, 2 essences d'éveil |

- Les étoiles déjà gagnées comptent : les coffres des chapitres déjà faits sont récupérables tout de suite.
- Un point rouge signale un coffre prêt (sur l'onglet de la difficulté, le chapitre, et la carte Campagne de l'écran Combats).
- Tests : paliers, une seule récupération, étoiles déjà gagnées, éclats de faille en difficulté haute.

## ✅ Version 1.68.11 — L'équipement vient de la Forge Engloutie

- **L'équipement ne se gagne plus qu'au donjon Forge Engloutie** (un objet garanti à chaque victoire, y compris en arrière-plan). La campagne ne donne plus d'équipement, seulement ses autres butins. Le Marché en vend toujours.
- **Étoiles selon l'étage** : étages 1 et 2 → 1 à 2 ★, étages 3 à 9 → 1 à 3 ★, étage 10 et plus → 3 à 4 ★. Les petites étoiles restent les plus fréquentes (pour 1 à 3 ★ : 50 %, 33 %, 17 %).
- **Plus la difficulté est haute, meilleurs sont les objets** : Difficile +1 ★, Expert +2 ★, Cauchemar +3 ★ (6 ★ au plus) ; par exemple étage 10 : 4 à 5 ★ en Difficile, 5 à 6 ★ en Expert, 6 ★ en Cauchemar. La rareté monte aussi avec la difficulté.
- Chaque étage de la Forge affiche sa fourchette d'étoiles, et l'écran de préparation la rappelle.
- Tests : fourchettes, tirage, un objet par victoire, plus d'équipement en campagne.

## ✅ Version 1.68.10 — Équipement à côté de l'or

- Écran de victoire : l'équipement gagné se range **dans la même rangée que l'or et les ressources**, dans une case de la même taille (« Nouvel équipement »), au lieu d'une ligne séparée en dessous.

## ✅ Version 1.68.9 — Difficultés des donjons, fin du Balayage

- **Les 4 donjons ont maintenant les 4 difficultés de la campagne** : Normal, Difficile, Expert, Cauchemar (onglets en haut de chaque donjon, la difficulté choisie est retenue).
  - Ennemis +15 / +30 / +45 niveaux et plus puissants (×1,25 / ×1,6 / ×2,1), un peu plus d'énergie par combat (+1 / +2 / +3).
  - Récompenses ×1,6 / ×2,4 / ×3,5 (y compris l'expérience des héros) ; à la Forge Engloutie, l'équipement est tiré comme 3 / 6 / 9 étages plus haut (meilleure rareté, plus d'étoiles).
  - Une difficulté s'ouvre quand l'étage 10 est terminé dans la précédente ; chaque donjon a sa propre progression. La liste des donjons montre la plus haute difficulté ouverte.
  - Les combats en arrière-plan fonctionnent dans chaque difficulté.
- **Le Balayage (multi-combat instantané) est retiré** de l'écran de préparation. Il reste le bouton **⟳ Répéter** (combats en arrière-plan). La montée rapide de la Tour, elle, ne change pas.
- **Le sac n'affiche plus les doublons de héros** : ils se gèrent depuis l'onglet Héros (Liens) et le Sanctuaire (Absorber).
- Tests : ouverture des difficultés, ennemis et récompenses, progression séparée, arrière-plan.

## ✅ Version 1.68.8 — +10 énergie maximum par niveau de compte

- Le maximum d'énergie grandit maintenant de **10 par niveau de compte** (au lieu de 2) : 130 au niveau 2, 210 au niveau 10, 310 au niveau 20, 420 au niveau 31… jusqu'à 900. Chaque niveau recharge toujours toute l'énergie jusqu'au nouveau maximum.

## ✅ Version 1.68.7 — L'énergie grandit avec le compte

- **Maximum d'énergie selon le niveau de compte** : 120 au niveau 1, **+2 à chaque niveau** (140 au niveau 11, 158 au niveau 20, 180 au niveau 31), jusqu'à 240. La régénération va jusqu'à ce maximum ; l'affichage (barre du haut, sac, préparation) et les notifications « énergie pleine » le suivent.
- **Chaque nouveau niveau de compte recharge toute l'énergie** jusqu'au nouveau maximum (au lieu de +30). Un surplus déjà au-delà du maximum, venu des récompenses, est gardé. Le résultat de combat l'annonce.
- Tests : maximum par niveau, recharge au passage de niveau, surplus gardé, régénération jusqu'au nouveau maximum.

## ✅ Version 1.68.6 — Grande image d'objet, coût du bouton Max

- **Bouton « Max » des élixirs (Sanctuaire)** : le coût s'affiche avant de valider : une ligne sous les élixirs (« Max : niv. 22 → 25 · 40 élixirs · 112 k or ») et une fenêtre de confirmation avec le détail exact (élixirs et or utilisés sur ce que tu as, niveau atteint, et ce qui manque s'il n'y en a pas assez pour aller jusqu'au bout). Le bouton « +1 » indique aussi son prix en or. Test : l'aperçu correspond exactement à la dépense.
- Depuis que la statistique principale n'est plus écrite sur l'image (v1.67.1), la carte de l'objet rétrécissait à la taille de son contenu. Elle fait maintenant 112 px de large (environ trois fois plus de surface), avec un cadre plus épais, le niveau, l'emblème d'ensemble et les étoiles agrandis. Même chose au Marché.

## ✅ Version 1.68.5 — Combats en arrière-plan

- **Nouveau bouton ⟳ sur l'écran de préparation** (campagne et donjons) : lance une série de 1 à 50 combats sur un niveau **déjà gagné une fois** (pas besoin de 3 étoiles, contrairement au Balayage).
- Les combats se jouent tout seuls, **un toutes les 30 secondes**, pendant que tu fais autre chose dans le jeu, et **même jeu fermé** : ceux qui auraient dû se jouer sont rattrapés au retour.
- Vrais combats du moteur, mêmes coûts et mêmes récompenses ; s'il manque de l'énergie, la série **attend** qu'elle revienne ; option « S'arrêter à la première défaite ».
- **Une pastille au-dessus de la navigation**, sur tous les écrans, montre la progression (par ex. « 3/10 ») ; on la touche pour voir le butin gagné, l'équipement obtenu, arrêter la série ou fermer le résumé. Un message prévient quand la série se termine.
- Tests : niveau déjà gagné requis, un combat toutes les 30 s, rattrapage, attente d'énergie, arrêt à la défaite.

## ✅ Version 1.68.4 — Décors peints des combats

- **9 vrais paysages peints**, un par région de la campagne (et des modes qui s'y déroulent), à la place d'un portrait de boss flouté et assombri : remparts de Valcrest, forêt de Sylvaran, citadelle du Prisme, dunes d'Akkar, abîme de la Légion, observatoire du Concordat, Cœur d'Aeon, Coutures du monde, Rivage gris.
- Chaque décor laisse une zone dégagée au milieu pour les combattants, et n'est presque plus flouté.
- Téléchargés seulement quand on combat dans la région (environ 100 Ko chacun), puis gardés pour jouer hors ligne.

## ✅ Version 1.68.3 — Absorber les doublons

Les petites raretés en double avaient peu d'usage une fois les Liens remplis.
- **Au Sanctuaire, « Absorber des héros » accepte maintenant les doublons en réserve.** Un doublon vaut le double de l'expérience de base de sa rareté (Commun 800, Peu commun 1 400, Rare 2 400, Épique 4 400…) pour 400 or, et **ne retire rien de la collection**.
- La fenêtre de choix montre d'abord les doublons (compteur « 1/3 » : on en ajoute un à chaque toucher), puis les héros (qui, eux, quittent la collection).
- L'annonce du premier doublon le dit aussi.
- Test : valeur, consommation des doublons, collection intacte, impossible d'en prendre plus qu'on n'en a.

## ✅ Version 1.68.2 — Économie : moins d'invocations, plus de valeur

L'audit a montré qu'un joueur régulier gagnait 500 à 800 cristaux par jour (2 à 3 invocations épiques), surtout grâce au boss mondial. D'où trop de doublons.
- **Boss mondial** : cristaux par combat 15 / 25 / 40 / 60 (au lieu de 30 / 60 / 100 / 160). Or, minerai, potions et parchemins inchangés.
- **Bonus des missions** : 100 cristaux par jour (au lieu de 150) et 250 par semaine (au lieu de 400).
- Total : environ 1 à 1,5 invocation épique par jour en milieu de partie, un peu moins de 2 au plus haut niveau.
- **Appel rare (éclats d'Aeon)** : un Épique une fois sur six (16 % au lieu de 7 %), Légendaire 1,8 %, Mythique 0,2 %, et un Légendaire garanti au 50e appel (au lieu du 100e, qui demandait environ 6 mois).
- Tests : estimation des cristaux par jour et taux de l'appel rare.

## ✅ Version 1.68.1 — Corrections de l'audit complet

- **Lisibilité** : plus aucun texte sous 11 px (« XP » sous le nom, « ♛ Chef » de la préparation).
- **Premier lancement** : une seule fenêtre « Bienvenue », la suivante s'appelle « Tu es le Lien » et explique enfin ce qu'est le Monde Cousu.
- **Écran Combats** : une carte seule sur la dernière ligne prend toute la largeur (plus de trou).
- **Moins de points rouges** : le Marché n'en affiche plus (rien à récupérer), le Camp seulement après 8 h de butin, et le Camp n'allume plus l'onglet Accueil.
- **Succès de collection** : 50, 75 et 100 héros.
- **Hors ligne** : le téléphone garde jusqu'à 700 illustrations (100 héros, ennemis, équipements, ressources).
- **Sécurité des mises en ligne** : chaque proposition de changement passe les tests et la construction du jeu avant sa fusion.

## ✅ Version 1.68.0 — Vague A : 13 héros de plus (63 en tout)

Première des 4 vagues prévues dans `docs/HEROES_PLAN.md` (50 héros de plus, surtout de petites raretés, pour que les doublons deviennent rares).
- **13 nouveaux héros** : 5 Communs (Bastien, Tilde, Roc, Wenna, Kesh), 4 Peu communs (Oriane, Hadrien, Ysmaë, Tobbe), 3 Rares (Sorcha, Djeral, Cassien) et 1 Épique (Vespera). Chacun a son portrait peint, ses compétences, son histoire et ses répliques, et une aura de chef à partir de Peu commun.
- Répartition : 15 Communs, 14 Peu communs, 13 Rares, 11 Épiques, 8 Légendaires, 2 Mythiques.
- **Paliers de collection jusqu'à 100 héros** : 60, 70, 80, 90 et 100 s'ajoutent (+1 % PV, ATQ et DÉF chacun).
- Un adversaire imaginaire de l'Arène s'appelait Vespera : il est renommé Vesprine, pour ne pas le confondre avec la nouvelle héroïne.

## ✅ Version 1.67.1 — Équipement rangé par ensemble

- **Listes rangées par ensemble**, comme dans les grands jeux du genre : le sac de la Forge, le Démantèlement et la liste « Changer » de la fiche d'un héros regroupent les objets sous un bandeau par ensemble (emblème, nom, nombre de pièces, bonus, nombre d'objets). Les ensembles les plus fournis passent en premier, et le tri choisi s'applique à l'intérieur de chaque ensemble.
- **Fiche d'un objet allégée** : la statistique principale n'est plus écrite sur l'image de l'objet, seulement dans la liste « Principale » en dessous (même chose au Marché). Les petites cartes des listes la gardent pour aider à choisir.

## ✅ Version 1.67.0 — Dix héros du rang et un sac illustré

- **10 nouveaux héros à invoquer**, de raretés basses pour que les grandes raretés restent précieuses : 50 héros en tout (10 Communs, 10 Peu communs, 10 Rares, 10 Épiques, 8 Légendaires, 2 Mythiques)
  - Communs : **Merrin la Lanternière** (soigneuse, Valcrest), **Jory Fronde-Vive** (contrôle, Sylvaran), **Sefa Dent-de-Sable** (assassin au poison, Akkar), **Ansel Rivet** (défenseur à boucliers, Prisme)
  - Peu communs : **Rhoswen Voile-Pâle** (soutien, Concordat Astral), **Brakka Cuir-Noir** (attaquant à la brûlure, Légion de Cendre), **Ilse Corne-de-Brume** (gel et ralentissement, Valcrest)
  - Rares : **Naerys Plume-d'Orage** (archère des tempêtes, Concordat Astral), **Gorm Poing-de-Lave** (défenseur de lave, Légion de Cendre), **Zahra Lune-des-Puits** (soigneuse, Akkar)
  - Chacun a son portrait peint, ses compétences, son histoire, ses répliques et (pour les Peu communs et Rares) une aura de chef
- **Paliers de collection à 45 et 50 héros** : +1 % PV, ATQ et DÉF chacun (jusqu'à +9 %)
- **Ressources du sac illustrées** : or, cristaux, éclats, élixir, grimoire, sceau, potions, minerai, parchemin et essence ont leur image peinte (sac, récompenses, Marché)
- **Ensemble Élan complet** : le pendentif et la relique ont aussi leur illustration ; tous les équipements sont illustrés

## ✅ Version 1.66.4 — Invocations plus rares et niveau de compte visible

- **Invocation épique** (300 cristaux) : Rare garanti, Épique 44 %, Légendaire 3,6 %, Mythique 0,4 % (au lieu d'Épique garanti) ; un Épique au moins par appel ×10 ; Légendaire garanti au 40ᵉ appel
- **Invocation standard** : Commun 70 %, Peu commun 26 %, Rare 4 % (au lieu de 60/32/8)
- **Invocation rare** : Épique 7,2 %, Légendaire 0,7 % (au lieu de 9 et 0,9)
- **Niveau de compte** : médaillon doré sur l'avatar en haut de l'écran, jauge d'expérience sous le nom ; en fin de combat, un encadré « Niveau de compte » avec l'expérience gagnée et la jauge qui se remplit

## ✅ Version 1.66.3 — Récap des dégâts et équipe plus visible

- **Récap des dégâts** à la fin de chaque combat (victoire ou défaite) : part des dégâts de chaque héros en %, total et barre, le meilleur mis en avant ; poison et brûlure comptent pour celui qui les a posés, et seuls les dégâts réellement encaissés sont comptés (bouclier compris)
- **Préparation du combat** : cartes de l'équipe plus hautes et portraits dégagés ; seule l'affinité reste sur la carte (plus de rôle, de faction ni d'étoiles) ; l'étiquette « Chef » passe sous la carte du chef

## ✅ Version 1.66.2 — Équipement bien visible sur la fiche

- Emplacements d'équipement agrandis sur la fiche du héros
- Cadre épais à la couleur de la rareté, avec un léger halo : on voit d'un coup d'œil ce qui est porté et sa qualité
- Niveau (+N) sur une pastille sombre, étoiles plus grandes sur un dégradé : lisibles sur n'importe quelle image
- Emplacement vide en pointillés, bien distinct d'un objet porté

## ✅ Version 1.66.1 — Effets lisibles en combat

- **Symboles d'effets** : chaque bonus et malus a son dessin (épée, bouclier ou éclair avec une flèche ▲ ▼, goutte de poison, flamme, flocon, étoiles d'étourdissement, cible de provocation, cœur de régénération, croix de résurrection) suivi de sa valeur et des tours restants
- **Bouton « Effets »** en haut du combat : la légende de tous les symboles, bonus en vert puis malus en rouge
- Pastilles compactes, deux par ligne : visibles même sous les héros du second rang
- En AUTO, le bloc « Combat automatique » disparaît pour laisser la place au combat ; il revient avec les compétences quand on reprend la main

## ✅ Version 1.66.0 — Un jeu plus vivant

- **Effets de clic** : chaque bouton et tuile s'enfonce un instant et lance une onde dorée sous le doigt (un éclat plus vif sur les boutons dorés)
- **Compteurs vivants** (énergie, or, cristaux) : la valeur défile jusqu'au nouveau total et « +N » s'envole ; un gain obtenu ailleurs (Camp, combat, Marché) défile au retour sur l'Accueil
- **Listes en cascade** : héros, Menu, modes de combat, missions et Marché apparaissent l'un après l'autre
- L'onglet choisi rebondit, les pastilles de notification battent doucement, un reflet traverse le bouton Campagne de temps en temps ; sur ordinateur, les cartes se soulèvent au survol
- Tout est léger et coupé par « Animations réduites »
- Prêt pour les illustrations des ressources du sac (vignettes du sac, des récompenses et du Marché)

## ✅ Version 1.65.0 — Vagues bien séparées en combat

- **Frise des vagues** en haut du combat : « ✓ Vague 1 · Vague 2 · Boss », la vague en cours en surbrillance, celle du boss en rouge
- **Écran de transition** entre deux vagues : « ✓ Vague 1 terminée », puis « Vague 2 » (ou « Le boss arrive » en rouge), environ 1,5 seconde
- **Les nouveaux ennemis entrent en scène** (ils descendent l'un après l'autre) au lieu d'apparaître d'un coup

## ✅ Version 1.64.0 — Équipement illustré

- **Chaque objet a son illustration**, peinte dans le style des héros : une par ensemble et par emplacement (arme, casque, armure, gants, bottes, accessoire, artefact), avec l'univers de son ensemble — bois vivant et mousse pour Vigueur, acier rouge braise pour Fureur, acier bleu de chevalier pour Rempart, assassin noir et or pour Acuité, cristal violet pour Concentration, plumes d'argent pour Célérité, os et cramoisi pour Sang-vif, bronze du désert pour Massacre, jade et pierre blanche pour Résolution, bois doré en fleurs pour Pérennité, horlogerie de bronze pour Élan
- Partout où un objet s'affiche : Forge, sac, fiche du héros, victoire, Marché. Les informations (niveau, ensemble, étoiles, statistique) restent lisibles par-dessus
- 256 px, environ 10 Ko chacune, téléchargées à l'affichage puis gardées hors ligne (l'installation ne grossit pas)

## ✅ Version 1.63.1 — Notifications fiables

- Les heures à annoncer (camp plein, énergie au maximum) partaient seulement quand on quittait le jeu ; l'iPhone coupait souvent cet envoi : aucune notification n'était jamais programmée. Elles partent maintenant **toutes les 3 minutes pendant qu'on joue** (et au retour dans le jeu) ; le serveur attend que le joueur n'ait plus donné signe de vie depuis 5 minutes pour le prévenir
- Le journal d'envoi indique le nombre de téléphones inscrits et d'annonces programmées (sans donnée personnelle)

## ✅ Version 1.63.0 — Effets visibles en combat

- **Bonus et malus listés sous chaque carte**, avec leur **valeur** et les tours restants : « ATQ▲ +25 % · 2 », « PSN −10 % · 3 », « BCL 1,3k · 2 »… Les malus d'abord (rouge), puis les bonus (vert) ; doses de poison et de brûlure cumulées, bouclier additionné ; 4 effets affichés, « +n » pour les suivants
- **Fiche d'une carte** (appui long, ou clic droit sur ordinateur) : chaque effet expliqué en clair avec ses chiffres (« Perd 10 % de ses PV max à chaque tour (2 doses) », « Bouclier : absorbe encore 1 250 points de dégâts »…)

## ✅ Version 1.62.1 — Ordinateur : tailles corrigées

- Sur ordinateur, la colonne du jeu suit maintenant la **hauteur** de l'écran (proportions d'un téléphone, environ 0,6) au lieu d'une largeur fixe de 640 px : sur un portable peu haut, elle était presque carrée et tout paraissait démesuré (illustrations, cartes, équipe). De 380 à 640 px de large selon l'écran
- 4 héros par ligne seulement quand la colonne est large ; cartes de combat un peu plus petites

## ✅ Notifications : envoi en chaîne

- La programmation de GitHub ne déclenchait jamais l'envoi pour ce dépôt. Chaque lancement envoie désormais les notifications toutes les 10 minutes pendant une heure, puis relance lui-même le suivant (chaîne continue, démarrée une fois à la main ; la programmation reste en secours)

## Suites possibles

- Nouveaux arcs narratifs et héros après la fin de l'histoire principale

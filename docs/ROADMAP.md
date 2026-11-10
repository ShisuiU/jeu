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

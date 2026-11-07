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

## Suites possibles

- Nouveaux arcs narratifs et héros après la fin de l'histoire principale
- Arène entre joueurs, guildes

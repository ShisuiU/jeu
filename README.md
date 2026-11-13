# Aeonfall — Les Héritiers de la Fracture

RPG mobile de collection de héros au tour par tour, univers original mêlant fantasy médiévale,
science-fiction et civilisations antiques. Conçu pour iPhone, jouable **hors ligne**, **gratuit**,
sans App Store ni serveur : c'est une application web progressive (PWA) qu'on installe depuis Safari.

> État : **version 1.83.2** (scène de combat en perspective) — histoire en 9 chapitres (90 niveaux, 4 difficultés), 88 héros, invocations, améliorations, maîtrises, équipement, marché, 7 donjons dont 4 d’équipement (15 étages), tour (100 étages), camp (butin d’absence), boss mondial, arène, missions, expéditions, un événement différent chaque semaine, comptes et classements en ligne.

**Jouer : https://jeu-aeonfall.vercel.app/** (adresse principale, hébergée par Vercel). Secours : https://shisuiu.github.io/jeu/ (GitHub Pages). Voir [docs/ROADMAP.md](docs/ROADMAP.md).

## Jouer sur iPhone

1. Ouvrir l'adresse du jeu dans **Safari** (voir « Publier » ci-dessous).
2. Toucher **Partager** → **Sur l'écran d'accueil**.
3. Lancer le jeu depuis l'icône : plein écran, hors ligne, sauvegarde persistante.

**Mises à jour :** à l'ouverture, le jeu propose « Nouvelle version disponible → Mettre à jour ».
Sinon, fermez complètement l'app (balayage vers le haut) et rouvrez-la. La progression est conservée
et convertie automatiquement si le format de sauvegarde évolue.

⚠️ Installez le jeu sur l'écran d'accueil : Safari peut effacer les données des sites non installés
après 7 jours sans visite. Créez un compte gratuit (Menu → Compte) pour sauvegarder la partie en ligne
et la retrouver sur un autre appareil, ou exportez-la (Menu → Sauvegarde).

## Publier gratuitement (GitHub Pages)

1. Fusionner le travail dans la branche `main`.
2. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
3. Chaque push sur `main` lance les tests, compile et publie le jeu à
   `https://<votre-compte>.github.io/<nom-du-dépôt>/`.

Alternative : Cloudflare Pages (commande de build `npm run build`, dossier `dist`).

## Développement

```bash
npm install
npm run dev       # serveur local (accessible depuis l'iPhone sur le même Wi-Fi)
npm test          # tests unitaires (sauvegarde, horloge, énergie, statistiques…)
npm run test:rules  # règles de sécurité Firestore, sur l’émulateur Firebase (Java requis)
npm run build     # version de production dans dist/
npm run preview   # tester la version de production
npm run icons     # régénérer les icônes PNG depuis public/icons/icon.svg
```

## Documentation

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — univers, histoire, factions, héros, systèmes de jeu
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — choix techniques, dossiers, sauvegarde, hors ligne
- [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) — direction artistique et intégration des illustrations
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases de développement et avancement
- [docs/EVENTS.md](docs/EVENTS.md) — créer un événement en modifiant un simple fichier

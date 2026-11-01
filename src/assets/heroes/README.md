# Illustrations des héros

Un dossier par héros, nommé avec l'identifiant du héros (voir `src/data/heroes.ts`) :

```
src/assets/heroes/aldric/portrait.webp   ← carré ou 3:4, visage et buste (cartes, avatars)
src/assets/heroes/aldric/full.webp       ← illustration complète en pied, 3:4 ou 9:16 (fiche du héros)
src/assets/heroes/aldric/battle.webp     ← (optionnel) modèle de combat, fond transparent (PNG/WebP)
```

Les images sont détectées automatiquement à la compilation (aucune ligne de code à modifier),
optimisées par Vite et mises en cache pour le jeu hors ligne.

Recommandations : WebP, 768×1024 pour `portrait`, 1024×1536 pour `full`, < 250 Ko chacune.
Le champ `look` de chaque héros dans `heroes.ts` sert de cahier des charges / prompt de génération.

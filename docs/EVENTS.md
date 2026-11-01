# Créer ou renouveler un événement (sans mettre à jour l'application)

Le jeu télécharge **`public/events.json`** à chaque lancement (s'il y a une connexion), le mémorise
pour le hors-ligne, et retombe sur la liste intégrée (`src/data/events.ts`) sinon. Pour lancer un
nouvel événement, il suffit de modifier ce fichier sur GitHub : le site est republié en une minute
et les joueurs le reçoivent au prochain lancement, sans nouvelle version du code.

## Format

```json
{
  "version": 1,
  "events": [
    {
      "id": "ev_exemple_2027",            // identifiant unique (ne jamais réutiliser)
      "name": "Nom affiché",
      "description": "Texte de présentation.",
      "color": "#ff3d6e",
      "start": "2027-02-01T00:00:00Z",    // dates ISO (UTC)
      "end": "2027-02-28T23:59:59Z",
      "banners": ["event_ash"],          // bannières d'invocation ouvertes (voir src/data/summons.ts)
      "dungeonBonus": 1.5,               // multiplicateur du butin des donjons (optionnel)
      "tasks": [                         // objectifs (optionnel)
        { "id": "t1", "key": "battleWin", "target": 15, "title": "Remporter 15 combats", "reward": { "shardEvent": 3 } }
      ],
      "challenge": {                     // défi unique (optionnel)
        "id": "c1", "name": "Défi", "description": "…",
        "waves": [[{ "enemy": "rift_hound", "level": 12, "slot": 0 }]],
        "reward": { "crystals": 150 }
      }
    }
  ]
}
```

- **Objectifs (`key`)** : `login`, `battleWin`, `campaignWin`, `dungeonWin`, `towerWin`, `arenaFight`,
  `arenaWin`, `worldBoss`, `energySpent`, `summon`, `gearUpgrade`, `heroUpgrade`, `challengeWin`.
- **Récompenses** : toute ressource de `src/data/resources.ts` (`gold`, `crystals`, `shardAeon`,
  `shardEvent`, `xpElixir`, `potionMinor`…) et `energy`.
- **Ennemis** : identifiants de `src/data/enemies.ts` ; `slot` 0-2 = première ligne, 3-4 = seconde.
- Les dates utilisent l'horloge de confiance du jeu : reculer l'heure du téléphone ne rouvre pas un
  événement terminé.

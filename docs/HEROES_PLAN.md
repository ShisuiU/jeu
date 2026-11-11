# Plan : 50 nouveaux héros (v1.68 → v1.71)

Objectif : passer de 50 à **100 héros**, surtout dans les raretés basses, pour que les doublons deviennent rares.

| Rareté | Avant | Ajout | Après |
|---|---|---|---|
| Commun | 10 | +18 | 28 |
| Peu commun | 10 | +16 | 26 |
| Rare | 10 | +12 | 22 |
| Épique | 10 | +4 | 14 |
| Légendaire | 8 | 0 | 8 |
| Mythique | 2 | 0 | 2 |

Livraison en 4 vagues (une par nuit, quand les crédits d'illustration Figma reviennent à 0 h UTC).
Chaque héros : 2 compétences (Commun), 3 compétences + aura de chef (Peu commun et plus), histoire, réplique, 3 répliques de fiche, portrait peint.
Règle : jamais un personnage repris d'un autre jeu.

Format : `id` · Nom · titre · rareté · faction · rôle · affinité · idée

## Vague A — v1.68.0 ✅ livrée
- `bastien` · Bastien Coupe-Paille · Milicien des Moissons · C · valcrest · attacker · solar · paysan devenu soldat, faux de moisson
- `tilde` · Tilde Écrou · Apprentie des Ateliers · C · prism · support · telluric · mécanicienne, petit drone réparateur (DÉF+)
- `roc` · Roc Bouche-de-Braise · Forgeron de la Légion · C · ash · defender · telluric · tablier de cuir, marteau, enclume-bouclier
- `wenna` · Wenna Mousse-Douce · Herboriste des Marais · C · sylvaran · healer · lunar · cataplasmes, régénération
- `kesh` · Kesh l'Ensablé · Devin des Dunes · C · akkar · controller · void · vieux devin aveugle, poudre de sable (ATQ−)
- `oriane` · Oriane Clairevoie · Lame de l'Observatoire · U · astral · assassin · lunar · lame silencieuse, achèvement
- `hadrien` · Hadrien Mur-de-Sel · Gardien des Salines · U · valcrest · defender · void · bouclier de sel, provocation
- `ysmae` · Ysmaë Fil-d'Argent · Tisseuse de Filets · U · prism · controller · void · filets holographiques (VIT−, gel)
- `tobbe` · Tobbe Rieur-de-Cendre · Tambour de Guerre · U · ash · support · solar · tambour, ATQ+ et jauge de tour
- `sorcha` · Sorcha Croc-de-Givre · Chasseuse au Loup Blanc · R · sylvaran · attacker · lunar · arc + loup blanc, gel
- `djeral` · Djeral Œil-de-Mirage · Archer des Mirages · R · akkar · assassin · void · flèches qui frappent deux fois
- `cassien` · Cassien Verre-Brisé · Médecin de Terrain · R · prism · healer · telluric · nanites soignantes, boucliers
- `vespera` · Vespera Fille-des-Cendres · Sorcière de Fumée · E · ash · controller · void · fumée qui étourdit, brûlure

## Vague B — v1.69.0 ✅ livrée
- `ivo` · Ivo Pique-Feu · Recrue de la Légion · C · ash · attacker · solar · jeune recrue à la lance, brûlure
- `pell` · Pell Carapace · Pêcheur d'Oasis · C · akkar · defender · telluric · bouclier en carapace de tortue
- `linnea` · Linnea Rosée · Cueilleuse de l'Aube · C · sylvaran · support · telluric · rosée qui accélère (VIT+)
- `gaspard` · Gaspard Pot-de-Colle · Alchimiste Malchanceux · C · valcrest · controller · telluric · glu (VIT−)
- `nim` · Nim Étincelle · Gamin des Conduits · C · prism · assassin · void · lame électrique, double frappe
- `maud` · Maud Cloche-Noire · Fossoyeuse-Prêtresse · U · valcrest · healer · lunar · soins + résurrection faible
- `arek` · Arek Tranche-Dune · Lame des Caravanes · U · akkar · attacker · telluric · cimeterre lourd, achèvement
- `selka` · Selka Nuage-Bas · Brumière d'Altitude · U · astral · controller · lunar · brume glacée (gel)
- `fennor` · Fennor Racine-Lente · Jeune Sylvain · U · sylvaran · defender · telluric · homme-arbre, régénération
- `isaure` · Isaure Lame-Vitrail · Duelliste du Temple · R · valcrest · assassin · solar · rapière de verre coloré
- `quill` · Quill Chante-Vide · Barde du Néant · R · astral · support · void · luth d'étoiles, ATQ+ et DÉF+
- `okoro` · Okoro Corne-Brûlée · Bélier de la Légion · R · ash · defender · solar · casque à cornes, provocation
- `lyssandre` · Lyssandre l'Inachevée · Prototype Éveillé · E · prism · attacker · void · androïde inachevé, frappes multiples

## Vague C — v1.70.0
- `mirka` · Mirka Fil-de-Lune · Novice du Concordat · C · astral · healer · lunar · novice aux mains lumineuses
- `dov` · Dov Poing-Sec · Lutteur des Arènes · C · akkar · attacker · telluric · lutteur, étourdissement
- `hesta` · Hesta Pelle-à-Feu · Cantinière du Front · C · ash · healer · solar · soupe chaude, soins
- `rook` · Rook Plume-Grise · Braconnier · C · sylvaran · assassin · void · pièges, poison
- `cyprien` · Cyprien Sceau-Clair · Héraut de la Couronne · U · valcrest · support · solar · proclamations, ATQ+
- `zephine` · Zéphine Brise-Vitre · Pilote d'Essai · U · prism · attacker · lunar · gantelets propulseurs
- `tarq` · Tarq Mâchoire-d'Os · Dompteur de Hyènes · U · akkar · defender · void · armure d'os, provocation
- `elwy` · Elwy Sève-Ardente · Gardienne des Ruches · U · sylvaran · healer · solar · abeilles dorées, régénération
- `anouk` · Anouk Tisse-Orage · Augure des Tempêtes · R · astral · controller · telluric · éclairs, étourdissement
- `brevine` · Brévine Croc-Rouge · Éclaireuse de la Légion · R · ash · assassin · telluric · dagues, saignée de jauge
- `malo` · Malo Ancre-Grise · Docker de la Citadelle · R · prism · defender · lunar · ancre mécanique, bouclier
- `sahar` · Sahar aux Mille Puits · Reine des Sables · E · akkar · support · solar · reine nomade, ATQ+ / VIT+

## Vague D — v1.71.0
- `jehan` · Jehan Porte-Bannière · Enseigne de Valcrest · C · valcrest · support · solar · étendard, DÉF+
- `pip` · Pip Tourne-Clé · Apprenti Horloger · C · prism · controller · telluric · ressorts, étourdissement
- `agnes` · Agnès Fourche · Fermière des Lisières · C · sylvaran · defender · telluric · fourche, provocation
- `oumar` · Oumar Vent-Sec · Rebouteux des Dunes · C · akkar · healer · telluric · soins et purification
- `vigo` · Vigo Cendre-Lente · Ensorceleur de Suie · U · ash · controller · void · suie aveuglante (ATQ−)
- `nadja` · Nadja Ciel-Bas · Lancière Céleste · U · astral · attacker · solar · lance d'étoile
- `berangere` · Bérangère Tour-de-Garde · Capitaine des Remparts · U · valcrest · defender · lunar · bouclier de muraille
- `kais` · Kaïs Sable-Mouvant · Voleur des Sables · U · akkar · assassin · telluric · disparaît dans le sable
- `theodric` · Théodric Marteau-Pâle · Briseur de Portes · R · valcrest · attacker · telluric · marteau de siège
- `esmee` · Esmée Racine-Noire · Druidesse des Ronces · R · sylvaran · controller · void · ronces, poison et VIT−
- `iolo` · Iolo Chant-des-Astres · Choriste du Concordat · R · astral · healer · solar · chant, soins de zone
- `grimald` · Grimald Cœur-de-Forge · Maître de la Grande Forge · E · ash · support · telluric · forge vivante, boucliers et ATQ+

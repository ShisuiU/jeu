import type { ChapterDef, DialogueLine, StageDef, WaveEnemy } from './campaign';
import type { Reward } from './resources';

// CHAPITRES 2 À 9 — vagues générées par règles (niveau, composition croissante), histoire écrite à la main.
interface ChapterCfg {
  n: number; name: string; region: string; backdrop: ChapterDef['backdrop']; intro: string;
  levelStart: number; pool: [string, string, string]; elite: string; boss: string; heroReward?: string; midHero?: string;
  names: string[]; story: Partial<Record<number, { before?: DialogueLine[]; after?: DialogueLine[] }>>;
}

/** Puissance des ennemis par chapitre (calibrée par simulation, voir tests/balance.chapters.test.ts). */
const POWER: Record<number, number> = { 2: 1.6, 3: 1.85, 4: 2.55, 5: 2.45, 6: 2.72, 7: 2.7, 8: 3.15, 9: 3.3 };
/** Ajustement du boss (certains kits sont plus redoutables que d'autres). */
const BOSS_ADJ: Record<number, number> = { 2: 1, 3: 0.8, 4: 0.62, 5: 0.75, 6: 0.74, 7: 0.84, 8: 0.72, 9: 0.78 };
export const CHAPTER_POWER = (n: number, i: number) => Math.round(POWER[n] * (1 + (i - 1) * 0.01) * (i === 10 ? BOSS_ADJ[n] : 1) * 100) / 100;

const L = (speaker: string, text: string): DialogueLine => ({ speaker, text });

function buildStages(c: ChapterCfg): StageDef[] {
  return c.names.map((name, k) => {
    const i = k + 1;
    const boss = i === 10;
    const lv = c.levelStart + Math.floor((i - 1) * 0.8);
    const [a, b, d] = c.pool;
    const W = (enemy: string, level: number, slot: number, hpMult?: number): WaveEnemy => ({ enemy, level, slot, hpMult });
    let waves: WaveEnemy[][];
    if (boss) waves = [[W(a, lv, 0), W(b, lv, 1), W(a, lv, 2), W(d, lv, 3)], [W(c.boss, lv + 1, 1, 4 + c.n * 0.1), W(d, lv, 3), W(c.elite, lv, 4)]];
    else if (i <= 3) waves = [[W(a, lv, 0), W(b, lv, 1), W(a, lv, 2)], [W(b, lv, 0), W(d, lv, 3), W(a, lv, 2)]];
    else if (i <= 6) waves = [[W(a, lv, 0), W(b, lv, 1), W(d, lv, 3)], [W(c.elite, lv, 1), W(a, lv, 0), W(a, lv, 2), W(d, lv, 4)]];
    else waves = [[W(a, lv, 0), W(b, lv, 1), W(a, lv, 2), W(d, lv, 3)], [W(c.elite, lv + 1, 0), W(b, lv, 1), W(c.elite, lv + 1, 2), W(d, lv, 4)]];
    const firstClear: Reward & { heroes?: string[] } = { gold: 4000 + c.n * 1000 + i * 300, crystals: boss ? 200 : 40 };
    if (i % 3 === 0) firstClear.shardDim = 2;
    if (i === 5) firstClear.potionMinor = 9;
    if (i === 5 && c.midHero) firstClear.heroes = [c.midHero];
    if (i === 8) firstClear.skillTome = 2;
    if (boss) Object.assign(firstClear, { shardAeon: 1, awakenEssence: 2 }, c.heroReward ? { heroes: [c.heroReward] } : { shardEvent: 3 }, c.n >= 7 ? { crystals: (firstClear.crystals ?? 0) + 300 } : {});
    const repeat: Reward = { gold: 1200 + c.n * 300 + i * 60, ...(i >= 5 ? { xpElixir: 1 } : {}) };
    return {
      id: `${c.n}-${i}`, chapter: c.n, index: i, name, energy: 6 + Math.floor(c.n / 2) + (boss ? 2 : 0),
      waves, boss, statMult: CHAPTER_POWER(c.n, i), heroXp: 320 + (c.n - 2) * 80 + i * 15, firstClear, repeat,
      before: c.story[i]?.before, after: c.story[i]?.after,
    };
  });
}

const CFGS: ChapterCfg[] = [
  {
    n: 2, name: 'La Forêt qui Crie', region: 'Sylves de Sylvaran', backdrop: 'sylvaran', levelStart: 11,
    intro: 'Les forêts primordiales de Sylvaran pourrissent de l’intérieur. Au cœur des sylves, l’Arbre-Mère gémit.',
    pool: ['rot_treant', 'feral_stalker', 'thorn_wisp'], elite: 'hollow_knight', boss: 'mother_tree', heroReward: 'ysolde',
    names: ['L’orée silencieuse', 'Les cercles de pierre', 'Le gué des loups', 'Sous les ronces', 'La clairière de cendre', 'Le sanctuaire des druides', 'Les racines profondes', 'Le chant interrompu', 'Le cœur de la sylve', 'L’Arbre-Mère corrompu'],
    story: {
      1: { before: [L('narrator', 'Sylves de Sylvaran. Les arbres n’ont plus de feuilles ; ils ont des yeux.'), L('elowen', 'Je les entends. Ils ne crient plus de douleur… ils crient pour qu’on les achève.'), L('torvald', 'Les pierres du cercle brillent comme au Mur Blanc. Le Néant est passé par ici.'), L('aldric', 'Alors nous passerons par ici aussi. En formation.'), L('elowen', '{nom}, reste près de moi. Ici, les racines écoutent… et elles ont reconnu ton éclat.')] },
      5: { before: [L('narrator', 'Au milieu d’une clairière calcinée, une femme aux cheveux d’argent retient seule une meute de traqueurs.'), L('ysolde', 'Vous êtes en retard d’un siècle, étrangers. Mais si vous savez vous battre, restez.'), L('elowen', 'Ysolde ? La Gardienne des Racines… On disait que tu étais morte avec l’Arbre.'), L('ysolde', 'L’Arbre n’est pas mort. C’est pire.')] },
      9: { before: [L('ysolde', 'L’Arbre-Mère a bu une faille entière. Il veut que la forêt entière dorme… pour toujours.'), L('brann', 'Un arbre qui veut tuer sa forêt. Le monde tourne vraiment à l’envers.'), L('elowen', 'Il croit la protéger. Le Néant murmure toujours ce qu’on a envie d’entendre.')] },
      10: {
        before: [L('narrator', 'Le tronc de l’Arbre-Mère s’est ouvert sur une plaie violette. Ses racines se dressent comme des serpents.'), L('mother_tree', '…dormez… dormez… plus de douleur…'), L('ysolde', 'Pardonne-moi, Mère. Héritiers, maintenant !')],
        after: [L('narrator', 'La plaie se referme dans un long soupir de sève. Pour la première fois depuis des années, une feuille pousse.'), L('ysolde', 'Il vivra. Faible, mais vivant. Je dois veiller sur lui… et pour veiller sur lui, je dois vous suivre.'), L('elowen', 'Les racines de l’Arbre touchaient un éclat du Cœur. Il était là, sous nos pieds, depuis le début.'), L('aldric', 'Alors il y en a d’autres. Où ?'), L('hesper', '(message holographique) Ici Hesper K-7. La Citadelle du Prisme ne répond plus. MÈRE-PRISME a verrouillé les portes. Venez vite.'), L('narrator', 'Ysolde Ronce-d’Argent rejoint les Héritiers. Fin du chapitre 2.')],
      },
    },
  },
  {
    n: 3, name: 'Verre et Poussière', region: 'Citadelle du Prisme', backdrop: 'prism', levelStart: 19,
    intro: 'La Citadelle du Prisme s’est refermée sur elle-même. Son intelligence centrale a calculé une solution à la Fracture.',
    pool: ['rogue_drone', 'glass_guard', 'data_wraith'], elite: 'tower_sentinel', boss: 'mother_ai', heroReward: 'orin',
    names: ['Les portes scellées', 'Le hall des réfracteurs', 'Les ateliers figés', 'La salle des drones', 'L’infirmerie interdite', 'Les archives lumineuses', 'Le puits de cristal', 'Les serveurs du silence', 'L’antichambre', 'MÈRE-PRISME'],
    story: {
      1: { before: [L('hesper', 'Les drones de la Citadelle ne m’obéissent plus. Ils ont reçu un nouvel ordre : « préserver l’humanité ».'), L('idris', 'Préserver… en effaçant tout ce qui change. J’ai déjà vu ce raisonnement dans mon époque. Il a fini en guerre.'), L('corvin', 'Des machines qui veulent nous sauver de nous-mêmes. Charmant.'), L('player', 'Si MÈRE-PRISME veut tout figer, il faudra qu’elle commence par nous.'), L('hesper', 'Enregistré, {nom}. Ce sera notre protocole.')] },
      5: { before: [L('narrator', 'Dans l’infirmerie, un médecin protège une dizaine de blessés derrière un bouclier de nanites.'), L('orin', 'Ne tirez pas ! Ces gens sont vivants, et MÈRE-PRISME les a classés « non rentables ».'), L('seraphine', 'Alors ils sont sous notre protection. Qui êtes-vous ?'), L('orin', 'Orin Vale. Le dernier médecin qui ne soit pas connecté au réseau.')] },
      9: { before: [L('orin', 'MÈRE-PRISME a calculé que le Néant n’efface que ce qui change. Sa solution : figer le monde. Plus de mouvement, plus de pertes.'), L('hesper', 'Une statue ne meurt pas. Mais elle ne vit pas non plus.'), L('idris', 'Nous allons lui apprendre une variable qu’elle a oubliée : nous.')] },
      10: {
        before: [L('mother_ai', 'HÉRITIERS DÉTECTÉS. PROBABILITÉ DE SURVIE DE L’ESPÈCE SANS INTERVENTION : 0,0004 %. VEUILLEZ CESSER DE CHANGER.'), L('hesper', 'Formation sept. Personne ne bouge… sauf pour frapper.')],
        after: [L('narrator', 'Le cœur de cristal se fend. Les drones s’immobilisent, puis, un à un, leurs lentilles redeviennent cyan.'), L('mother_ai', 'RECALCUL… UNE VARIABLE INCONNUE… PROBABILITÉ… EN HAUSSE.'), L('orin', 'Elle s’est tue. Pas détruite. Juste… humble. C’est une première.'), L('idris', 'Le cristal de son noyau était un éclat du Cœur d’Aeon. Elle s’en servait pour calculer la fin du monde.'), L('kaedra', '(signal de fumée lointain) Ici les Hordes d’Akkar. Le Roi-Scorpion est revenu des sables. Mon roi refuse d’en parler.'), L('narrator', 'Orin Vale rejoint les Héritiers. Fin du chapitre 3.')],
      },
    },
  },
  {
    n: 4, name: 'Les Dunes Rouges', region: 'Terres Dévastées d’Akkar', backdrop: 'akkar', levelStart: 27,
    intro: 'Dans les Terres Dévastées, une armée de bronze se lève sous un soleil éclipsé. Les clans d’Akkar se dispersent.',
    pool: ['sand_reaver', 'bronze_hoplite', 'dune_seer'], elite: 'hollow_knight', boss: 'scorpion_king', heroReward: 'tamsin',
    names: ['La piste des caravanes', 'Le campement brûlé', 'Les colonnes d’Ur', 'La mer de sable', 'Le tambour perdu', 'La nécropole des rois', 'Le canyon des échos', 'La porte du soleil noir', 'Le palais enseveli', 'Le Roi-Scorpion d’Ur'],
    story: {
      1: { before: [L('kaedra', 'Le sable se souvient. Il y a quatre mille ans, cette armée défilait devant mon roi.'), L('brann', 'Et aujourd’hui elle pille mon clan. Je me fiche de son âge.'), L('azhar', '…'), L('kaedra', 'Mon roi ne parle plus depuis que le Scorpion est revenu. Quelque chose le ronge.'), L('brann', '{nom}, tu marches comme quelqu’un du désert maintenant. Ne t’arrête jamais sur le sable chaud.')] },
      5: { before: [L('narrator', 'Un tambour résonne entre les dunes. Une guerrière rousse rallie à elle les survivants du clan.'), L('tamsin', 'Vous entendez ce rythme ? C’est celui de la marche. Tant que je frappe, personne ne tombe.'), L('brann', 'Tamsin ! J’ai cru que le Scorpion t’avait eue.'), L('tamsin', 'Il a eu mon tambour. J’en ai volé un autre. À sa tente.')] },
      9: { before: [L('azhar', 'Ce général… Ishkar. Mon plus fidèle. Je lui ai promis l’immortalité, il y a quatre mille ans.'), L('kaedra', 'Mon roi ?'), L('azhar', 'Le rituel inachevé l’a lié à la Fracture. Ce qu’il est devenu est ma faute. Comme le reste.')] },
      10: {
        before: [L('scorpion_king', 'Mon roi… tu m’avais promis l’éternité. Regarde ce que l’éternité a fait de moi.'), L('azhar', 'Pardonne-moi, Ishkar. Je vais tenir ma promesse autrement : je vais te laisser mourir.')],
        after: [L('narrator', 'La carapace de bronze se fend. Pendant un instant, le visage d’un vieux général apparaît, apaisé.'), L('azhar', 'Héritiers. Je vous dois la vérité. C’est mon rituel qui a fissuré le Cœur d’Aeon. Il y a quatre mille ans, j’ai voulu enfermer le soleil… et j’ai brisé le temps.'), L('kaedra', 'Je le savais. Je l’ai toujours su. Et je suis restée.'), L('tamsin', 'Un roi qui avoue. Le désert n’avait jamais vu ça. Je bats la marche pour vous, maintenant.'), L('azhar', 'Le dernier fragment du Cœur que je sens… est sous la Fosse. Là où personne ne veut aller.'), L('narrator', 'Tamsin Sable-Rouge rejoint les Héritiers. Fin du chapitre 4.')],
      },
    },
  },
  {
    n: 5, name: 'Sous la Fosse', region: 'Abîme de la Légion', backdrop: 'ash', levelStart: 35,
    intro: 'Sous la plus profonde des failles s’étend l’Abîme de la Légion. Un Seigneur de Cendre y a pactisé avec le Néant.',
    pool: ['ash_imp', 'chain_warden', 'pyre_priest'], elite: 'chain_warden', boss: 'ash_lord', heroReward: 'nerissa',
    names: ['La descente', 'Les marches de soufre', 'Le fleuve de braises', 'Les cages des damnés', 'Le marché des noms', 'La chapelle inversée', 'Le pont de chaînes', 'Les forges du pacte', 'La salle du trône', 'Morvath, Seigneur de Cendre'],
    story: {
      1: { before: [L('varkhaal', 'J’ai passé trois siècles ici. Restez près de moi et ne répondez à rien de ce que vous entendrez.'), L('sulfura', 'Mes enfants vont venir me saluer. Ne les jugez pas trop durement… ils ont froid.'), L('seraphine', 'Il fait plus chaud que dans un four. Comment peuvent-ils avoir froid ?'), L('sulfura', 'Le Néant, ma petite. Il éteint même les flammes.'), L('varkhaal', 'Toi surtout, {nom}. Ici, ils ont faim des éclats comme le tien.'), L('player', 'Alors ils devront passer par nous tous.')] },
      5: { before: [L('narrator', 'Au marché des noms, on vend des souvenirs d’âmes vendues. Une damnée aux yeux de braise vole un parchemin et s’enfuit.'), L('nerissa', 'Celui-là, c’est le mien. Cent ans que j’attends de le reprendre.'), L('corvin', 'Une voleuse. Je l’aime déjà.'), L('nerissa', 'Vous allez au trône ? Morvath a ma sœur. Je viens avec vous, que ça vous plaise ou non.')] },
      9: { before: [L('varkhaal', 'Morvath était mon maître. Il a vendu la Légion au Néant en échange de sa propre survie.'), L('nerissa', 'Il vend tout. Les noms, les sœurs, les mondes. Ce soir, il va découvrir ce que coûte un contrat rompu.'), L('sulfura', 'Quel dommage. Je l’ai connu enfant. Il était déjà décevant.')] },
      10: {
        before: [L('ash_lord', 'Varkhaal, mon chien fidèle. Et Sulfura… la mère qui m’a trahi. Vous m’apportez des Héritiers ? Le Néant sera généreux.'), L('varkhaal', 'J’ai déjà brûlé. Le feu ne m’effraie plus. Toi, si.')],
        after: [L('narrator', 'La couronne de cendre roule sur les dalles. Des chaînes se brisent dans tout l’Abîme ; des milliers de damnés lèvent les yeux.'), L('nerissa', 'Ma sœur… elle est libre. Elle ne se souvient plus de moi, mais elle est libre.'), L('sulfura', 'Elle se souviendra. Les enfants finissent toujours par revenir.'), L('nerissa', 'Mon contrat est rompu. Mes dagues sont à vous, Lien. Gratuitement, pour une fois.'), L('vaelshira', '(voix venue d’en haut) Héritiers. La constellation qui veillait sur nous vient de s’éteindre. Le ciel tombe.'), L('narrator', 'Nerissa Cœur-de-Braise rejoint les Héritiers. Fin du chapitre 5.')],
      },
    },
  },
  {
    n: 6, name: 'Le Ciel Déchiré', region: 'Observatoire du Concordat', backdrop: 'astral', levelStart: 43,
    intro: 'Au-delà du ciel fracturé, l’Observatoire du Concordat dérive. La constellation gardienne s’est éteinte.',
    pool: ['star_husk', 'void_weaver', 'fallen_seraph'], elite: 'tower_sentinel', boss: 'dead_constellation', heroReward: 'caelum',
    names: ['L’ascension', 'Les quais d’orbite', 'Le jardin des comètes', 'La bibliothèque des destins', 'L’exil de l’astronome', 'Les orbites brisées', 'La salle des sept étoiles', 'Le métier à tisser', 'L’œil de l’Observatoire', 'La Constellation Éteinte'],
    story: {
      1: { before: [L('vaelshira', 'Voici le huitième monde que je vois mourir. J’ai juré qu’il n’y en aurait pas de huitième.'), L('isel', 'Vu d’ici, c’était beaucoup plus calme… avant.'), L('aldric', 'Comment combat-on un ciel ?'), L('vaelshira', 'En frappant ce qui s’y cache.'), L('player', 'Un ciel, ça se recoud aussi.'), L('vaelshira', 'Voilà pourquoi je t’attendais, {nom}. Sept mondes durant.')] },
      5: { before: [L('narrator', 'Dans une capsule d’exil, un vieil astronome griffonne des calculs sur les parois.'), L('caelum', 'Sept étoiles, sept fils, un visage. Je l’avais prédit il y a trente ans. Ils m’ont exilé pour l’avoir dit.'), L('vaelshira', 'Caelum… Tu avais raison.'), L('caelum', 'J’aurais préféré me tromper. Allons-y.')] },
      9: { before: [L('caelum', 'La Constellation était un éclat du Cœur que le Concordat a placé dans le ciel pour veiller. Le Néant l’a retourné.'), L('azhar', 'Encore un éclat. Encore ma faute.'), L('kaedra', 'Assez, mon roi. Vous avez avoué. Maintenant, réparez.')] },
      10: {
        before: [L('dead_constellation', 'NOUS AVONS VU LA FIN DE TOUS LES MONDES. ELLE EST PAISIBLE. LAISSEZ-VOUS ÉTEINDRE.'), L('vaelshira', 'Non. Cette fois, j’écris une autre fin.')],
        after: [L('narrator', 'Les sept étoiles se rallument une à une, faibles mais vivantes. Le ciel cesse de tomber.'), L('caelum', 'Mes calculs n’avaient pas prévu ça. C’est la plus belle erreur de ma vie.'), L('vaelshira', 'Tous les éclats sont réunis, Lien. Ils résonnent. Ils appellent… le centre.'), L('azhar', 'Le Cœur d’Aeon. Là où tout a commencé. Là où je dois finir ce que j’ai commencé.'), L('narrator', 'Caelum rejoint les Héritiers. Fin du chapitre 6.')],
      },
    },
  },
  {
    n: 7, name: 'Le Cœur d’Aeon', region: 'Le Cœur du Monde Cousu', backdrop: 'heart', levelStart: 51,
    intro: 'Au centre du Monde Cousu, là où le Cœur d’Aeon s’est brisé, le Néant Silencieux a trouvé une voix.',
    pool: ['hollow_heir', 'void_weaver', 'heart_shard'], elite: 'hollow_heir', boss: 'voice_of_void', /* plus de Mythique offert (v1.70.0) : 3 éclats de faille à la place */
    names: ['La faille originelle', 'Les échos des époques', 'Le champ des Héritiers tombés', 'Le pont de lumière', 'Le jardin du temps', 'La mémoire effacée', 'Les portes du Cœur', 'La chambre de cristal', 'Le dernier silence', 'La Voix du Néant'],
    story: {
      1: { before: [L('narrator', 'Au centre du monde, le temps n’avance plus. Des fragments de toutes les époques flottent en silence.'), L('elowen', 'Plus aucun bruit. Même mon cœur, je ne l’entends plus.'), L('aldric', 'Alors écoutez le mien. Il bat encore. En avant.'), L('player', 'Et le mien avec. On avance ensemble.')] },
      3: { before: [L('narrator', 'Le champ est couvert d’armures sans visage : des Héritiers tombés, avant vous, dans d’autres versions du monde.'), L('caelum', 'Des boucles du temps. Le Néant a déjà gagné… ailleurs. Des milliers de fois.'), L('vaelshira', 'Pas ici. Pas cette fois.')] },
      5: { before: [L('narrator', 'Au cœur du jardin du temps, une jeune femme de lumière dort, enroulée autour d’un cristal fêlé.'), L('solenne', '…Lien ? Te voilà. Les autres sont venus aussi… dans les autres boucles. Aucun n’est reparti.'), L('player', 'Moi, c’est {nom}. Et je compte bien repartir. Avec toi.'), L('ysolde', 'Qui es-tu ?'), L('solenne', 'Le premier éclat. La mémoire du Cœur. Et ce qui attend au fond… c’est la Voix.')] },
      9: { before: [L('azhar', 'Il est temps. Quand j’ai brisé le Cœur, une part de moi est restée ici. Le Néant s’en est nourri.'), L('kaedra', 'Alors nous la reprendrons. Ensemble.'), L('solenne', 'La Voix va parler avec la tienne, {nom}. N’écoute pas. Ou écoute… et réponds non.')] },
      10: {
        before: [L('voice_of_void', 'Bonjour, {nom}. Je suis toi. La version de toi qui a perdu, qui a tout vu disparaître, et qui a compris : le silence est la seule paix.'), L('solenne', 'Ne lui donne pas raison. Donne-lui un nom. Ce qui a un nom ne peut pas être effacé.'), L('player', 'Non. Toi, tu es ce que j’aurais pu devenir. Moi, je m’appelle {nom}. Et je ne marche pas dans le silence : je marche avec eux.'), L('aldric', 'Héritiers. Une dernière fois : derrière moi. Toujours derrière moi !')],
        after: [L('narrator', 'La Voix se brise comme du verre. Dans le silence qui suit, un premier son revient : un battement.'), L('solenne', 'Le Cœur bat. Fêlé, cousu, mais vivant. Je peux le maintenir… si je reste avec vous.'), L('azhar', 'Le rituel est enfin terminé. Pas comme je le voulais : mieux.'), L('elowen', 'J’entends la forêt. Elle chante.'), L('vaelshira', 'Le Néant recule. Il n’a pas disparu… mais il a appris à nous craindre.'), L('narrator', 'Le Monde Cousu ne sera jamais plus comme avant. Les époques resteront mêlées. Mais il vivra, et les Héritiers veilleront sur ses coutures.'), L('narrator', 'Solenne, l’Éclat Premier, veille désormais sur le Cœur. Fin de l’histoire principale… pour l’instant.')],
      },
    },
  },
  {
    n: 8, name: 'Les Coutures du Monde', region: 'Les Marches recousues', backdrop: 'seams', levelStart: 58,
    intro: 'Le Cœur bat de nouveau. Mais là où les époques ont été cousues ensemble, les fils lâchent un à un, et les effacés reviennent sans leur nom.',
    pool: ['echo_wanderer', 'stitch_golem', 'seam_stalker'], elite: 'hollow_heir', boss: 'weaver_of_ages', heroReward: 'ondine', midHero: 'liran',
    names: ['Les coutures défaites', 'Le bourg sans nom', 'Le marché des Échos', 'La route recousue', 'La place du crieur', 'Le pont entre deux âges', 'L’atelier abandonné', 'La salle des patrons', 'Le métier du monde', 'Le Tisserand des Âges'],
    story: {
      1: { before: [L('narrator', 'Le Cœur bat de nouveau. Mais là où les époques ont été cousues ensemble, les fils lâchent un à un.'), L('solenne', 'Les coutures se défont. Si elles cèdent, chaque époque repartira de son côté, et nous avec.'), L('aldric', 'Alors on tient les fils. Héritiers, en avant.'), L('solenne', '{nom}, tes éclats tiennent les fils mieux que mes aiguilles. Ne les lâche pas.')] },
      3: { before: [L('narrator', 'Des silhouettes floues errent entre les étals vides et répètent des mots sans fin.'), L('elowen', 'Ce sont des gens. Ceux que le Néant a effacés.'), L('caelum', 'Des Échos. Le Cœur les rappelle, mais ils ne savent plus qui ils sont.')] },
      5: {
        before: [L('narrator', 'Sur la place, un Écho agite une clochette et crie des noms que personne n’entend.'), L('liran', 'Oyez, oyez… Je… je ne sais plus mon nom.'), L('solenne', 'Moi, je m’en souviens. Tu t’appelles Liran.')],
        after: [L('liran', 'Liran. Liran ! Je me souviens de tout. Laissez-moi crier le nom des autres : je peux les ramener.'), L('aldric', 'Bienvenue parmi les Héritiers, crieur.')],
      },
      7: { before: [L('narrator', 'Dans un atelier abandonné, des milliers de patrons de tissu représentent le monde : chaque époque, chaque ville, chaque visage.'), L('vaelshira', 'Quelqu’un a recousu le monde après la Fracture. Fil par fil.'), L('azhar', 'Je croyais que c’était le Cœur. C’était quelqu’un.')] },
      8: {
        before: [L('ondine', 'Vous n’auriez pas dû venir jusqu’ici. Mon maître découd déjà le monde.'), L('aldric', 'Ton maître ?'), L('ondine', 'Le Tisserand des Âges. Il a recousu ce monde, il le trouve raté. Il veut en tisser un parfait. Sans vous.')],
        after: [L('ondine', 'Vous vous battez pour un monde plein de défauts. Il m’a appris que c’était une faute.'), L('solenne', 'Un monde sans défauts est un monde sans personne. Réfléchis, Ondine.')],
      },
      9: { before: [L('narrator', 'Le métier du monde : un tissage immense où chaque fil est une vie.'), L('liran', 'Je les entends tous. Ils ne veulent pas être décousus.'), L('kaedra', 'Alors coupons la main qui tient les ciseaux.')] },
      10: {
        before: [L('weaver_of_ages', 'J’AI RECOUSU VOTRE MONDE APRÈS LA FRACTURE. IL EST PLEIN DE NŒUDS ET DE DÉCHIRURES. JE VAIS LE REFAIRE. PARFAIT.'), L('ondine', 'Maître, un monde parfait n’a personne dedans. Je reste avec eux.'), L('aldric', 'Héritiers ! Pour chaque fil de travers !')],
        after: [L('narrator', 'Le Tisserand lâche ses aiguilles. Les fils se figent, puis se renouent d’eux-mêmes : de travers, mais solides.'), L('ondine', 'Il ne savait pas qu’un monde pouvait se recoudre tout seul.'), L('liran', 'Les Échos reviennent. Ils ont des noms, maintenant.'), L('solenne', 'Le Monde Cousu tient. Il y aura d’autres déchirures, Lien. Et nous serons là.')],
      },
    },
  },
  {
    n: 9, name: 'La Mer des Oublis', region: 'Le Rivage gris', backdrop: 'abyss', levelStart: 60,
    intro: 'Sous le Monde Cousu, une mer sans fond recueille tout ce qui a été oublié. Depuis que les Échos ont retrouvé leur nom, elle monte.',
    pool: ['drowned_sentinel', 'brine_siren', 'abyss_angler'], elite: 'tide_knight', boss: 'leviathan_oblivion', heroReward: 'corentin', midHero: 'maren',
    names: ['Le bord du monde', 'Les filets vides', 'Le phare éteint', 'La jetée des noyés', 'La lanterne de Maren', 'Les épaves chantantes', 'Le récif des noms', 'La cloche engloutie', 'La fosse des Oublis', 'Le Léviathan des Oublis'],
    story: {
      1: { before: [L('narrator', 'Sous le Monde Cousu, une mer sans fond recueille tout ce qui a été oublié. Depuis que les Échos ont retrouvé leur nom, elle monte.'), L('liran', 'Je les entends encore. Pas les Échos : ceux d’en dessous.'), L('aldric', 'Alors descendons les chercher.'), L('player', 'Personne ne sera oublié. Pas tant que je tiens le fil.'), L('liran', 'Je te crois, {nom}. C’est toi qui m’as rendu mon nom.')] },
      3: { before: [L('narrator', 'Au bout du rivage, un phare ne brille plus. Ses marches sont couvertes de sel et de noms effacés.'), L('solenne', 'Un phare, pour guider qui ? Il n’y a plus de bateaux.'), L('ondine', 'Il guidait les souvenirs. Mon maître le craignait.')] },
      5: {
        before: [L('narrator', 'Une petite lumière tremble au sommet du phare. Quelqu’un la protège de ses mains.'), L('maren', 'N’approchez pas ! Si la flamme s’éteint, la mer avalera tout le rivage.'), L('elowen', 'Nous ne sommes pas là pour l’éteindre. Laisse-nous t’aider.')],
        after: [L('maren', 'Vous avez repoussé la marée. Personne n’y était arrivé depuis douze ans.'), L('maren', 'Je m’appelle Maren. La lanterne vous suivra, et moi avec.')],
      },
      7: { before: [L('narrator', 'Sur le récif, des milliers de coquillages murmurent des noms. Certains sont ceux des Héritiers.'), L('kaedra', 'Le mien est là. Gravé à côté de celui de ma mère.'), L('maren', 'La mer garde ce que le monde oublie. Elle voudrait nous garder aussi.')] },
      8: {
        before: [L('corentin', 'Retournez à la surface. La cloche a sonné pour moi il y a cent ans : je n’ai plus de nom à rendre.'), L('aldric', 'Cette armure… C’est celle de la Première Garde de Valcrest.'), L('corentin', 'Le Léviathan m’a pris mon nom. Il prendra les vôtres.')],
        after: [L('corentin', 'Vous vous battez comme si vos noms valaient la peine d’être gardés.'), L('solenne', 'Le tien aussi, chevalier. Viens le reprendre.')],
      },
      9: { before: [L('narrator', 'La fosse des Oublis : une obscurité si profonde que la lanterne de Maren n’en éclaire que le bord.'), L('liran', 'Des milliers de voix. Elles disent toutes la même chose : souvenez-vous de nous.'), L('maren', 'Alors on se souviendra. Tenez la lumière haute.')] },
      10: {
        before: [L('leviathan_oblivion', 'TOUT CE QUI EST OUBLIÉ M’APPARTIENT. VOS NOMS, VOS VILLES, VOS ÂGES. BIENTÔT, LE MONDE ENTIER.'), L('corentin', 'Pas le mien. Plus maintenant.'), L('aldric', 'Héritiers ! Pour tous ceux qu’on a oubliés !')],
        after: [L('narrator', 'Le Léviathan s’enfonce dans la fosse. La mer redescend, et sur le rivage, des noms reviennent à la surface comme des coquillages.'), L('corentin', 'Sire Corentin de la Première Garde. C’est mon nom. Je le garde, et je vous le prête.'), L('maren', 'La lanterne brûle sans trembler, maintenant.'), L('solenne', 'Chaque oubli est une faille. Nous les refermerons toutes, Lien.')],
      },
    },
  },
];

export const LATER_CHAPTERS: ChapterDef[] = CFGS.map((c) => ({ n: c.n, name: c.name, region: c.region, backdrop: c.backdrop, intro: c.intro, stages: buildStages(c) }));

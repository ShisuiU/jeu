// PASSIFS SIGNATURES (v1.91.0, audit E-1) — chaque Légendaire et chaque Mythique a une mécanique qui lui est propre
// et qui change sa façon de jouer, au-delà de ses statistiques. Azhar a déjà la sienne (Couronne d'Ur, dans ses compétences).
export type SignatureKind = 'bossHunter' | 'debuffFeast' | 'firstStrike' | 'lastStand' | 'dawnRevive' | 'silverThread' | 'drownedOath' | 'prismAegis' | 'seventhDawn' | 'zeroPoint';
export interface Signature { kind: SignatureKind; name: string; text: string }

export const SIGNATURES: Record<string, Signature> = {
  idris: { kind: 'bossHunter', name: 'Soleil implacable', text: '+25 % de dégâts contre les boss.' },
  sulfura: { kind: 'debuffFeast', name: 'Brasier nourri', text: '+20 % de dégâts contre une cible qui subit un effet négatif.' },
  vaelshira: { kind: 'firstStrike', name: 'Trame des étoiles', text: 'Au début du combat, toute l’équipe gagne 20 % de jauge de tour.' },
  nerissa: { kind: 'lastStand', name: 'Cœur de braise', text: 'Une fois par combat, survit à un coup mortel avec 1 PV et gagne +30 % d’ATQ pendant 2 tours.' },
  solenne: { kind: 'dawnRevive', name: 'Aube rendue', text: 'Une fois par combat, le premier allié qui tombe se relève avec 20 % de ses PV.' },
  ondine: { kind: 'silverThread', name: 'Fil d’argent', text: '+25 % de dégâts contre une cible sous 50 % de ses PV.' },
  corentin: { kind: 'drownedOath', name: 'Serment noyé', text: 'Tant qu’il est debout, les alliés subissent 6 % de dégâts en moins.' },
  thalor: { kind: 'prismAegis', name: 'Égide du Prisme', text: 'Au début du combat, chaque allié reçoit un bouclier de 15 % de ses PV.' },
  elyra: { kind: 'seventhDawn', name: 'Septième Aube', text: 'À chaque nouvelle vague, tous les alliés récupèrent 15 % de leurs PV.' },
  nyxa: { kind: 'zeroPoint', name: 'Point zéro', text: 'Chaque ennemi vaincu lui rend une jauge de tour pleine : elle rejoue aussitôt.' },
};

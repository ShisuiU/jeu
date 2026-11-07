import type { Reward } from './resources';

// COURRIER — messages avec récompense unique (mises à jour, événements, compensations).
// Chaque message n'est réclamable qu'une fois (drapeau dans la sauvegarde).
export interface MailDef { id: string; title: string; text: string; reward: Reward; from: string }

export const MAIL: MailDef[] = [
  {
    id: 'mail_v03', from: 'Le Concordat', title: 'L’appel des Héritiers',
    text: 'Le portail d’invocation est ouvert et la forge du Mur Blanc rallumée. Voici de quoi renforcer tes premiers héros.',
    reward: { rankSigil: 3, potionMinor: 10, xpElixir: 20, forgeOre: 60, skillTome: 3, shardAeon: 2 },
  },
];

export const mailFlag = (id: string) => `mail_${id}`;

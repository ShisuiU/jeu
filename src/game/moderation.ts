// MODÉRATION — filtre d'insultes pour les noms (joueur, clan), la présentation des clans et la discussion.
// Comparaison sans accents ni majuscules, avec les remplacements de lettres courants (4→a, 3→e, 0→o, 1→i, $→s…).
// Les mots courts ne sont refusés qu'entiers (« con » oui, « Conan » non) ; les longs aussi à l'intérieur d'un mot.
const SHORT = ['con', 'cons', 'pd', 'pede', 'pedes', 'negro', 'negros', 'heil', 'retard', 'retards', 'shit', 'fdp', 'ntm', 'tg', 'pute', 'putes', 'bite', 'cul', 'nazi', 'nazis', 'nique', 'niquer', 'dick', 'cunt', 'fag', 'slut', 'whore'];
const LONG = [
  'connard', 'connasse', 'salope', 'salaud', 'putain', 'encule', 'enculer', 'niquetamere', 'nique ta mere', 'fils de pute', 'filsdepute',
  'merde', 'couille', 'tapette', 'batard', 'enfoire', 'bougnoul', 'youpin', 'negre', 'chinetoque', 'bamboula',
  'hitler', 'fuck', 'bitch', 'nigger', 'nigga', 'faggot', 'asshole', 'pussy', 'motherfucker', 'pornhub', 'porno',
];
const LEET: Record<string, string> = { '4': 'a', '@': 'a', '3': 'e', '€': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[4@3€1!05$7]/g, (c) => LEET[c] ?? c);
const tokens = (s: string) => normalize(s).split(/[^a-z]+/).filter(Boolean);

/** Le texte contient-il une insulte ? */
export function hasProfanity(text: string): boolean {
  const t = tokens(text);
  if (t.some((w) => SHORT.includes(w))) return true;
  const joined = ` ${t.join(' ')} `;
  const glued = t.join('');
  return LONG.some((w) => joined.includes(` ${w}`) || glued.includes(w.replace(/ /g, '')));
}

/** Remplace les mots insultants par des étoiles (pour la discussion). */
export function maskProfanity(text: string): string {
  return text.replace(/[^\s.,;:!?'’"()-]+/g, (word) => (hasProfanity(word) ? '*'.repeat(Math.min(6, Math.max(3, word.length))) : word));
}

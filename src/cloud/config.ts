// Configuration publique du projet Firebase « aeonfall » (comptes et sauvegardes en ligne).
// Ces valeurs ne sont pas secrètes : elles identifient le projet. La sécurité repose sur les règles
// Firestore (chaque compte n'accède qu'à son propre document saves/{uid}).
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCG-r9IWAH3BF7_Nv3m1gb7Li4UbQ_Yh9c',
  // Sur le site du jeu, la connexion Google passe par sa propre adresse (vercel.json relaie /__/auth vers
  // Firebase) : Safari et l'iPhone ne bloquent plus le retour de la connexion. Ailleurs : l'adresse Firebase.
  authDomain: typeof location !== 'undefined' && location.hostname === 'jeu-aeonfall.vercel.app' ? 'jeu-aeonfall.vercel.app' : 'aeonfall-988bd.firebaseapp.com',
  projectId: 'aeonfall-988bd',
  storageBucket: 'aeonfall-988bd.firebasestorage.app',
  messagingSenderId: '465167201229',
  appId: '1:465167201229:web:a91eedb8d95197a07f8a84',
};

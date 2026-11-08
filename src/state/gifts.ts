import { create } from 'zustand';

// Cadeaux d'énergie des amis qui attendent d'être récupérés (vérifiés en ligne au lancement, au retour dans
// le jeu et toutes les 5 minutes) : pastille sur le Courrier et onglet « Cadeaux ».
export const useGifts = create<{ waiting: number; set: (n: number) => void }>((set) => ({ waiting: 0, set: (waiting) => set({ waiting }) }));

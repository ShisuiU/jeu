import { create } from 'zustand';
import { collectTraining, trainDue } from '../game/buildings';
import { stepBackground } from '../game/background';
import { produce } from 'immer';
import { observeTime } from '../core/time';
import { energyMax, regenEnergy } from '../game/energy';
import { claimDaily as claimDailyRule } from '../game/daily';
import { applyResets } from '../game/missions';
import { dayKey, weekKey } from '../core/time';
import type { DailyRewardDef } from '../data/dailyRewards';
import { createNewSave, type SaveData, type Settings } from '../save/schema';

interface GameState {
  save: SaveData | null;
  /** Heure de confiance courante (rafraîchie chaque seconde, hors sauvegarde). */
  now: number;
  clockRollback: boolean;
  setSave: (s: SaveData) => void;
  /** Applique une modification à la sauvegarde ; incrémente la révision (déclenche l'autosauvegarde). */
  mutate: (fn: (s: SaveData) => void) => void;
  tick: () => void;
  claimDaily: () => DailyRewardDef | null;
  setTeamSlot: (teamId: string, slot: number, heroUid: string | null) => void;
  setLeader: (teamId: string, heroUid: string | null) => void;
  renameTeam: (teamId: string, name: string) => void;
  setActiveTeam: (teamId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setProfile: (patch: Partial<SaveData['profile']>) => void;
  toggleHeroLock: (heroUid: string) => void;
  newGame: () => void;
}

const bump = (s: SaveData, now: number) => {
  s.revision += 1;
  s.updatedAt = Math.max(now, s.updatedAt);
};

export const useGame = create<GameState>((set, get) => ({
  save: null,
  now: Date.now(),
  clockRollback: false,

  setSave: (s) => set({ save: s }),

  mutate: (fn) => {
    const { save, now } = get();
    if (!save) return;
    set({ save: produce(save, (d) => { fn(d); bump(d, now); }) });
  },

  tick: () => {
    const { save } = get();
    if (!save) return;
    const obs = observeTime(save.time, Date.now());
    const energy = regenEnergy(save.energy, obs.trusted, energyMax(save.profile.level));
    const energyChanged = energy.current !== save.energy.current;
    const hwAdvanced = obs.time.highWater - save.time.highWater > 60_000;
    const rollbackChanged = obs.time.rollbackCount !== save.time.rollbackCount;
    const resetDue = save.resets.day !== dayKey(obs.trusted) || save.resets.week !== weekKey(obs.trusted);
    // Combats en arrière-plan : on joue ceux dont l'heure est venue.
    const bgDue = !!save.bgRun && !save.bgRun.endedReason && obs.trusted >= save.bgRun.nextAt;
    // Terrain d'entraînement : l'expérience arrive toute seule aux héros placés.
    const trainNow = trainDue(save, obs.trusted);
    if (energyChanged || hwAdvanced || rollbackChanged || resetDue || bgDue || trainNow) {
      set({
        now: obs.trusted,
        clockRollback: obs.rollback,
        save: produce(save, (d) => {
          d.time = obs.time;
          d.energy = energy;
          applyResets(d, obs.trusted);
          if (bgDue) stepBackground(d, obs.trusted);
          if (trainNow) collectTraining(d, obs.trusted);
          bump(d, obs.trusted);
        }),
      });
    } else {
      set({ now: obs.trusted, clockRollback: obs.rollback });
    }
  },

  claimDaily: () => {
    let result: DailyRewardDef | null = null;
    get().mutate((s) => { result = claimDailyRule(s, get().now); });
    return result;
  },

  setTeamSlot: (teamId, slot, heroUid) => get().mutate((s) => {
    const t = s.teams.find((x) => x.id === teamId);
    if (!t) return;
    if (heroUid) {
      // Un héros ne peut occuper qu'un emplacement par équipe : on échange les positions.
      const prev = t.slots.indexOf(heroUid);
      if (prev >= 0) t.slots[prev] = t.slots[slot];
    }
    const removed = t.slots[slot];
    t.slots[slot] = heroUid;
    if (removed && t.leader === removed && !t.slots.includes(removed)) t.leader = null;
    if (!t.leader) t.leader = t.slots.find(Boolean) ?? null;
  }),

  setLeader: (teamId, heroUid) => get().mutate((s) => {
    const t = s.teams.find((x) => x.id === teamId);
    if (t && (heroUid === null || t.slots.includes(heroUid))) t.leader = heroUid;
  }),

  renameTeam: (teamId, name) => get().mutate((s) => {
    const t = s.teams.find((x) => x.id === teamId);
    if (t) t.name = name.slice(0, 24) || t.name;
  }),

  setActiveTeam: (teamId) => get().mutate((s) => { if (s.teams.some((t) => t.id === teamId)) s.activeTeamId = teamId; }),

  updateSettings: (patch) => get().mutate((s) => { Object.assign(s.settings, patch); }),

  setProfile: (patch) => get().mutate((s) => {
    if (patch.name !== undefined) s.profile.name = patch.name.trim().slice(0, 18) || s.profile.name;
    if (patch.avatarHeroId && s.heroes.some((h) => h.heroId === patch.avatarHeroId)) s.profile.avatarHeroId = patch.avatarHeroId;
  }),

  toggleHeroLock: (heroUid) => get().mutate((s) => {
    const h = s.heroes.find((x) => x.uid === heroUid);
    if (h) h.locked = !h.locked;
  }),

  newGame: () => set({ save: createNewSave(Date.now()) }),
}));

// Outils de vérification (?qa dans l'adresse uniquement).
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('qa')) (window as unknown as { __game: typeof useGame }).__game = useGame;

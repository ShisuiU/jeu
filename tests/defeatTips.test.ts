import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { defeatTips } from '../src/game/tips';
import { CHAPTERS, progressKey } from '../src/data/campaign';
import { stageWaves } from '../src/game/campaign';

// Conseils après une défaite (v1.110.0) : chaque bouton mène là où la ressource manquante s'obtient vraiment.
describe('Conseils après une défaite', () => {
  const setup = () => {
    const s = createNewSave(Date.now());
    for (const c of CHAPTERS.slice(0, 1)) for (const st of c.stages) s.progress.campaign[progressKey('normal', st.id)] = { clears: 1, stars: 3 };
    for (const id of ['2-1', '2-2']) s.progress.campaign[progressKey('normal', id)] = { clears: 1, stars: 3 };
    return s;
  };
  const waves = stageWaves(CHAPTERS[1].stages[3], 'normal');
  it('sac vide : « Donjons » plutôt qu’« Équiper » (qui ne trouverait rien)', () => {
    const s = setup(); s.equipment = [];
    const tips = defeatTips(s, s.teams[0], waves);
    expect(tips.some((t) => t.label === 'Équiper')).toBe(false);
  });
  it('plus d’élixir : la Grotte d’Ambre plutôt que le Sanctuaire', () => {
    const s = setup(); s.resources.xpElixir = 0;
    const tips = defeatTips(s, s.teams[0], waves);
    const lvl = tips.find((t) => t.text.includes(' est niveau '));
    expect(lvl?.label).toBe('Grotte');
  });
});

import { DAILY_REWARDS } from '../src/data/dailyRewards';
import { normalizeReward } from '../src/data/resources';
describe('Calendrier de connexion (v1.111.0)', () => {
  it('affiche exactement ce qui est versé (plus de monnaie retirée convertie en douce)', () => {
    for (const d of DAILY_REWARDS) expect(normalizeReward(d.reward), `J${d.day}`).toEqual(d.reward);
  });
});

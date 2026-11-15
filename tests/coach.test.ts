import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { coachActive } from '../src/ui/components/Coach';

// Tutoriel (v1.109.0) : trois fils indépendants après le 1er combat ; une étape faite par le joueur lui-même compte.
const fresh = () => { const s = createNewSave(Date.now()); s.flags.guide_done = true; for (const id of ['home_campaign', 'campaign_stage', 'prep_fight', 'battle_skill']) s.flags[`coach_${id}`] = true; return s; };

describe('Tutoriel en fils indépendants', () => {
  it('les explications du combat ne dépendent plus de l’invocation', () => {
    const s = fresh();
    expect(coachActive(s, 'home_summon')).toBe(true);
    expect(coachActive(s, 'battle_target')).toBe(true); // avant : bloqué tant que l'invocation n'était pas montrée
    expect(coachActive(s, 'battle_auto')).toBe(false); // ordre gardé dans un même fil
    s.flags.coach_battle_target = true;
    expect(coachActive(s, 'battle_auto')).toBe(true);
    expect(coachActive(s, 'battle_lien')).toBe(false);
    s.flags.coach_battle_auto = true;
    expect(coachActive(s, 'battle_lien')).toBe(true);
  });
  it('un joueur qui a déjà invoqué ne reçoit plus « appelle des Héritiers »', () => {
    const s = fresh();
    s.stats.summons = 1;
    expect(coachActive(s, 'home_summon')).toBe(false);
    expect(coachActive(s, 'summon_call')).toBe(false);
    expect(coachActive(s, 'home_sanct')).toBe(true);
  });
  it('« Passer le tutoriel » coupe tout', () => {
    const s = fresh(); s.flags.coach_off = true;
    expect(coachActive(s, 'battle_target')).toBe(false);
    expect(coachActive(s, 'home_summon')).toBe(false);
  });
});

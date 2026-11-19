import { describe, expect, it } from 'vitest';
import { HEROES } from '../src/data/heroes';
import { skillKind } from '../src/ui/art/SkillGlyph';

// v1.115.0 : chaque compétence active reçoit une icône d'après sa fonction ; aucune ne tombe dans la catégorie « par défaut »
// si elle inflige des dégâts, soigne ou protège.
describe('icônes de compétences', () => {
  const actives = HEROES.flatMap((h) => h.skills.filter((k) => k.slot !== 'passive'));
  it('les frappes, soins et boucliers sont reconnus', () => {
    for (const sk of actives) {
      const k = skillKind(sk).kind;
      if (sk.effects.some((e) => e.kind === 'damage')) expect(['strike', 'multi', 'aoe', 'revive']).toContain(k);
      else if (sk.effects.some((e) => e.kind === 'heal')) expect(['heal', 'revive']).toContain(k);
    }
  });
  it('la catégorie « par défaut » reste rare', () => {
    const tempo = actives.filter((sk) => skillKind(sk).kind === 'tempo').length;
    expect(tempo / actives.length).toBeLessThan(0.1);
  });
});

import { useMemo } from 'react';
import { useGame } from '../../state/store';
import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';
import type { HeroInstance, SaveData } from '../../save/schema';
import { HeroArt } from '../art/HeroArt';
import type { ReactNode } from 'react';

/** Ordre d'affichage : équipe active d'abord, puis par puissance. */
export function useHeroOrder(): { order: string[]; teamUids: string[]; defaultUid: string | undefined } {
  const save = useGame((s) => s.save)!;
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const teamUids = team.slots.filter(Boolean) as string[];
  const order = useMemo(() => {
    const pw = new Map(save.heroes.map((h) => [h.uid, powerOf(heroTotalStats(save, h).total)]));
    return save.heroes.map((h) => h.uid).sort((a, b) => (teamUids.includes(b) ? 1 : 0) - (teamUids.includes(a) ? 1 : 0) || pw.get(b)! - pw.get(a)!);
  }, [save, teamUids.join()]);
  return { order, teamUids, defaultUid: team.leader ?? order[0] };
}

/** Bande horizontale de portraits pour choisir un héros (Sanctuaire, Forge). */
export function HeroStrip({ selected, onSelect, dot, lead }: {
  selected: string; onSelect: (uid: string) => void;
  dot?: (s: SaveData, h: HeroInstance) => boolean; lead?: ReactNode;
}) {
  const save = useGame((s) => s.save)!;
  const { order, teamUids } = useHeroOrder();
  return (
    <div className="sanct-strip" role="listbox" aria-label="Choisir un héros">
      {lead}
      {order.map((u) => {
        const x = save.heroes.find((y) => y.uid === u)!;
        return (
          <button key={u} role="option" aria-selected={u === selected} className={`ss-item ${u === selected ? 'on' : ''}`}
            style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[x.heroId].rarity].color }} onClick={() => onSelect(u)}
            aria-label={HERO_BY_ID[x.heroId].name}>
            <HeroArt heroId={x.heroId} kind="portrait" />
            <span className="ss-lv">{x.level}</span>
            {teamUids.includes(u) && <span className="ss-team" />}
            {dot?.(save, x) && <span className="badge-dot" style={{ top: -3, right: -3 }} />}
          </button>
        );
      })}
    </div>
  );
}

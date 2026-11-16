import { useMemo, useRef } from 'react';
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
  // Ordre figé pendant la visite (test « nouveau joueur ») : après une montée de niveau, les portraits ne changent plus de place
  // sous le doigt. Les héros arrivés pendant la visite s'ajoutent à la fin ; ceux qui disparaissent (absorbés) sont retirés.
  const first = useRef<string[] | null>(null);
  const order = useMemo(() => {
    const uids = new Set(save.heroes.map((h) => h.uid));
    if (first.current) {
      const kept = first.current.filter((u) => uids.has(u));
      const added = save.heroes.map((h) => h.uid).filter((u) => !first.current!.includes(u));
      return (first.current = [...kept, ...added]);
    }
    const pw = new Map(save.heroes.map((h) => [h.uid, powerOf(heroTotalStats(save, h).total)]));
    return (first.current = save.heroes.map((h) => h.uid).sort((a, b) => (teamUids.includes(b) ? 1 : 0) - (teamUids.includes(a) ? 1 : 0) || pw.get(b)! - pw.get(a)!));
  }, [save, teamUids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
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

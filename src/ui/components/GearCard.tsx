import { GEAR_RARITIES, SETS, SET_LIST, SLOT_BY_ID, STAT_NAMES, PCT_STATS, type GearSlot, type GearStat } from '../../data/equipment';
import type { GearItem } from '../../save/schema';
import { mainValue } from '../../game/gear';
import { Icon } from '../art/Icons';
import { GearStars, SetEmblem } from '../art/SetEmblem';
import { defaultStars } from '../../game/gear';
import { GearArt, gearArtUrl } from '../art/GearArt';

export const SLOT_ICON: Record<GearSlot, keyof typeof Icon> = {
  weapon: 'sword', helmet: 'helmet', armor: 'armor', gloves: 'gloves', boots: 'boots', accessory: 'ring', artifact: 'gem',
};

export const statText = (stat: GearStat, v: number) => `${STAT_NAMES[stat].replace(' %', '')} +${v}${PCT_STATS.includes(stat) || stat.endsWith('Pct') ? ' %' : ''}`;

export function GearCard({ g, onClick, owner, selected, hideMain }: { g: GearItem; onClick?: () => void; owner?: string; selected?: boolean; hideMain?: boolean }) {
  const r = GEAR_RARITIES[g.rarity];
  const I = Icon[SLOT_ICON[g.slot]] as (p: { size?: number }) => JSX.Element;
  return (
    <button className={`gear-card r-${g.rarity} ${selected ? 'sel' : ''} ${gearArtUrl(g.set, g.slot) ? 'has-art' : ''}`} style={{ ['--gc' as string]: r.color }} onClick={onClick} aria-label={`${SLOT_BY_ID[g.slot].name} ${r.name}, ${g.stars ?? defaultStars(g.rarity)} étoiles, +${g.level}, ensemble ${SETS[g.set].name}`}>
      {gearArtUrl(g.set, g.slot) ? <GearArt set={g.set} slot={g.slot} /> : <span className="gc-ic"><I size={26} /></span>}
      <span className="gc-lvl">+{g.level}</span>
      <span className="gc-set" title={SETS[g.set].name}><SetEmblem id={g.set} size={13} /></span>
      {g.locked && <span className="gc-lock"><Icon.lock size={10} /></span>}
      <GearStars n={g.stars ?? defaultStars(g.rarity)} />
      {!hideMain && <span className="gc-main">{statText(g.main, mainValue(g))}</span>}
      {owner && <span className="gc-owner">{owner}</span>}
    </button>
  );
}

export function GearSlotEmpty({ slot, onClick }: { slot: GearSlot; onClick?: () => void }) {
  const I = Icon[SLOT_ICON[slot]] as (p: { size?: number }) => JSX.Element;
  return (
    <button className="gear-card empty" onClick={onClick}>
      <span className="gc-ic"><I size={24} /></span>
      <span className="gc-main">{SLOT_BY_ID[slot].name}</span>
    </button>
  );
}

/** Liste d'objets rangée par ensemble : un bandeau par ensemble (emblème, nom, bonus, nombre d'objets),
 *  les ensembles les plus fournis en premier. L'ordre choisi s'applique à l'intérieur de chaque ensemble. */
export function GearBySet({ items, render }: { items: GearItem[]; render: (g: GearItem) => JSX.Element }) {
  const groups = SET_LIST.map((d) => ({ d, list: items.filter((g) => g.set === d.id) }))
    .filter((x) => x.list.length)
    .sort((a, b) => b.list.length - a.list.length || a.d.name.localeCompare(b.d.name));
  return (
    <div className="gear-sets">
      {groups.map(({ d, list }) => (
        <section key={d.id} className="gs-group" style={{ ['--sc' as string]: d.color }}>
          <header className="gs-head">
            <SetEmblem id={d.id} size={20} />
            <div className="grow">
              <b>{d.name}</b> <span className="faint">· {d.pieces} pièces</span>
              <div className="gs-bonus">{d.description}</div>
            </div>
            <span className="gs-count">{list.length}</span>
          </header>
          <div className="gear-grid">{list.map(render)}</div>
        </section>
      ))}
    </div>
  );
}

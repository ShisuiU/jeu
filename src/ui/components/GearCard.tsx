import { GEAR_RARITIES, SETS, SLOT_BY_ID, STAT_NAMES, PCT_STATS, type GearSlot, type GearStat } from '../../data/equipment';
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

export function GearCard({ g, onClick, owner, selected }: { g: GearItem; onClick?: () => void; owner?: string; selected?: boolean }) {
  const r = GEAR_RARITIES[g.rarity];
  const I = Icon[SLOT_ICON[g.slot]] as (p: { size?: number }) => JSX.Element;
  return (
    <button className={`gear-card r-${g.rarity} ${selected ? 'sel' : ''} ${gearArtUrl(g.set, g.slot) ? 'has-art' : ''}`} style={{ ['--gc' as string]: r.color }} onClick={onClick} aria-label={`${SLOT_BY_ID[g.slot].name} ${r.name}, ${g.stars ?? defaultStars(g.rarity)} étoiles, +${g.level}, ensemble ${SETS[g.set].name}`}>
      {gearArtUrl(g.set, g.slot) ? <GearArt set={g.set} slot={g.slot} /> : <span className="gc-ic"><I size={26} /></span>}
      <span className="gc-lvl">+{g.level}</span>
      <span className="gc-set" title={SETS[g.set].name}><SetEmblem id={g.set} size={13} /></span>
      {g.locked && <span className="gc-lock"><Icon.lock size={10} /></span>}
      <GearStars n={g.stars ?? defaultStars(g.rarity)} />
      <span className="gc-main">{statText(g.main, mainValue(g))}</span>
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

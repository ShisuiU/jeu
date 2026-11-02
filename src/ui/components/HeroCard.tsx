import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { HeroArt } from '../art/HeroArt';
import { FactionEmblem } from '../art/FactionEmblem';
import { AffinityIcon, RoleIcon } from '../art/Identity';
import { Stars } from './common';

export function HeroCard({ heroId, level, owned = true, selected, onClick, badge }: {
  heroId: string; level?: number; owned?: boolean; selected?: boolean; onClick?: () => void; badge?: string;
}) {
  const d = HERO_BY_ID[heroId];
  const r = RARITIES[d.rarity];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`hero-card ${d.rarity} ${owned ? '' : 'unowned'} ${selected ? 'selected' : ''}`} style={{ ['--rc' as string]: r.color }} onClick={onClick}>
      <div className="art"><HeroArt heroId={heroId} /></div>
      <div className="shade" />
      {level !== undefined && owned && <span className="lvl">Nv {level}</span>}
      {badge && <span className="lvl" style={{ left: 'auto', right: 5, top: 30 }}>{badge}</span>}
      <span className="hc-id"><AffinityIcon id={d.affinity} size={18} /><span className="hc-role"><RoleIcon id={d.role} size={12} /></span></span>
      <div className="meta">
        <div className="hc-line"><FactionEmblem id={d.faction} size={13} /><Stars rarity={d.rarity} /></div>
        <div className="name">{d.name}</div>
      </div>
    </Tag>
  );
}

import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { HeroArt } from '../art/HeroArt';
import { FactionEmblem } from '../art/FactionEmblem';
import { AffinityIcon, RoleIcon } from '../art/Identity';
import { Stars } from './common';
import { Icon } from '../art/Icons';

// Carte de héros (v1.73.2) : cadre peint selon la rareté ; niveau dans le médaillon de gauche, affinité dans celui de droite,
// rôle juste dessous ; étoiles au-dessus de la plaque du nom ; doublons / verrou dans un petit badge sur le côté.
export function HeroCard({ heroId, level, owned = true, selected, onClick, badge, locked }: {
  heroId: string; level?: number; owned?: boolean; selected?: boolean; onClick?: () => void; badge?: string; locked?: boolean;
}) {
  const d = HERO_BY_ID[heroId];
  const r = RARITIES[d.rarity];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`hero-card ${d.rarity} ${owned ? '' : 'unowned'} ${selected ? 'selected' : ''}`} style={{ ['--rc' as string]: r.color }} onClick={onClick}>
      <div className="art"><HeroArt heroId={heroId} /></div>
      <div className="shade" />
      <i className="hc-frame" aria-hidden />
      {level !== undefined && owned && <span className="lvl" aria-label={`Niveau ${level}`}>{level}</span>}
      {(badge || locked) && <span className="hc-badges">{badge && <span className="hc-badge">{badge}</span>}{locked && <span className="hc-badge lock" aria-label="Verrouillé"><Icon.lock size={10} /></span>}</span>}
      <span className="hc-id"><AffinityIcon id={d.affinity} size={18} /><span className="hc-role"><RoleIcon id={d.role} size={12} /></span></span>
      <div className="meta">
        <div className="hc-line"><FactionEmblem id={d.faction} size={13} /><Stars rarity={d.rarity} /></div>
        <div className={`name ${d.name.length > 13 ? 'long' : ''}`}><span className="n-full">{d.name}</span><span className="n-short">{d.name.split(/[ ,]/)[0]}</span></div>
      </div>
    </Tag>
  );
}

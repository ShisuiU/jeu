import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HEROES, HERO_BY_ID } from '../../data/heroes';
import { FACTION_LIST } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import { ROLE_LIST } from '../../data/roles';
import type { FactionId, RoleId } from '../../data/types';
import { computeStats, powerOf } from '../../game/stats';
import { Screen } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { FactionEmblem } from '../art/FactionEmblem';

type Sort = 'rarity' | 'level' | 'power' | 'name';

export function Collection() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const [faction, setFaction] = useState<FactionId | null>(null);
  const [role, setRole] = useState<RoleId | null>(null);
  const [sort, setSort] = useState<Sort>('rarity');
  const [showCodex, setShowCodex] = useState(false);

  const owned = useMemo(() => {
    const list = save.heroes
      .map((h) => ({ h, d: HERO_BY_ID[h.heroId], p: powerOf(computeStats(HERO_BY_ID[h.heroId], h)) }))
      .filter((x) => (!faction || x.d.faction === faction) && (!role || x.d.role === role));
    const by: Record<Sort, (a: typeof list[0], b: typeof list[0]) => number> = {
      rarity: (a, b) => RARITIES[b.d.rarity].order - RARITIES[a.d.rarity].order || b.h.level - a.h.level,
      level: (a, b) => b.h.level - a.h.level,
      power: (a, b) => b.p - a.p,
      name: (a, b) => a.d.name.localeCompare(b.d.name),
    };
    return list.sort(by[sort]);
  }, [save.heroes, faction, role, sort]);

  const ownedIds = new Set(save.heroes.map((h) => h.heroId));
  const missing = HEROES.filter((d) => !ownedIds.has(d.id) && (!faction || d.faction === faction) && (!role || d.role === role))
    .sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order);

  return (
    <Screen title={`Héros  ${ownedIds.size}/${HEROES.length}`}>
      <div className="chips" style={{ marginBottom: 8 }}>
        <button className={`chip ${!faction ? 'active' : ''}`} onClick={() => setFaction(null)}>Toutes</button>
        {FACTION_LIST.map((f) => (
          <button key={f.id} className={`chip ${faction === f.id ? 'active' : ''}`} onClick={() => setFaction(faction === f.id ? null : f.id)}>
            <FactionEmblem id={f.id} size={14} />{f.short}
          </button>
        ))}
      </div>
      <div className="chips" style={{ marginBottom: 8 }}>
        <button className={`chip ${!role ? 'active' : ''}`} onClick={() => setRole(null)}>Tous rôles</button>
        {ROLE_LIST.map((r) => <button key={r.id} className={`chip ${role === r.id ? 'active' : ''}`} onClick={() => setRole(role === r.id ? null : r.id)}>{r.name}</button>)}
      </div>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="seg" style={{ flex: 1 }}>
          {(['rarity', 'level', 'power', 'name'] as Sort[]).map((s) => (
            <button key={s} className={sort === s ? 'on' : ''} onClick={() => setSort(s)}>{{ rarity: 'Rareté', level: 'Niveau', power: 'Puissance', name: 'Nom' }[s]}</button>
          ))}
        </div>
      </div>

      {owned.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Aucun héros ne correspond à ces filtres.</p>}
      <div className="hero-grid">
        {owned.map(({ h }) => <HeroCard key={h.uid} heroId={h.heroId} level={h.level} badge={h.locked ? '🔒' : undefined} onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })} />)}
      </div>

      {missing.length > 0 && (
        <>
          <button className="btn secondary block" style={{ marginTop: 18 }} onClick={() => setShowCodex(!showCodex)}>
            {showCodex ? 'Masquer' : 'Afficher'} les héros à découvrir ({missing.length})
          </button>
          {showCodex && (
            <div className="hero-grid" style={{ marginTop: 12 }}>
              {missing.map((d) => <HeroCard key={d.id} heroId={d.id} owned={false} onClick={() => push({ name: 'hero', heroId: d.id })} />)}
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

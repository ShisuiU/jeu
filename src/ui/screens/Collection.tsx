import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HEROES } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { Screen } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { ListControls, usePersisted, type Filters } from '../components/ListControls';
import { HERO_GROUPS, HERO_SORTS, heroMatches, sortHeroes } from '../components/heroFilters';
import { BondsSheet } from '../components/Copies';
import { copiesOf } from '../../game/copies';

export function Collection() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const [prefs, setPrefs] = usePersisted<{ sort: string; filters: Filters }>('heroes', { sort: 'power', filters: {} });
  const [showCodex, setShowCodex] = useState(false);
  const [bonds, setBonds] = useState(false);
  const { sort, filters } = prefs;

  const owned = useMemo(() => sortHeroes(save, save.heroes, filters, sort), [save, filters, sort]);
  const ownedIds = new Set(save.heroes.map((h) => h.heroId));
  const missing = HEROES.filter((d) => !ownedIds.has(d.id) && heroMatches(filters, d))
    .sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order);

  return (
    <Screen title={`Héros  ${ownedIds.size}/${HEROES.length}`} right={<div className="row" style={{ gap: 6 }}><button className="btn secondary small" onClick={() => setBonds(true)}>Liens</button><button className="btn secondary small" onClick={() => push({ name: 'team' })}>Équipes</button></div>}>
      {bonds && <BondsSheet onClose={() => setBonds(false)} />}
      <ListControls sortOptions={HERO_SORTS} sort={sort} onSort={(s) => setPrefs({ ...prefs, sort: s })}
        groups={HERO_GROUPS} filters={filters} onFilters={(f) => setPrefs({ ...prefs, filters: f })}
        count={(f) => save.heroes.filter((h) => heroMatches(f, HEROES.find((d) => d.id === h.heroId)!)).length} />

      {owned.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Aucun héros ne correspond à ces filtres.</p>}
      <div className="hero-grid">
        {owned.map(({ h }) => <HeroCard key={h.uid} heroId={h.heroId} level={h.level} badge={copiesOf(save, h.heroId) ? `+${copiesOf(save, h.heroId)} doublon${copiesOf(save, h.heroId) > 1 ? 's' : ''}` : h.locked ? '🔒' : undefined} onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })} />)}
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

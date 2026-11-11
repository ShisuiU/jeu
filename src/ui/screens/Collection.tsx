import kSanct from '../../assets/kit/pl_sanct.webp';
import kForge from '../../assets/kit/pl_forge.webp';
import kTeams from '../../assets/kit/pl_teams.webp';
import kBonds from '../../assets/kit/pl_bonds.webp';
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HEROES } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { Screen } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { ListControls, usePersisted, type Filters } from '../components/ListControls';
import { HERO_GROUPS, HERO_SORTS, heroMatches, sortHeroes } from '../components/heroFilters';
import { BondsSheet } from '../components/Copies';
import { copiesOf, markCopiesSeen } from '../../game/copies';
import { canImprove } from '../../game/upgrade';
import { COLLECTION_PCT, claimCollection, collectionClaimable, collectionPct, collectionReward, nextCollectionStep, ownedCount } from '../../game/collection';
import { RewardInline } from '../components/RewardView';
import { play } from '../../audio/sfx';

export function Collection() {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const [prefs, setPrefs] = usePersisted<{ sort: string; filters: Filters }>('heroes', { sort: 'power', filters: {} });
  const [showCodex, setShowCodex] = useState(false);
  const [bonds, setBonds] = useState(false);
  const { sort, filters } = prefs;
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const improvable = team.slots.some((u) => { const h = save.heroes.find((x) => x.uid === u); return !!h && canImprove(save, h); });
  useEffect(() => { markCopiesSeen(save); }, [save]);

  const owned = useMemo(() => sortHeroes(save, save.heroes, filters, sort), [save, filters, sort]);
  const ownedIds = new Set(save.heroes.map((h) => h.heroId));
  const missing = HEROES.filter((d) => !ownedIds.has(d.id) && heroMatches(filters, d))
    .sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order);

  return (
    <Screen title={`Héros  ${ownedIds.size}/${HEROES.length}`}>
      {/* Tout ce qui fait progresser les héros, au même endroit. */}
      <div className="hero-places">
        <button className="hp-tile kit" onClick={() => push({ name: 'sanctuary' })}><img src={kSanct} alt="" /><span>Sanctuaire</span>{improvable && <span className="badge-dot" />}</button>
        <button className="hp-tile kit" onClick={() => push({ name: 'gear' })}><img src={kForge} alt="" /><span>Forge</span></button>
        <button className="hp-tile kit" onClick={() => push({ name: 'team' })}><img src={kTeams} alt="" /><span>Équipes</span></button>
        <button className="hp-tile kit" onClick={() => setBonds(true)}><img src={kBonds} alt="" /><span>Liens</span></button>
      </div>
      <CollectionBar />
      {bonds && <BondsSheet onClose={() => setBonds(false)} />}
      <ListControls sortOptions={HERO_SORTS} sort={sort} onSort={(s) => setPrefs({ ...prefs, sort: s })}
        groups={HERO_GROUPS} filters={filters} onFilters={(f) => setPrefs({ ...prefs, filters: f })}
        count={(f) => save.heroes.filter((h) => heroMatches(f, HEROES.find((d) => d.id === h.heroId)!)).length} />

      {owned.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Aucun héros ne correspond à ces filtres.</p>}
      <div className="hero-grid">
        {owned.map(({ h }) => <HeroCard key={h.uid} heroId={h.heroId} level={h.level} badge={copiesOf(save, h.heroId) ? `+${copiesOf(save, h.heroId)}` : undefined} locked={h.locked} onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })} />)}
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

/** Paliers de collection : progression, récompense du prochain palier, bonus permanent déjà gagné. */
function CollectionBar() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const owned = ownedCount(save);
  const ready = collectionClaimable(save);
  const next = nextCollectionStep(save);
  const bonus = collectionPct(save);
  const target = ready[0] ?? next;
  return (
    <div className="col-bar">
      <div className="row between">
        <b>Collection {owned}/{HEROES.length}</b>
        <span className="faint">{bonus ? `Bonus : +${bonus} % PV, ATQ, DÉF à tous` : 'Aucun palier encore'}</span>
      </div>
      {target ? (
        <>
          <div className="progress" style={{ margin: '6px 0' }}><div style={{ width: `${Math.min(100, (owned / target) * 100)}%` }} /></div>
          <div className="row between" style={{ gap: 8 }}>
            <span className="faint" style={{ fontSize: 12 }}>Palier {target} héros : +{COLLECTION_PCT} % à tous · <RewardInline reward={collectionReward(target)} /></span>
            {ready.length > 0 && <button className="btn small" onClick={() => { let got: number[] = []; mutate((d) => { got = claimCollection(d); }); if (got.length) { play('claim'); toast(`Palier${got.length > 1 ? 's' : ''} de collection : +${got.length * COLLECTION_PCT} % PV, ATQ et DÉF à tous tes héros !`, 'ok'); } }}>Récupérer</button>}
          </div>
        </>
      ) : <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>Collection complète : tous les paliers sont à toi.</div>}
    </div>
  );
}

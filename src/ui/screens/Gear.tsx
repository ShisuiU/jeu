import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { GEAR_RARITIES, SET_LIST, SLOTS, gearDismantleValue, type GearRarity } from '../../data/equipment';
import { ListControls, matches, usePersisted, type FilterGroup, type Filters, type Option } from '../components/ListControls';
import { HERO_BY_ID } from '../../data/heroes';
import { dismantleGear } from '../../game/gear';
import { heroGear } from '../../game/heroStats';
import { Modal, Screen, fmt } from '../components/common';
import { GearBySet, GearCard, GearSlotEmpty, SLOT_ICON } from '../components/GearCard';
import { GearDetail } from '../components/GearDetail';
import { HeroStrip, useHeroOrder } from '../components/HeroStrip';
import { Icon, ResourceIcon } from '../art/Icons';
import { mainValue } from '../../game/gear';
import type { GearItem } from '../../save/schema';
import { PlaceAmbient } from '../art/PlaceScene';
import { SetEmblem } from '../art/SetEmblem';
import { defaultStars } from '../../game/gear';

const BAG = 'bag';

const GEAR_SORTS: Option[] = [
  { id: 'rarity', label: 'Rareté' },
  { id: 'stars', label: 'Étoiles' },
  { id: 'level', label: 'Niveau de forge' },
  { id: 'slot', label: 'Emplacement' },
  { id: 'main', label: 'Statistique principale' },
];
const slotIcon = (id: string) => { const I = Icon[SLOT_ICON[id as keyof typeof SLOT_ICON]] as (p: { size?: number }) => JSX.Element; return <I size={14} />; };
const GEAR_GROUPS: FilterGroup[] = [
  { id: 'slot', label: 'Emplacement', options: SLOTS.map((s) => ({ id: s.id, label: s.name, icon: slotIcon(s.id) })) },
  { id: 'rarity', label: 'Rareté', options: (Object.keys(GEAR_RARITIES) as GearRarity[]).reverse().map((r) => ({ id: r, label: GEAR_RARITIES[r].name, color: GEAR_RARITIES[r].color })) },
  { id: 'stars', label: 'Étoiles', options: [6, 5, 4, 3, 2, 1].map((n) => ({ id: String(n), label: `${n} ★`, color: '#ffd36b' })) },
  { id: 'set', label: 'Ensemble', options: SET_LIST.map((s) => ({ id: s.id, label: s.name, color: s.color, icon: <SetEmblem id={s.id} size={14} /> })) },
];
const gearMatches = (f: Filters, g: GearItem) => matches(f, 'slot', g.slot) && matches(f, 'rarity', g.rarity) && matches(f, 'set', g.set) && matches(f, 'stars', String(g.stars ?? defaultStars(g.rarity)));
const SLOT_ORDER = Object.fromEntries(SLOTS.map((s, i) => [s.id, i]));
const GEAR_SORT_FN: Record<string, (a: GearItem, b: GearItem) => number> = {
  rarity: (a, b) => GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order || (b.stars ?? 0) - (a.stars ?? 0) || b.level - a.level,
  stars: (a, b) => (b.stars ?? 0) - (a.stars ?? 0) || GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order || b.level - a.level,
  level: (a, b) => b.level - a.level || GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order,
  slot: (a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot] || GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order,
  main: (a, b) => a.main.localeCompare(b.main) || mainValue(b) - mainValue(a),
};

// FORGE — on choisit un héros (ou le sac), puis on touche un objet pour le renforcer.
// Onglet Démanteler : uniquement les objets libres.
export function Gear({ gearUid }: { gearUid?: string }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const { defaultUid } = useHeroOrder();
  const focus = gearUid ? save.equipment.find((g) => g.uid === gearUid) : undefined;
  const [tab, setTab] = useState<'upgrade' | 'dismantle'>('upgrade');
  const [who, setWho] = useState<string>(focus ? focus.heroUid ?? BAG : defaultUid ?? BAG);
  const [prefs, setPrefs] = usePersisted<{ sort: string; filters: Filters }>('gear', { sort: 'rarity', filters: {} });
  const [open, setOpen] = useState<string | null>(gearUid ?? null);
  const [bulk, setBulk] = useState<GearRarity | null>(null);
  // Démantèlement groupé (v1.76.0) : dans l'onglet Démanteler, toucher un objet le coche ; une barre en bas démantèle la sélection.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirmPick, setConfirmPick] = useState(false);
  const togglePick = (uid: string) => setPicked((p) => { const n = new Set(p); if (n.has(uid)) n.delete(uid); else n.add(uid); return n; });

  const pool = save.equipment.filter((g) => !g.heroUid && (tab === 'upgrade' || !g.locked));
  const free = useMemo(() => pool.filter((g) => gearMatches(prefs.filters, g)).sort(GEAR_SORT_FN[prefs.sort] ?? GEAR_SORT_FN.rarity), [save.equipment, prefs, tab]);
  const items = who === BAG ? [] : heroGear(save, who);
  const bulkTargets = bulk ? save.equipment.filter((g) => g.rarity === bulk && !g.locked && !g.heroUid) : [];
  const pickedItems = tab === 'dismantle' ? save.equipment.filter((g) => picked.has(g.uid) && !g.locked && !g.heroUid) : [];
  const pickGain = pickedItems.reduce((a, g) => { const v = gearDismantleValue(g.rarity, g.level); return { gold: a.gold + v.gold, ore: a.ore + v.forgeOre }; }, { gold: 0, ore: 0 });
  const allPicked = free.length > 0 && free.every((g) => picked.has(g.uid));
  const showBag = tab === 'dismantle' || who === BAG;

  return (
    <Screen title="Forge" bg={<PlaceAmbient place="forge" />} right={
      <span className="forge-res">
        <span><ResourceIcon icon="ore" color="#c08a5a" size={16} />{fmt(save.resources.forgeOre)}</span>
        <span><ResourceIcon icon="coin" size={16} />{fmt(save.resources.gold)}</span>
      </span>
    }>
      <div className="seg" style={{ marginBottom: 10 }}>
        <button className={tab === 'upgrade' ? 'on' : ''} onClick={() => { setTab('upgrade'); setPicked(new Set()); }}>Renforcer</button>
        <button className={tab === 'dismantle' ? 'on' : ''} onClick={() => setTab('dismantle')}>Démanteler</button>
      </div>

      {tab === 'upgrade' && (
        <HeroStrip selected={who} onSelect={setWho} lead={
          <button className={`ss-item ss-bag ${who === BAG ? 'on' : ''}`} onClick={() => setWho(BAG)} aria-label="Sac">
            <span><Icon.bag size={22} /><small>Sac</small></span>
          </button>
        } />
      )}

      {!showBag && (
        <>
          <div className="forge-who">{HERO_BY_ID[save.heroes.find((h) => h.uid === who)!.heroId].name}</div>
          <div className="gear-slots">
            {SLOTS.map((s) => {
              const g = items.find((x) => x.slot === s.id);
              return g ? <GearCard key={s.id} g={g} onClick={() => setOpen(g.uid)} />
                : <GearSlotEmpty key={s.id} slot={s.id} onClick={() => toast('Emplacement vide : équipe un objet depuis la fiche du héros.')} />;
            })}
          </div>
          {items.length === 0 && (
            <p className="hint" style={{ marginTop: 10 }}>{save.equipment.length === 0
              ? 'Pas encore d’équipement : il se gagne dans les 4 donjons d’équipement (ouverts après le niveau 2-2), un objet garanti à chaque victoire, chaque donjon ayant ses propres ensembles. Équipe-le ensuite depuis la fiche du héros.'
              : 'Aucun objet équipé.'}</p>
          )}
        </>
      )}

      {showBag && (
        <>
          {tab === 'dismantle' && (
            <div className="bulk-row">
              <span className="faint">Tout démanteler :</span>
              {(['common', 'uncommon', 'rare'] as GearRarity[]).map((r) => (
                <button key={r} className="chip" style={{ color: GEAR_RARITIES[r].color }} onClick={() => setBulk(r)}>{GEAR_RARITIES[r].name}s</button>
              ))}
            </div>
          )}
          {tab === 'dismantle' && free.length > 0 && (
            <div className="pick-row">
              <span className="faint">Touche les objets à démanteler.</span>
              <button className="chip" onClick={() => setPicked(allPicked ? new Set() : new Set(free.map((g) => g.uid)))}>{allPicked ? 'Tout décocher' : `Tout cocher (${free.length})`}</button>
            </div>
          )}
          <ListControls sortOptions={GEAR_SORTS} sort={prefs.sort} onSort={(x) => setPrefs({ ...prefs, sort: x })}
            groups={GEAR_GROUPS} filters={prefs.filters} onFilters={(f) => setPrefs({ ...prefs, filters: f })}
            count={(f) => pool.filter((g) => gearMatches(f, g)).length} />
          {free.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>{save.equipment.length === 0 ? 'Aucun équipement pour l’instant : gagne des combats pour en obtenir.' : pool.length ? 'Aucun objet ne correspond à ces filtres.' : 'Aucun objet libre ici.'}</p>}
          <GearBySet items={free} render={(g) => tab === 'dismantle'
            ? <span key={g.uid} className={`pick-wrap ${picked.has(g.uid) ? 'on' : ''}`}><GearCard g={g} selected={picked.has(g.uid)} onClick={() => togglePick(g.uid)} />{picked.has(g.uid) && <span className="pick-check" aria-hidden>✓</span>}</span>
            : <GearCard key={g.uid} g={g} onClick={() => setOpen(g.uid)} />} />
          {tab === 'dismantle' && pickedItems.length > 0 && (
            <div className="pick-bar">
              <div className="grow">
                <b>{pickedItems.length} objet{pickedItems.length > 1 ? 's' : ''}</b>
                <div className="faint">+{fmt(pickGain.gold)} or · +{fmt(pickGain.ore)} minerai</div>
              </div>
              <button className="btn secondary small" onClick={() => setPicked(new Set())}>Annuler</button>
              <button className="btn danger small" onClick={() => setConfirmPick(true)}>Démanteler</button>
            </div>
          )}
        </>
      )}

      {open && <GearDetail gearUid={open} place="forge" onClose={() => setOpen(null)} />}
      {confirmPick && (
        <Modal onClose={() => setConfirmPick(false)}>
          <h2>Démanteler {pickedItems.length} objet{pickedItems.length > 1 ? 's' : ''} ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>Gain : {fmt(pickGain.gold)} or et {fmt(pickGain.ore)} minerai. C’est définitif.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setConfirmPick(false)}>Annuler</button>
            <button className="btn danger grow" onClick={() => { const n = pickedItems.length; mutate((s) => { for (const g of pickedItems) dismantleGear(s, g.uid); }); toast(`${n} objet(s) démantelé(s) : +${fmt(pickGain.gold)} or, +${fmt(pickGain.ore)} minerai.`, 'ok'); setPicked(new Set()); setConfirmPick(false); }}>Démanteler</button>
          </div>
        </Modal>
      )}
      {bulk && (
        <Modal onClose={() => setBulk(null)}>
          <h2>Démanteler {bulkTargets.length} objet(s) {GEAR_RARITIES[bulk].name.toLowerCase()}(s) ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            Gain : {fmt(bulkTargets.reduce((a, g) => a + gearDismantleValue(g.rarity, g.level).gold, 0))} or et {fmt(bulkTargets.reduce((a, g) => a + gearDismantleValue(g.rarity, g.level).forgeOre, 0))} minerai. Les objets équipés ou verrouillés sont protégés.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setBulk(null)}>Annuler</button>
            <button className="btn danger grow" disabled={!bulkTargets.length} onClick={() => { mutate((s) => { for (const g of bulkTargets) dismantleGear(s, g.uid); }); toast(`${bulkTargets.length} objet(s) démantelé(s).`, 'ok'); setBulk(null); }}>Démanteler</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

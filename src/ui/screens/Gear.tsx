import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { GEAR_RARITIES, SET_LIST, SLOTS, gearDismantleValue, type GearRarity } from '../../data/equipment';
import { ListControls, matches, usePersisted, type FilterGroup, type Filters, type Option } from '../components/ListControls';
import { HERO_BY_ID } from '../../data/heroes';
import { dismantleGear } from '../../game/gear';
import { heroGear } from '../../game/heroStats';
import { Modal, Screen, fmt } from '../components/common';
import { GearCard, GearSlotEmpty, SLOT_ICON } from '../components/GearCard';
import { GearDetail } from '../components/GearDetail';
import { HeroStrip, useHeroOrder } from '../components/HeroStrip';
import { Icon, ResourceIcon } from '../art/Icons';
import { mainValue } from '../../game/gear';
import type { GearItem } from '../../save/schema';
import { PlaceAmbient } from '../art/PlaceScene';

const BAG = 'bag';

const GEAR_SORTS: Option[] = [
  { id: 'rarity', label: 'Rareté' },
  { id: 'level', label: 'Niveau de forge' },
  { id: 'slot', label: 'Emplacement' },
  { id: 'main', label: 'Statistique principale' },
];
const slotIcon = (id: string) => { const I = Icon[SLOT_ICON[id as keyof typeof SLOT_ICON]] as (p: { size?: number }) => JSX.Element; return <I size={14} />; };
const GEAR_GROUPS: FilterGroup[] = [
  { id: 'slot', label: 'Emplacement', options: SLOTS.map((s) => ({ id: s.id, label: s.name, icon: slotIcon(s.id) })) },
  { id: 'rarity', label: 'Rareté', options: (Object.keys(GEAR_RARITIES) as GearRarity[]).reverse().map((r) => ({ id: r, label: GEAR_RARITIES[r].name, color: GEAR_RARITIES[r].color })) },
  { id: 'set', label: 'Ensemble', options: SET_LIST.map((s) => ({ id: s.id, label: s.name, color: s.color })) },
];
const gearMatches = (f: Filters, g: GearItem) => matches(f, 'slot', g.slot) && matches(f, 'rarity', g.rarity) && matches(f, 'set', g.set);
const SLOT_ORDER = Object.fromEntries(SLOTS.map((s, i) => [s.id, i]));
const GEAR_SORT_FN: Record<string, (a: GearItem, b: GearItem) => number> = {
  rarity: (a, b) => GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order || b.level - a.level,
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

  const pool = save.equipment.filter((g) => !g.heroUid && (tab === 'upgrade' || !g.locked));
  const free = useMemo(() => pool.filter((g) => gearMatches(prefs.filters, g)).sort(GEAR_SORT_FN[prefs.sort] ?? GEAR_SORT_FN.rarity), [save.equipment, prefs, tab]);
  const items = who === BAG ? [] : heroGear(save, who);
  const bulkTargets = bulk ? save.equipment.filter((g) => g.rarity === bulk && !g.locked && !g.heroUid) : [];
  const showBag = tab === 'dismantle' || who === BAG;

  return (
    <Screen title="Forge" bg={<PlaceAmbient place="forge" />} right={
      <span className="forge-res">
        <span><ResourceIcon icon="ore" color="#c08a5a" size={16} />{fmt(save.resources.forgeOre)}</span>
        <span><ResourceIcon icon="coin" size={16} />{fmt(save.resources.gold)}</span>
      </span>
    }>
      <div className="seg" style={{ marginBottom: 10 }}>
        <button className={tab === 'upgrade' ? 'on' : ''} onClick={() => setTab('upgrade')}>Renforcer</button>
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
                : <GearSlotEmpty key={s.id} slot={s.id} onClick={() => toast('Emplacement vide : équipez un objet depuis la fiche du héros.')} />;
            })}
          </div>
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
          <ListControls sortOptions={GEAR_SORTS} sort={prefs.sort} onSort={(x) => setPrefs({ ...prefs, sort: x })}
            groups={GEAR_GROUPS} filters={prefs.filters} onFilters={(f) => setPrefs({ ...prefs, filters: f })}
            count={(f) => pool.filter((g) => gearMatches(f, g)).length} />
          {free.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>{save.equipment.length === 0 ? 'Aucun équipement pour l’instant : gagnez des combats pour en obtenir.' : pool.length ? 'Aucun objet ne correspond à ces filtres.' : 'Aucun objet libre ici.'}</p>}
          <div className="gear-grid">
            {free.map((g) => <GearCard key={g.uid} g={g} onClick={() => setOpen(g.uid)} />)}
          </div>
        </>
      )}

      {open && <GearDetail gearUid={open} place="forge" onClose={() => setOpen(null)} />}
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

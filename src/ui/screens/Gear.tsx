import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { GEAR_INVENTORY_CAP, GEAR_RARITIES, SLOTS, gearDismantleValue, type GearRarity, type GearSlot } from '../../data/equipment';
import { HERO_BY_ID } from '../../data/heroes';
import { dismantleGear } from '../../game/gear';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { GearCard, SLOT_ICON } from '../components/GearCard';
import { GearDetail } from '../components/GearDetail';
import { Icon, ResourceIcon } from '../art/Icons';

export function Gear() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [slot, setSlot] = useState<GearSlot | null>(null);
  const [rarity, setRarity] = useState<GearRarity | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [bulk, setBulk] = useState<GearRarity | null>(null);

  const list = useMemo(() => save.equipment
    .filter((g) => (!slot || g.slot === slot) && (!rarity || g.rarity === rarity))
    .sort((a, b) => GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order || b.level - a.level), [save.equipment, slot, rarity]);
  const owners = Object.fromEntries(save.heroes.map((h) => [h.uid, HERO_BY_ID[h.heroId].name.split(' ')[0]]));
  const bulkTargets = bulk ? save.equipment.filter((g) => g.rarity === bulk && !g.locked && !g.heroUid) : [];

  return (
    <Screen title={`Équipement  ${save.equipment.length}/${GEAR_INVENTORY_CAP}`}>
      <Panel>
        <div className="row between">
          <span className="row" style={{ gap: 6 }}><ResourceIcon icon="ore" color="#c08a5a" size={20} /> <b>{fmt(save.resources.forgeOre)}</b> <span className="faint">minerai</span></span>
          <span className="row" style={{ gap: 6 }}><ResourceIcon icon="coin" size={20} /> <b>{fmt(save.resources.gold)}</b></span>
        </div>
        <p className="faint" style={{ marginBottom: 0 }}>L’équipement s’obtient en campagne (et bientôt dans les donjons). Touchez un objet pour le forger, le verrouiller ou le démanteler ; équipez-le depuis la fiche d’un héros.</p>
      </Panel>
      <div className="chips" style={{ margin: '12px 0 8px' }}>
        <button className={`chip ${!slot ? 'active' : ''}`} onClick={() => setSlot(null)}>Tous</button>
        {SLOTS.map((s) => { const I = Icon[SLOT_ICON[s.id]] as (p: { size?: number }) => JSX.Element; return <button key={s.id} className={`chip ${slot === s.id ? 'active' : ''}`} onClick={() => setSlot(slot === s.id ? null : s.id)}><I size={14} />{s.name}</button>; })}
      </div>
      <div className="chips" style={{ marginBottom: 12 }}>
        {(Object.keys(GEAR_RARITIES) as GearRarity[]).map((r) => <button key={r} className={`chip ${rarity === r ? 'active' : ''}`} style={{ color: GEAR_RARITIES[r].color }} onClick={() => setRarity(rarity === r ? null : r)}>{GEAR_RARITIES[r].name}</button>)}
      </div>
      {list.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Aucun équipement. Gagnez des combats de campagne pour en obtenir.</p>}
      <div className="gear-grid">
        {list.map((g) => <GearCard key={g.uid} g={g} owner={g.heroUid ? owners[g.heroUid] : undefined} onClick={() => setOpen(g.uid)} />)}
      </div>
      {save.equipment.length > 0 && (
        <Panel title="Démantèlement groupé">
          <div className="row wrap" style={{ gap: 6 }}>
            {(['common', 'uncommon', 'rare'] as GearRarity[]).map((r) => <button key={r} className="btn secondary small" onClick={() => setBulk(r)}>{GEAR_RARITIES[r].name}s</button>)}
          </div>
          <p className="faint">Seuls les objets non équipés et non verrouillés sont concernés.</p>
        </Panel>
      )}
      {open && <GearDetail gearUid={open} onClose={() => setOpen(null)} />}
      {bulk && (
        <Modal onClose={() => setBulk(null)}>
          <h2>Démanteler {bulkTargets.length} objet(s) {GEAR_RARITIES[bulk].name.toLowerCase()}(s) ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            Gain : {fmt(bulkTargets.reduce((a, g) => a + gearDismantleValue(g.rarity, g.level).gold, 0))} or et {fmt(bulkTargets.reduce((a, g) => a + gearDismantleValue(g.rarity, g.level).forgeOre, 0))} minerai.
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

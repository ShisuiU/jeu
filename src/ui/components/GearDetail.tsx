import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { GEAR_MAX_LEVEL, GEAR_RARITIES, SETS, SLOT_BY_ID, gearDismantleValue, gearUpgradeCost } from '../../data/equipment';
import { HERO_BY_ID } from '../../data/heroes';
import { dismantleGear, mainValue, upgradeGear, unequipGear, equipGear } from '../../game/gear';
import { play } from '../../audio/sfx';
import { Modal } from './common';
import { CostView } from './Cost';
import { GearCard, statText } from './GearCard';

/** Fiche d'un équipement. À la Forge : renforcer, verrouiller, démanteler. Depuis un héros : équiper/retirer, et lien vers la Forge. */
export function GearDetail({ gearUid, onClose, equipTo, place = 'hero', onReplace }: { gearUid: string; onClose: () => void; equipTo?: string; place?: 'forge' | 'hero'; onReplace?: () => void }) {
  const push = useUI((s) => s.push);
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const g = save.equipment.find((x) => x.uid === gearUid);
  if (!g) return null;
  const r = GEAR_RARITIES[g.rarity];
  const owner = g.heroUid ? save.heroes.find((h) => h.uid === g.heroUid) : undefined;
  const up = gearUpgradeCost(g.rarity, g.level);
  const dis = gearDismantleValue(g.rarity, g.level);
  const set = SETS[g.set];

  const doUpgrade = () => {
    let res: ReturnType<typeof upgradeGear> = { ok: false };
    mutate((s) => { res = upgradeGear(s, g.uid, Math.random); });
    if (!res.ok) { toast(res.reason ?? 'Impossible.', 'error'); return; }
    play(res.boosted ? 'rare' : 'claim');
    if (res.boosted) toast(`Niveau ${g.level + 1} : statistique secondaire renforcée !`, 'ok');
  };

  return (
    <Modal onClose={onClose}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        <div style={{ width: 76 }}><GearCard g={g} /></div>
        <div className="grow">
          <div style={{ color: r.color, fontWeight: 800 }}>{SLOT_BY_ID[g.slot].name} {r.name}</div>
          <div className="faint">Niveau {g.level} / {GEAR_MAX_LEVEL}</div>
          <div style={{ color: set.color, fontSize: 13, fontWeight: 700 }}>Ensemble {set.name} ({set.pieces} pièces : {set.description})</div>
        </div>
      </div>
      <div className="stat-row"><span className="muted">Principale</span><b>{statText(g.main, mainValue(g))}</b></div>
      {g.subs.map((s, i) => <div key={i} className="stat-row"><span className="muted">Secondaire{s.rolls > 1 ? ` (+${s.rolls - 1})` : ''}</span><b>{statText(s.stat, s.value)}</b></div>)}
      <p className="faint">{owner ? `Équipé sur ${HERO_BY_ID[owner.heroId].name}` : 'Non équipé'}</p>

      {place === 'forge' && g.level < GEAR_MAX_LEVEL && (
        <div className="upg-row">
          <div className="grow"><b>Améliorer</b> → +{g.level + 1}<div><CostView cost={up} save={save} /></div></div>
          <button className="btn small" onClick={doUpgrade}>Forger</button>
        </div>
      )}
      {place === 'hero' && g.level < GEAR_MAX_LEVEL && (
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => { onClose(); push({ name: 'gear', gearUid: g.uid }); }}>Renforcer à la Forge</button>
      )}
      <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
        {equipTo && g.heroUid !== equipTo && (
          <button className="btn grow" onClick={() => { mutate((s) => { equipGear(s, g.uid, equipTo); }); play('claim'); onClose(); }}>Équiper</button>
        )}
        {onReplace && <button className="btn secondary grow" onClick={() => { onClose(); onReplace(); }}>Changer</button>}
        {owner && <button className="btn secondary grow" onClick={() => { mutate((s) => unequipGear(s, g.uid)); onClose(); }}>Retirer</button>}
        <button className="btn secondary grow" onClick={() => mutate((s) => { const x = s.equipment.find((y) => y.uid === g.uid); if (x) x.locked = !x.locked; })}>{g.locked ? 'Déverrouiller' : 'Verrouiller'}</button>
        {place === 'forge' && !owner && !g.locked && (
          <button className="btn danger grow" onClick={() => { mutate((s) => { dismantleGear(s, g.uid); }); toast(`Démantelé : +${dis.gold} or, +${dis.forgeOre} minerai.`, 'ok'); onClose(); }}>Démanteler</button>
        )}
      </div>
    </Modal>
  );
}

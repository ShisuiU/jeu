import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { GEAR_MAX_LEVEL, GEAR_MAX_STARS, GEAR_RARITIES, SETS, SLOT_BY_ID, gearDismantleValue, gearUpgradeCost } from '../../data/equipment';
import { GearStars, SetEmblem } from '../art/SetEmblem';
import { HERO_BY_ID } from '../../data/heroes';
import { defaultStars, dismantleGear, mainValue, upgradeGear, unequipGear, equipGear } from '../../game/gear';
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

  // Ensemble porté par le héros (pièces de cet ensemble sur lui) et prochain palier d'amélioration.
  const worn = owner ? save.equipment.filter((x) => x.heroUid === owner.uid && x.set === g.set).length : 0;
  const nextMilestone = [4, 8, 12, 16].find((m) => m > g.level);
  const stars = g.stars ?? defaultStars(g.rarity);

  return (
    <Modal onClose={onClose}>
      <div className={`gd-head r-${g.rarity}`} style={{ ['--gc' as string]: r.color }}>
        <div className="gd-card"><GearCard g={g} /></div>
        <div className="grow">
          <div className="gd-rarity">{r.name}</div>
          <div className="gd-name">{SLOT_BY_ID[g.slot].name}</div>
          <div className="gd-stars"><GearStars n={stars} size={13} /><span className="faint"> {stars}/{GEAR_MAX_STARS}</span></div>
          <div className="gd-level">
            <span>+{g.level}<small>/{GEAR_MAX_LEVEL}</small></span>
            <div className="gd-bar"><i style={{ width: `${(g.level / GEAR_MAX_LEVEL) * 100}%` }} />{[4, 8, 12].map((m) => <b key={m} className={g.level >= m ? 'on' : ''} style={{ left: `${(m / GEAR_MAX_LEVEL) * 100}%` }} />)}</div>
          </div>
        </div>
      </div>

      <div className="gd-set" style={{ ['--sc' as string]: set.color }}>
        <SetEmblem id={g.set} size={22} />
        <div className="grow">
          <b>{set.name}</b> <span className="faint">· {set.pieces} pièces</span>
          <div className="gd-set-bonus">{set.description}</div>
        </div>
        {owner && <span className={`gd-set-count ${worn >= set.pieces ? 'on' : ''}`}>{worn}/{set.pieces}</span>}
      </div>

      <div className="gd-main"><span className="muted">Principale</span><b>{statText(g.main, mainValue(g))}</b></div>
      {g.subs.map((sb, i) => (
        <div key={i} className="gd-sub">
          <span>{statText(sb.stat, sb.value)}</span>
          <span className="gd-rolls" aria-label={`${sb.rolls - 1} renforcement(s)`}>{Array.from({ length: sb.rolls - 1 }, (_, k) => <i key={k} />)}</span>
        </div>
      ))}
      {g.subs.length < 4 && <div className="gd-sub empty">{4 - g.subs.length} secondaire{g.subs.length < 3 ? 's' : ''} à débloquer en améliorant</div>}
      {nextMilestone && <p className="faint" style={{ margin: '8px 0 0' }}>Au +{nextMilestone} : {g.subs.length < 4 ? 'nouvelle statistique secondaire' : 'une secondaire renforcée'}.</p>}
      <p className="faint" style={{ margin: '4px 0 0' }}>{owner ? `Équipé sur ${HERO_BY_ID[owner.heroId].name}` : 'Non équipé'}</p>

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

import { Coach } from './Coach';
import { useState, type ReactNode } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { GEAR_RARITIES, SETS, SLOTS, type GearSlot } from '../../data/equipment';
import type { HeroInstance } from '../../save/schema';
import { heroGear } from '../../game/heroStats';
import { gearBonus } from '../../game/gear';
import { autoEquip } from '../../game/comfort';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';
import { Modal } from './common';
import { GearCard, SLOT_ICON } from './GearCard';
import { GearArt, gearArtUrl } from '../art/GearArt';
import { GearDetail } from './GearDetail';
import { GearStars, SetEmblem } from '../art/SetEmblem';
import { defaultStars } from '../../game/gear';

// VITRINE DU HÉROS — l'illustration au centre, les 7 emplacements d'équipement autour
// (arme, casque, armure à gauche ; gants, bottes, accessoire à droite ; artefact en bas).
const LEFT: GearSlot[] = ['weapon', 'helmet', 'armor'];
const RIGHT: GearSlot[] = ['gloves', 'boots', 'accessory'];
const BOTTOM: GearSlot[] = ['artifact'];

export function HeroShowcase({ heroId, h, onPrev, onNext, below }: { heroId: string; h?: HeroInstance; onPrev?: () => void; onNext?: () => void; below?: ReactNode }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [pick, setPick] = useState<GearSlot | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [setsOpen, setSetsOpen] = useState(false);
  const def = HERO_BY_ID[heroId];
  const items = h ? heroGear(save, h.uid) : [];
  const bonus = gearBonus(items);
  const owners = Object.fromEntries(save.heroes.map((x) => [x.uid, HERO_BY_ID[x.heroId].name.split(/[ ,]/)[0]]));
  const candidates = pick && h ? save.equipment.filter((g) => g.slot === pick && g.heroUid !== h.uid)
    .sort((a, b) => (a.heroUid ? 1 : 0) - (b.heroUid ? 1 : 0) || GEAR_RARITIES[b.rarity].order - GEAR_RARITIES[a.rarity].order || b.level - a.level) : [];

  const slot = (s: GearSlot) => {
    const g = items.find((x) => x.slot === s);
    const I = Icon[SLOT_ICON[s]] as (p: { size?: number }) => JSX.Element;
    const name = SLOTS.find((x) => x.id === s)!.name;
    if (!g) return (
      <button key={s} className="sc-slot empty" aria-label={`${name} : vide`} onClick={() => setPick(s)}>
        <I size={20} /><span className="sc-plus">+</span>
      </button>
    );
    const r = GEAR_RARITIES[g.rarity];
    return (
      <button key={s} className={`sc-slot ${gearArtUrl(g.set, g.slot) ? 'has-art' : ''}`} style={{ ['--gc' as string]: r.color }} aria-label={`${name} ${r.name} +${g.level}`} onClick={() => setOpen(g.uid)}>
        {gearArtUrl(g.set, g.slot) ? <GearArt set={g.set} slot={g.slot} className="sc-art" /> : <I size={22} />}
        <span className="sc-lv">+{g.level}</span>
        <span className="sc-set"><SetEmblem id={g.set} size={13} /></span>
        <span className="sc-stars"><GearStars n={g.stars ?? defaultStars(g.rarity)} size={8} /></span>
      </button>
    );
  };

  return (
    <>
      <div className="showcase">
        <div className="sc-art"><div className="sc-breathe"><HeroArt heroId={heroId} kind="full" position="center 12%" /></div></div>
        <div className={`sc-motes ${def.affinity}`} aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
        <div className="sc-shade" />
        {onPrev && <button className="sc-nav prev" aria-label="Héros précédent" onClick={onPrev}>‹</button>}
        {onNext && <button className="sc-nav next" aria-label="Héros suivant" onClick={onNext}>›</button>}
        {h && (
          <>
            <div className="sc-col left">{LEFT.map(slot)}</div>
            <div className="sc-col right">{RIGHT.map(slot)}</div>
            <div className="sc-bottom">{BOTTOM.map(slot)}</div>
          </>
        )}
      </div>

      {below}
      {h && <Coach id="hero_gear" target=".sc-slot.empty" when={save.equipment.some((g) => !g.heroUid)} text="Touche un emplacement pour équiper un objet." />}
      {h && (
        <div className="sc-tools">
          {/* Bulles d'ensemble (comme dans les jeux du genre) : actives en lumière, en cours estompées. Toucher = détail. */}
          <div className="set-bubbles">
            {bonus.sets.length === 0 && <span className="faint">{items.length}/7 objets</span>}
            {[...bonus.sets].sort((x, y) => y.active - x.active || y.count - x.count).map((st) => {
              const d = SETS[st.id];
              return (
                <button key={st.id} className={`set-bubble ${st.active ? 'on' : ''}`} style={{ ['--sc' as string]: d.color }} onClick={() => setSetsOpen(true)}
                  aria-label={`${d.name} : ${st.active ? 'actif' : `${st.count % d.pieces} sur ${d.pieces}`}`}>
                  <SetEmblem id={st.id} size={18} />
                  {st.active > 1 && <span className="sb-n">×{st.active}</span>}
                  {!st.active && <span className="sb-n off">{st.count % d.pieces}/{d.pieces}</span>}
                </button>
              );
            })}
          </div>
          <button className="hs-upgrade" onClick={() => { let n = 0; mutate((s) => { n = autoEquip(s, h.uid); }); toast(n ? `${n} objet(s) équipé(s).` : 'Rien de mieux dans le sac.', n ? 'ok' : 'info'); }}>
            <Icon.gear size={13} /> Auto
          </button>
        </div>
      )}
      {setsOpen && h && (
        <Modal onClose={() => setSetsOpen(false)}>
          <h2>Ensembles</h2>
          <div className="set-sum">
            {[...bonus.sets].sort((x, y) => y.active - x.active || y.count - x.count).map((st) => {
              const d = SETS[st.id];
              return (
                <div key={st.id} className={`set-row ${st.active ? 'on' : ''}`} style={{ ['--sc' as string]: d.color }}>
                  <SetEmblem id={st.id} size={20} />
                  <div className="grow">
                    <div><b>{d.name}</b>{st.active > 1 && <span className="set-x"> ×{st.active}</span>}</div>
                    <div className="set-bonus">{d.pieces} pièces : {d.description}</div>
                  </div>
                  <span className="set-state">{st.active ? 'Actif' : `${st.count % d.pieces}/${d.pieces}`}</span>
                </div>
              );
            })}
          </div>
          <button className="btn secondary block" style={{ marginTop: 12 }} onClick={() => setSetsOpen(false)}>Fermer</button>
        </Modal>
      )}

      {pick && h && (
        <Modal onClose={() => setPick(null)}>
          <h2>{SLOTS.find((s) => s.id === pick)!.name}</h2>
          {candidates.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Aucun objet de ce type pour l’instant.</p>}
          <div className="gear-grid">
            {candidates.map((g) => <GearCard key={g.uid} g={g} owner={g.heroUid ? owners[g.heroUid] : undefined} onClick={() => { setOpen(g.uid); setPick(null); }} />)}
          </div>
          <button className="btn secondary block" style={{ marginTop: 12 }} onClick={() => setPick(null)}>Fermer</button>
        </Modal>
      )}
      {open && h && <GearDetail gearUid={open} equipTo={h.uid} onClose={() => setOpen(null)}
        onReplace={(() => { const g = save.equipment.find((x) => x.uid === open); return g && g.heroUid === h.uid ? () => setPick(g.slot) : undefined; })()} />}
    </>
  );
}

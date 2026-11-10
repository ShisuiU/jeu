import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { AFFINITIES } from '../../data/affinities';
import { BALANCE } from '../../data/balance';
import type { AffinityId, FactionId } from '../../data/types';
import type { HeroInstance } from '../../save/schema';
import { BOND_MAX, BOND_PCT, bondLevel, bondMembers, copiesOf, giveCopy, giveCopyCheck, type BondKind } from '../../game/copies';
import { awaken, awakenCheck } from '../../game/upgrade';
import { play } from '../../audio/sfx';
import { Modal } from './common';
import { CostView } from './Cost';
import { Sheet } from './ListControls';
import { AffinityIcon } from '../art/Identity';
import { FactionEmblem } from '../art/FactionEmblem';
import { Icon } from '../art/Icons';
import { inTutorial } from './Coach';

// DOUBLONS — encart de la fiche héros et fenêtre « Utiliser un doublon » (3 choix clairs).

export function CopiesCard({ h }: { h: HeroInstance }) {
  const save = useGame((s) => s.save)!;
  const [open, setOpen] = useState(false);
  const n = copiesOf(save, h.heroId);
  // Sans doublon, l'encart est masqué ; la fenêtre reste ouverte même après avoir utilisé le dernier.
  return (
    <>
      {n > 0 && <button className={`copies-card ${n ? 'has' : ''}`} onClick={() => setOpen(true)}>
        <span className="cc-ic"><Icon.portal size={18} /></span>
        <span className="grow"><b>Doublons</b> <span className="cc-n">×{n}</span></span>
        <span className="cc-act">{n ? 'Utiliser' : 'À quoi ça sert ?'}</span>
        {n > 0 && <span className="badge-dot" style={{ top: 8, right: 8 }} />}
      </button>}
      {open && <CopiesModal h={h} onClose={() => setOpen(false)} />}
    </>
  );
}

function CopiesModal({ h, onClose }: { h: HeroInstance; onClose: () => void }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const d = HERO_BY_ID[h.heroId];
  const n = copiesOf(save, h.heroId);
  const aw = awakenCheck(save, h);
  const awMax = h.awaken >= BALANCE.hero.maxAwaken;
  const first = d.name.split(/[ ,]/)[0];
  const done = (msg: string) => { play('rare'); toast(msg, 'ok'); };

  const bond = (kind: BondKind) => {
    const key = kind === 'faction' ? d.faction : d.affinity;
    const lv = bondLevel(save, kind, key);
    const name = kind === 'faction' ? FACTIONS[key as FactionId].short : AFFINITIES[key as AffinityId].name;
    const chk = giveCopyCheck(save, h.heroId, kind);
    return (
      <div className="copy-choice">
        <span className="cp-ic">{kind === 'faction' ? <FactionEmblem id={key as FactionId} size={26} /> : <AffinityIcon id={key as AffinityId} size={26} />}</span>
        <div className="grow">
          <b>{kind === 'faction' ? `Famille ${name}` : `Affinité ${name}`}</b> <span className="cp-lv">{lv}/{BOND_MAX}</span>
          <div className="cp-sub">+{BOND_PCT} % PV, ATQ et DÉF à tous les héros {kind === 'faction' ? name : `d’affinité ${name}`}</div>
        </div>
        <button className="btn small" disabled={!chk.ok} onClick={() => { let ok = false; mutate((s) => { ok = giveCopy(s, h.heroId, kind); }); if (ok) done(`Lien ${name} : niveau ${lv + 1} !`); }}>{lv >= BOND_MAX ? 'Max' : 'Offrir'}</button>
      </div>
    );
  };

  return (
    <Modal onClose={onClose}>
      <h2>Doublons de {first} <span className="cc-n">×{n}</span></h2>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{n ? 'Chaque doublon sert une seule fois. Choisis :' : `Invoque ${first} à nouveau pour obtenir un doublon. Il servira à l’une de ces trois choses :`}</p>
      <div className="copy-choice">
        <span className="cp-ic"><Icon.essence size={24} /></span>
        <div className="grow">
          <b>Éveiller {first}</b> <span className="cp-lv">{h.awaken}/{BALANCE.hero.maxAwaken}</span>
          <div className="cp-sub">+{Math.round(BALANCE.hero.awakenBonus * 100)} % à toutes ses stats</div>
          {!awMax && <div className="cp-cost"><CostView cost={aw.cost} save={save} heroId={h.heroId} /></div>}
          {!awMax && !aw.ok && aw.reason && !/doublon|insuffisant/i.test(aw.reason) && <div className="cp-sub warn">{aw.reason}</div>}
        </div>
        <button className="btn small" disabled={!aw.ok} onClick={() => { let ok = false; mutate((s) => { ok = awaken(s, h.uid).ok; }); if (ok) done(`${first} : éveil ${h.awaken + 1} !`); }}>{awMax ? 'Max' : 'Éveiller'}</button>
      </div>
      {bond('faction')}
      {bond('affinity')}
      <button className="btn secondary block" style={{ marginTop: 12 }} onClick={onClose}>Fermer</button>
    </Modal>
  );
}

/** Vue d'ensemble des liens (écran Héros). */
export function BondsSheet({ onClose }: { onClose: () => void }) {
  const save = useGame((s) => s.save)!;
  const row = (kind: BondKind, key: string, name: string, icon: React.ReactNode) => {
    const lv = bondLevel(save, kind, key);
    const members = bondMembers(kind, key);
    return (
      <div key={key} className="bond-row">
        <span className="cp-ic">{icon}</span>
        <div className="grow">
          <div className="row between"><b>{name}</b><span className="cp-lv">{lv}/{BOND_MAX}</span></div>
          <div className="bond-bar"><i style={{ width: `${(lv / BOND_MAX) * 100}%` }} /></div>
          <div className="cp-sub">{lv ? `+${lv * BOND_PCT} % PV, ATQ et DÉF` : 'Aucun bonus'} · {members.length} héros</div>
        </div>
      </div>
    );
  };
  return (
    <Sheet title="Liens" onClose={onClose}>
      <p className="faint" style={{ marginTop: 0 }}>Offre des doublons depuis la fiche d’un héros pour renforcer sa famille ou son affinité.</p>
      <div className="sheet-gtitle">Familles</div>
      {(Object.keys(FACTIONS) as FactionId[]).map((f) => row('faction', f, FACTIONS[f].short, <FactionEmblem id={f} size={22} />))}
      <div className="sheet-gtitle" style={{ marginTop: 14 }}>Affinités</div>
      {(Object.keys(AFFINITIES) as AffinityId[]).map((a) => row('affinity', a, AFFINITIES[a].name, <AffinityIcon id={a} size={22} />))}
    </Sheet>
  );
}

/** PRÉSENTATION DES LIENS — au premier doublon obtenu, une fenêtre explique ce qui rend Aeonfall différent :
 *  un doublon peut renforcer toute une famille ou toute une affinité, pas seulement le héros lui-même. */
export function BondsIntro() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const copies = Object.values(save.heroCopies ?? {}).reduce((a, n) => a + Math.max(0, n), 0);
  const anyBond = Object.values(save.bonds?.faction ?? {}).some((v) => v > 0) || Object.values(save.bonds?.affinity ?? {}).some((v) => v > 0);
  const due = copies > 0 && !anyBond && !save.flags.bonds_intro && !inTutorial(save);
  useEffect(() => {
    if (!due || open || sheet) return;
    // Jamais par-dessus une autre fenêtre, le tutoriel ou l'animation d'invocation.
    const id = setInterval(() => { if (!document.querySelector('.modal-backdrop, .sheet-backdrop, .coach, .rift-reveal')) { setOpen(true); play('rare'); clearInterval(id); } }, 700);
    return () => clearInterval(id);
  }, [due, open, sheet]);
  const close = (go: boolean) => { mutate((s) => { s.flags.bonds_intro = true; }); setOpen(false); if (go) setSheet(true); };
  return (
    <>
      {open && (
        <Modal onClose={() => close(false)}>
          <div className="unl-tag">Les Liens</div>
          <h2>Ton premier doublon !</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
            Dans le Monde Cousu, les Héritiers sont liés. Un héros en double peut renforcer <b>toute sa famille</b> (Valcrest, Prisme…) ou <b>toute son affinité</b> (Solaire, Lunaire…) :
            +{BOND_PCT} % de PV, ATQ et DÉF pour chacun d’eux, jusqu’à +{BOND_MAX * BOND_PCT} %.
            {' '}Il peut aussi éveiller ce héros, ou être absorbé au Sanctuaire pour donner beaucoup d’expérience à un autre héros.
          </p>
          <div className="bonds-intro-aff">
            {(['solar', 'telluric', 'lunar'] as AffinityId[]).map((a, i) => (
              <span key={a}><AffinityIcon id={a} size={22} />{i < 2 && <b>›</b>}</span>
            ))}
            <AffinityIcon id="solar" size={22} />
          </div>
          <p className="faint" style={{ textAlign: 'center', marginTop: 0 }}>Et en combat : Solaire bat Tellurique, qui bat Lunaire, qui bat Solaire. Le Néant n’a ni avantage ni faiblesse.</p>
          <button className="btn block" onClick={() => close(true)}>Voir les Liens</button>
          <button className="btn secondary block" style={{ marginTop: 8 }} onClick={() => close(false)}>Plus tard</button>
        </Modal>
      )}
      {sheet && <BondsSheet onClose={() => setSheet(false)} />}
    </>
  );
}

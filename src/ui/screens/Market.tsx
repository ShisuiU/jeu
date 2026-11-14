import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RESOURCES } from '../../data/resources';
import { GEAR_MAX_STARS, GEAR_RARITIES, SETS, SLOT_BY_ID } from '../../data/equipment';
import { formatDuration, msUntilReset } from '../../core/time';
import { buyOffer, ensureMarket, refreshCost, refreshMarket, type MarketOffer } from '../../game/market';
import { mainValue } from '../../game/gear';
import { play } from '../../audio/sfx';
import { Modal, Screen, fmt } from '../components/common';
import { Wallet } from '../components/Wallet';
import { GearCard, statText } from '../components/GearCard';
import { GearStars, SetEmblem } from '../art/SetEmblem';
import { Icon, ResourceIcon } from '../art/Icons';

// MARCHÉ — 6 offres par jour, un achat chacune. On peut renouveler les offres 3 fois par jour (cristaux).
const PriceTag = ({ o, enough }: { o: MarketOffer; enough: boolean }) => (
  <span className={`mk-price ${enough ? '' : 'lack'}`}>
    {o.price.resource === 'gold' ? <Icon.coin size={15} /> : <ResourceIcon icon={RESOURCES.crystals.icon} color={RESOURCES.crystals.color} size={15} />}
    {fmt(o.price.amount)}
  </span>
);

function offerTitle(o: MarketOffer) {
  if (o.gear) return `${SLOT_BY_ID[o.gear.slot].name} ${GEAR_RARITIES[o.gear.rarity].name.toLowerCase()}`;
  const [k, v] = Object.entries(o.reward ?? {})[0] ?? [];
  return k ? `${RESOURCES[k as keyof typeof RESOURCES].name} ×${v}` : '';
}

export function Market() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [sel, setSel] = useState<number | null>(null);
  const m = save.shop.market;
  useEffect(() => { mutate((s) => { ensureMarket(s, now); }); }, [m?.day]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <Screen title="Marché"><p className="muted">Ouverture…</p></Screen>;
  const cost = refreshCost(m);
  const o = sel != null ? m.offers[sel] : null;
  const has = (x: MarketOffer) => save.resources[x.price.resource] >= x.price.amount;

  const buy = () => {
    if (sel == null) return;
    let r: ReturnType<typeof buyOffer> = { ok: false };
    mutate((s) => { r = buyOffer(s, sel, now); });
    if (r.ok) { play('claim'); toast('Achat effectué.', 'ok'); setSel(null); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const refresh = () => {
    let r: ReturnType<typeof refreshMarket> = { ok: false };
    mutate((s) => { r = refreshMarket(s, now); });
    if (r.ok) play('open'); else toast(r.reason ?? 'Impossible.', 'error');
  };

  return (
    <Screen title="Marché">
      <Wallet ids={['gold', 'diamonds']} cols={2} />
      <div className="mk-grid">
        {m.offers.map((x, i) => {
          const res = x.reward ? Object.entries(x.reward)[0] : null;
          const def = res ? RESOURCES[res[0] as keyof typeof RESOURCES] : null;
          return (
            <button key={`${m.refreshes}-${i}`} className={`mk-offer ${x.bought ? 'sold' : ''}`} disabled={x.bought} onClick={() => setSel(i)}
              style={x.gear ? { ['--gc' as string]: GEAR_RARITIES[x.gear.rarity].color } : undefined} aria-label={`${offerTitle(x)}${x.bought ? ', acheté' : ''}`}>
              <div className="mk-art">
                {x.gear ? <GearCard g={x.gear} /> : def && <><ResourceIcon icon={def.icon} color={def.color} size={40} res={def.id} /><b className="mk-qty">×{res![1]}</b></>}
              </div>
              <div className="mk-name">{x.gear ? GEAR_RARITIES[x.gear.rarity].name : def?.name}</div>
              {x.bought ? <span className="mk-sold">Acheté</span> : <PriceTag o={x} enough={has(x)} />}
            </button>
          );
        })}
      </div>
      <div className="mk-foot">
        <span className="faint">Nouvelles offres dans {formatDuration(msUntilReset(now))}</span>
        <button className="btn secondary small" disabled={cost == null} onClick={refresh}>
          {cost == null ? 'Plus de renouvellement' : <>Renouveler · <Icon.diamond size={14} /> {cost}</>}
        </button>
      </div>

      {o && (
        <Modal onClose={() => setSel(null)}>
          <h2>{offerTitle(o)}</h2>
          {o.gear ? (
            <>
              <div className="mk-gear-head">
                <div className="gd-card"><GearCard g={o.gear} hideMain /></div>
                <div className="grow">
                  <div className="gd-stars"><GearStars n={o.gear.stars ?? 1} size={13} /><span className="faint"> {o.gear.stars}/{GEAR_MAX_STARS}</span></div>
                  <div className="gd-set" style={{ ['--sc' as string]: SETS[o.gear.set].color, marginTop: 6 }}>
                    <SetEmblem id={o.gear.set} size={18} />
                    <div className="grow"><b>{SETS[o.gear.set].name}</b><div className="gd-set-bonus">{SETS[o.gear.set].pieces} pièces : {SETS[o.gear.set].description}</div></div>
                  </div>
                </div>
              </div>
              <div className="gd-main"><span className="muted">Principale</span><b>{statText(o.gear.main, mainValue(o.gear))}</b></div>
              {o.gear.subs.map((sb, i) => <div key={i} className="gd-sub"><span>{statText(sb.stat, sb.value)}</span></div>)}
            </>
          ) : (
            <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{RESOURCES[Object.keys(o.reward ?? {})[0] as keyof typeof RESOURCES]?.description}</p>
          )}
          <div className="mk-cost"><span className="muted">Prix</span><PriceTag o={o} enough={has(o)} /></div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="btn secondary grow" onClick={() => setSel(null)}>Annuler</button>
            <button className="btn grow" disabled={!has(o)} onClick={buy}>{has(o) ? 'Acheter' : o.price.resource === 'gold' ? 'Or insuffisant' : 'Cristaux insuffisants'}</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BANNERS, BANNER_BY_ID, EVENT_WELCOME_GIFT, DUPLICATE_FRAGMENTS } from '../../data/summons';
import { HEROES, HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { RESOURCES } from '../../data/resources';
import type { RarityId } from '../../data/types';
import { canAfford, summon, type SummonResult } from '../../game/summon';
import { applyReward } from '../../game/rewards';
import { bannerAvailable } from '../../game/events';
import { play } from '../../audio/sfx';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { HeroArt } from '../art/HeroArt';
import { ResourceIcon } from '../art/Icons';

export function Summon() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const now = useGame((s) => s.now);
  const [bannerId, setBannerId] = useState('aeon');
  const [rates, setRates] = useState(false);
  const [reveal, setReveal] = useState<{ results: SummonResult[]; banner: string; count: 1 | 10 } | null>(null);
  const b = BANNER_BY_ID[bannerId];
  const res = RESOURCES[b.cost.resource];
  const have = save.resources[b.cost.resource];
  const pity = save.summons.pity[b.id] ?? 0;

  const doSummon = (count: 1 | 10, id = bannerId) => {
    let out: ReturnType<typeof summon> = { ok: false, results: [] };
    mutate((s) => { out = summon(s, id, count, Math.random, Date.now()); });
    if (!out.ok) { toast(out.reason ?? 'Impossible.', 'error'); return; }
    setReveal({ results: out.results, banner: id, count });
  };

  const giftAvailable = b.featured && !save.flags[EVENT_WELCOME_GIFT.flag];

  return (
    <Screen title="Invocation">
      <div className="chips" style={{ marginBottom: 10 }}>
        {BANNERS.filter((x) => bannerAvailable(x.id, now)).map((x) => (
          <button key={x.id} className={`chip ${x.id === bannerId ? 'active' : ''}`} style={x.id === bannerId ? { borderColor: x.color, color: x.glow } : undefined} onClick={() => setBannerId(x.id)}>
            <ResourceIcon icon={RESOURCES[x.cost.resource].icon} color={RESOURCES[x.cost.resource].color} size={14} />{x.name.replace('Invocation ', '')}
          </button>
        ))}
      </div>

      <div className="banner" style={{ ['--bc' as string]: b.color, ['--bg2' as string]: b.glow }}>
        <div className="portal small"><span /><span /><span /></div>
        {b.featured && <div className="banner-featured"><HeroArt heroId={b.featured.heroId} kind="full" /></div>}
        <div className="banner-info">
          <h2>{b.name}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{b.subtitle}</div>
          {b.featured && <div className="chip" style={{ marginTop: 6, borderColor: b.color }}>En vedette : {HERO_BY_ID[b.featured.heroId].name}</div>}
          <div className="row" style={{ gap: 6, marginTop: 8 }}><ResourceIcon icon={res.icon} color={res.color} size={20} /><b>{fmt(have)}</b><span className="faint">{res.name}</span></div>
          {b.pity && <div className="faint" style={{ marginTop: 4 }}>{RARITIES[b.pity.rarity].name} garanti dans <b style={{ color: 'var(--gold-hi)' }}>{b.pity.every - pity}</b> invocation(s)</div>}
        </div>
      </div>

      {giftAvailable && (
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => { mutate((s) => { applyReward(s, EVENT_WELCOME_GIFT.reward); s.flags[EVENT_WELCOME_GIFT.flag] = true; }); play('claim'); toast('Cadeau d’événement : +10 éclats de faille !', 'ok'); }}>
          Récupérer le cadeau d’événement (10 éclats de faille)<span className="shine" />
        </button>
      )}

      <div className="row" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn secondary grow summon-btn" disabled={!canAfford(save, b.id, 1)} onClick={() => doSummon(1)}>
          Invoquer ×1<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {b.cost.amount}</small>
        </button>
        <button className="btn grow summon-btn" disabled={!canAfford(save, b.id, 10)} onClick={() => doSummon(10)}>
          Invoquer ×10<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {b.cost.amount * 10}</small><span className="shine" />
        </button>
      </div>
      <button className="btn secondary small block" style={{ marginTop: 10 }} onClick={() => setRates(true)}>Taux d’invocation et garanties</button>

      <Panel title="Dernières invocations">
        {save.summons.history.length === 0 && <p className="faint">Aucune invocation pour l’instant.</p>}
        <div className="history">
          {save.summons.history.slice(0, 12).map((x, i) => (
            <button key={i} className="hist-item" onClick={() => { const inst = save.heroes.find((h) => h.heroId === x.heroId); push({ name: 'hero', heroId: x.heroId, uid: inst?.uid }); }}>
              <div className="hist-ava" style={{ borderColor: RARITIES[HERO_BY_ID[x.heroId].rarity].color }}><HeroArt heroId={x.heroId} /></div>
              <span className="faint">{x.duplicate ? 'fragments' : 'nouveau'}</span>
            </button>
          ))}
        </div>
        <p className="faint">Total : {save.summons.total} invocation(s). Un héros déjà possédé est converti en fragments (pour l’éveil, ou pour obtenir un héros manquant).</p>
      </Panel>

      {rates && (
        <Modal onClose={() => setRates(false)}>
          <h2>{b.name}</h2>
          {(Object.entries(b.rates) as [RarityId, number][]).map(([r, v]) => (
            <div key={r} className="stat-row">
              <b style={{ color: RARITIES[r].color }}>{RARITIES[r].name}</b>
              <span>{v} % <span className="faint">· {HEROES.filter((h) => h.rarity === r).map((h) => h.name.split(' ')[0]).join(', ')}</span></span>
            </div>
          ))}
          {b.featured && <p className="faint">{HERO_BY_ID[b.featured.heroId].name} : {Math.round(b.featured.share * 100)} % des tirages {RARITIES[HERO_BY_ID[b.featured.heroId].rarity].name.toLowerCase()}s.</p>}
          {b.pity && <p className="faint">Garantie : un héros {RARITIES[b.pity.rarity].name.toLowerCase()} ou mieux au plus tard toutes les {b.pity.every} invocations (compteur actuel : {pity}).</p>}
          {b.multiGuarantee && <p className="faint">Invocation ×10 : au moins un héros {RARITIES[b.multiGuarantee].name.toLowerCase()} ou mieux.</p>}
          <p className="faint">Doublons → fragments : {(Object.entries(DUPLICATE_FRAGMENTS) as [RarityId, number][]).map(([r, n]) => `${RARITIES[r].name} ${n}`).join(' · ')}.</p>
          <button className="btn block" onClick={() => setRates(false)}>Fermer</button>
        </Modal>
      )}

      {reveal && <SummonReveal results={reveal.results} color={BANNER_BY_ID[reveal.banner].color}
        onClose={() => setReveal(null)}
        again={canAfford(save, reveal.banner, reveal.count) ? () => doSummon(reveal.count, reveal.banner) : undefined} count={reveal.count} />}
    </Screen>
  );
}

function SummonReveal({ results, color, onClose, again, count }: { results: SummonResult[]; color: string; onClose: () => void; again?: () => void; count: number }) {
  const best = results.reduce((a, r) => (RARITIES[r.rarity].order > RARITIES[a.rarity].order ? r : a), results[0]);
  const order = RARITIES[best.rarity].order;
  const special = order >= 5;
  const [stage, setStage] = useState<'portal' | 'burst' | 'cards'>('portal');
  useEffect(() => {
    setStage('portal');
    play(order >= 4 ? 'rare' : 'open');
    const t1 = setTimeout(() => { if (special) { setStage('burst'); play('rare'); } else setStage('cards'); }, order >= 4 ? 1500 : 1000);
    const t2 = special ? setTimeout(() => setStage('cards'), 3300) : undefined;
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [results, order, special]);
  const glow = RARITIES[best.rarity].color;
  return (
    <div className={`reveal ${stage}`} style={{ ['--bc' as string]: stage === 'portal' ? color : glow, ['--rg' as string]: glow }} onClick={() => stage !== 'cards' && setStage('cards')}>
      {stage !== 'cards' && (
        <div className="reveal-portal">
          <div className={`portal big ${order >= 4 ? 'charged' : ''}`}><span /><span /><span /></div>
          {stage === 'burst' && <><div className="rays" /><div className="burst-text">{best.rarity === 'mythic' ? 'MYTHIQUE' : 'LÉGENDAIRE'}</div></>}
          <div className="faint reveal-skip">Toucher pour passer</div>
        </div>
      )}
      {stage === 'cards' && (
        <div className="reveal-cards" onClick={(e) => e.stopPropagation()}>
          {count === 1 ? (
            <div className="reveal-single">
              <div className="rs-art" style={{ borderColor: RARITIES[best.rarity].color }}><HeroArt heroId={best.heroId} kind="full" /></div>
              <div className="rs-rar" style={{ color: RARITIES[best.rarity].color }}>{RARITIES[best.rarity].name.toUpperCase()}</div>
              <h2>{HERO_BY_ID[best.heroId].name}</h2>
              <div className="muted">{HERO_BY_ID[best.heroId].title}</div>
              <div className={`chip ${best.duplicate ? '' : 'active'}`} style={{ margin: '10px auto 0', width: 'fit-content' }}>{best.duplicate ? `Déjà possédé · +${best.fragments} fragments` : 'Nouveau héros !'}</div>
            </div>
          ) : (
            <div className="reveal-grid">
              {results.map((r, i) => (
                <div key={i} className="rg-item" style={{ animationDelay: `${i * 0.12}s` }}>
                  <HeroCard heroId={r.heroId} level={1} />
                  <span className={`rg-tag ${r.duplicate ? '' : 'new'}`}>{r.duplicate ? `+${r.fragments} frag.` : 'NOUVEAU'}</span>
                </div>
              ))}
            </div>
          )}
          <div className="row" style={{ gap: 8, marginTop: 18 }}>
            <button className="btn secondary grow" onClick={onClose}>Continuer</button>
            {again && <button className="btn grow" onClick={again}>Encore ×{count}</button>}
          </div>
        </div>
      )}
    </div>
  );
}

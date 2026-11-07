import { Coach } from '../components/Coach';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BANNERS, BANNER_BY_ID, EVENT_WELCOME_GIFT } from '../../data/summons';
import { HEROES, HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { RESOURCES } from '../../data/resources';
import type { RarityId } from '../../data/types';
import { canAfford, summon, type SummonResult } from '../../game/summon';
import { applyReward } from '../../game/rewards';
import { bannerAvailable } from '../../game/events';
import { play } from '../../audio/sfx';
import { playCardOut, playEmerge, playRiftOpen, playShardCharge, playShatter } from '../../audio/battleSfx';
import { Modal, Screen, fmt } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { HeroArt } from '../art/HeroArt';
import { ResourceIcon } from '../art/Icons';
import { Crystal } from '../art/Crystal';
import { placeArt } from '../art/PlaceScene';

// L'AUTEL DES FAILLES — le Lien pose un éclat du Cœur d'Aeon sur l'autel. L'éclat se brise,
// une faille s'ouvre dans le ciel et un Héritier en sort. La couleur de la faille annonce la rareté.

const SHORT: Record<string, string> = { standard: 'Terne', aeon: 'Aeon', epic: 'Épique', event_ash: 'Faille' };

export function Summon() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const now = useGame((s) => s.now);
  const [bannerId, setBannerId] = useState('aeon');
  const [sheet, setSheet] = useState<'rates' | 'history' | null>(null);
  const [reveal, setReveal] = useState<{ results: SummonResult[]; banner: string; count: 1 | 10; key: number } | null>(null);
  const b = BANNER_BY_ID[bannerId];
  const res = RESOURCES[b.cost.resource];
  const have = save.resources[b.cost.resource];
  const pity = save.summons.pity[b.id] ?? 0;
  const altar = placeArt('altar');

  const doSummon = (count: 1 | 10, id = bannerId) => {
    let out: ReturnType<typeof summon> = { ok: false, results: [] };
    mutate((s) => { out = summon(s, id, count, Math.random, Date.now()); });
    if (!out.ok) { toast(out.reason ?? 'Impossible.', 'error'); return; }
    setReveal({ results: out.results, banner: id, count, key: Date.now() });
  };
  const giftAvailable = b.featured && !save.flags[EVENT_WELCOME_GIFT.flag];

  return (
    <Screen title="Autel des Failles" bg={<div className="altar-bg">{altar && <img src={altar} alt="" draggable={false} />}</div>}>
      <Coach id="summon_call" target=".summon-one" when={!reveal && canAfford(save, b.id, 1)} text="Pose un éclat sur l’autel : un Héritier répondra à l’appel." />
      <div className="shard-tabs" role="tablist" aria-label="Type d’éclat">
        {BANNERS.filter((x) => bannerAvailable(x.id, now)).map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === bannerId} className={`shard-tab ${x.id === bannerId ? 'on' : ''}`} style={{ ['--bc' as string]: x.color, ['--bg2' as string]: x.glow }} onClick={() => { play('tap'); setBannerId(x.id); }}>
            <Crystal color={x.color} glow={x.glow} size={20} />
            <span>{SHORT[x.id] ?? x.name}</span>
            {/* Invocation payée en cristaux : on montre l'icône des cristaux, pour ne pas confondre avec des éclats. */}
            {x.cost.resource === 'crystals'
              ? <b className="st-cost" aria-label={`${save.resources.crystals} cristaux`}><ResourceIcon icon={RESOURCES.crystals.icon} color={RESOURCES.crystals.color} size={11} />{fmt(save.resources.crystals)}</b>
              : <b>{fmt(save.resources[x.cost.resource])}</b>}
          </button>
        ))}
      </div>

      <div className="altar-stage" style={{ ['--bc' as string]: b.color, ['--bg2' as string]: b.glow }}>
        {altar && <img className="altar-img" src={altar} alt="" draggable={false} />}
        <div className="altar-rift" />
        {b.featured && (
          <div className="altar-featured">
            <div className="af-art"><HeroArt heroId={b.featured.heroId} kind="full" /></div>
            <span>En vedette · {HERO_BY_ID[b.featured.heroId].name}</span>
          </div>
        )}
        <div className="altar-shard" key={b.id}><Crystal color={b.color} glow={b.glow} size={74} /></div>
        <div className="altar-caption">
          <h2>{b.name.replace('Invocation ', 'Appel ').replace('Appel standard', 'Appel ordinaire')}</h2>
          <p>{b.subtitle}</p>
        </div>
      </div>

      {b.pity && (
        <div className="pity">
          <div className="pity-label"><span>Fissure du Cœur</span><span><b>{b.pity.every - pity}</b> appel{b.pity.every - pity > 1 ? 's' : ''} avant un {RARITIES[b.pity.rarity].name.toLowerCase()} garanti</span></div>
          <div className="pity-bar"><div style={{ width: `${(pity / b.pity.every) * 100}%`, background: RARITIES[b.pity.rarity].color }} /></div>
        </div>
      )}

      {giftAvailable && (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => { mutate((s) => { applyReward(s, EVENT_WELCOME_GIFT.reward); s.flags[EVENT_WELCOME_GIFT.flag] = true; }); play('claim'); toast('Cadeau d’événement : +10 éclats de faille !', 'ok'); }}>
          Récupérer 10 éclats de faille (cadeau)
        </button>
      )}

      <div className="row summon-bar" style={{ gap: 10, marginTop: 12 }}>
        <button className="btn secondary grow summon-btn summon-one" disabled={!canAfford(save, b.id, 1)} onClick={() => doSummon(1)}>
          Appeler ×1<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {fmt(b.cost.amount)} · vous : {fmt(have)}</small>
        </button>
        <button className="btn grow summon-btn" disabled={!canAfford(save, b.id, 10)} onClick={() => doSummon(10)}>
          Appeler ×10<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {fmt(b.cost.amount * 10)}</small>
        </button>
      </div>
      <div className="altar-links">
        <button onClick={() => setSheet('rates')}>Taux et garanties</button>
        <span aria-hidden>·</span>
        <button onClick={() => setSheet('history')}>Derniers appels ({save.summons.total})</button>
      </div>

      {sheet === 'rates' && (
        <Modal onClose={() => setSheet(null)}>
          <h2>{b.name}</h2>
          {(Object.entries(b.rates) as [RarityId, number][]).map(([r, v]) => (
            <div key={r} className="stat-row">
              <b style={{ color: RARITIES[r].color }}>{RARITIES[r].name}</b>
              <span>{v} % <span className="faint">· {HEROES.filter((h) => h.rarity === r).map((h) => h.name.split(' ')[0]).join(', ')}</span></span>
            </div>
          ))}
          {b.featured && <p className="faint">{HERO_BY_ID[b.featured.heroId].name} : {Math.round(b.featured.share * 100)} % des tirages {RARITIES[HERO_BY_ID[b.featured.heroId].rarity].name.toLowerCase()}s.</p>}
          {b.pity && <p className="faint">Garantie : un héros {RARITIES[b.pity.rarity].name.toLowerCase()} ou mieux au plus tard tous les {b.pity.every} appels (compteur : {pity}).</p>}
          {b.multiGuarantee && <p className="faint">Appel ×10 : au moins un héros {RARITIES[b.multiGuarantee].name.toLowerCase()} ou mieux.</p>}
          <p className="faint">Héros déjà possédé → 1 doublon : il sert à l’éveiller ou à renforcer sa famille ou son affinité (fiche du héros).</p>
          <button className="btn block" onClick={() => setSheet(null)}>Fermer</button>
        </Modal>
      )}
      {sheet === 'history' && (
        <Modal onClose={() => setSheet(null)}>
          <h2>Derniers appels</h2>
          {save.summons.history.length === 0 && <p className="faint" style={{ textAlign: 'center' }}>Aucun appel pour l’instant.</p>}
          <div className="history">
            {save.summons.history.slice(0, 20).map((x, i) => (
              <button key={i} className="hist-item" onClick={() => { const inst = save.heroes.find((h) => h.heroId === x.heroId); setSheet(null); push({ name: 'hero', heroId: x.heroId, uid: inst?.uid }); }}>
                <div className="hist-ava" style={{ borderColor: RARITIES[HERO_BY_ID[x.heroId].rarity].color }}><HeroArt heroId={x.heroId} /></div>
                <span className="faint">{x.duplicate ? 'doublon' : 'nouveau'}</span>
              </button>
            ))}
          </div>
          <p className="faint">Total : {save.summons.total} appel(s).</p>
          <button className="btn block" onClick={() => setSheet(null)}>Fermer</button>
        </Modal>
      )}

      {reveal && <RiftReveal key={reveal.key} results={reveal.results} bannerColor={BANNER_BY_ID[reveal.banner].color} bannerGlow={BANNER_BY_ID[reveal.banner].glow}
        altar={altar} onClose={() => setReveal(null)}
        again={canAfford(save, reveal.banner, reveal.count) ? () => doSummon(reveal.count, reveal.banner) : undefined} count={reveal.count} />}
    </Screen>
  );
}

type Stage = 'charge' | 'shatter' | 'rift' | 'emerge';

function RiftReveal({ results, bannerColor, bannerGlow, altar, onClose, again, count }: { results: SummonResult[]; bannerColor: string; bannerGlow: string; altar?: string; onClose: () => void; again?: () => void; count: number }) {
  const best = results.reduce((a, r) => (RARITIES[r.rarity].order > RARITIES[a.rarity].order ? r : a), results[0]);
  const order = RARITIES[best.rarity].order;
  const rc = RARITIES[best.rarity].color;
  const rg = RARITIES[best.rarity].glow;
  const reduced = useGame.getState().save?.settings.reducedMotion;
  const [stage, setStage] = useState<Stage>(reduced ? 'emerge' : 'charge');
  const [cracks, setCracks] = useState(0);
  const timers = useRef<number[]>([]);
  const shards = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * 360 + Math.random() * 18, d: 90 + Math.random() * 120, r: Math.random() * 540 - 270, s: 0.5 + Math.random() * 0.8 })), []);

  const go = (s: Stage) => {
    setStage(s);
    if (s === 'shatter') playShatter();
    if (s === 'rift') playRiftOpen(order);
    if (s === 'emerge') playEmerge(order);
  };
  useEffect(() => {
    if (reduced) { playEmerge(order); return; }
    playShardCharge();
    const t = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    [150, 350, 550, 750, 950].forEach((ms, i) => t(ms, () => setCracks((i + 1) / 5)));
    t(1150, () => go('shatter'));
    t(1500, () => go('rift'));
    t(order >= 5 ? 3300 : order >= 4 ? 2700 : 2300, () => go('emerge'));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = () => { if (stage !== 'emerge') { timers.current.forEach(clearTimeout); go('emerge'); } };

  useEffect(() => {
    if (stage !== 'emerge' || count === 1) return;
    results.forEach((r, i) => timers.current.push(window.setTimeout(() => playCardOut(RARITIES[r.rarity].order), 120 + i * 140)));
  }, [stage, count, results]);

  return (
    <div className={`rift-reveal st-${stage} ${order >= 5 ? 'legend' : ''}`} style={{ ['--bc' as string]: bannerColor, ['--bg2' as string]: bannerGlow, ['--rc' as string]: rc, ['--rg' as string]: rg }} onClick={skip}>
      <div className="rr-bg">{altar && <img src={altar} alt="" draggable={false} />}</div>
      <div className="rr-rift"><i /><i /></div>
      {(stage === 'charge' || stage === 'shatter') && (
        <div className="rr-shard"><Crystal color={bannerColor} glow={bannerGlow} size={96} cracks={cracks} /></div>
      )}
      {stage === 'shatter' && (
        <div className="rr-pieces">
          {shards.map((p, i) => <i key={i} style={{ ['--a' as string]: `${p.a}deg`, ['--d' as string]: `${p.d}px`, ['--r' as string]: `${p.r}deg`, ['--s' as string]: p.s, background: i % 2 ? bannerGlow : bannerColor }} />)}
        </div>
      )}
      {stage === 'shatter' && <div className="rr-flash" />}
      {stage === 'rift' && order >= 5 && <div className="rr-title">{best.rarity === 'mythic' ? 'MYTHIQUE' : 'LÉGENDAIRE'}</div>}
      {stage !== 'emerge' && <div className="rr-skip faint">Toucher pour passer</div>}

      {stage === 'emerge' && (
        <div className="rr-result" onClick={(e) => e.stopPropagation()}>
          {count === 1 ? (
            <div className="rr-single">
              <div className="rr-hero" style={{ borderColor: rc }}><HeroArt heroId={best.heroId} kind="full" /></div>
              <div className="rr-rar" style={{ color: rc }}>{'★'.repeat(order)} {RARITIES[best.rarity].name.toUpperCase()}</div>
              <h2>{HERO_BY_ID[best.heroId].name}</h2>
              <div className="muted">{HERO_BY_ID[best.heroId].title}</div>
              <div className={`chip ${best.duplicate ? '' : 'active'}`} style={{ margin: '10px auto 0', width: 'fit-content' }}>{best.duplicate ? 'Déjà à vos côtés · +1 doublon' : 'Un nouvel Héritier répond à l’appel'}</div>
            </div>
          ) : (
            <div className="rr-grid">
              {results.map((r, i) => (
                <div key={i} className="rr-card" style={{ animationDelay: `${0.12 + i * 0.14}s`, ['--rc' as string]: RARITIES[r.rarity].color, ['--fx' as string]: `${((i % 5) - 2) * -60}px`, ['--fy' as string]: `${-160 - Math.floor(i / 5) * 90}px` }}>
                  <HeroCard heroId={r.heroId} level={1} />
                  <span className={`rg-tag ${r.duplicate ? '' : 'new'}`}>{r.duplicate ? 'DOUBLON' : 'NOUVEAU'}</span>
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

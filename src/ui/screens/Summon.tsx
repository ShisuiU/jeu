import { trackStat } from '../../state/stats';
import { GetButton } from '../components/Sources';
import shCommon from '../../assets/kit/shard_common.webp';
import shAeon from '../../assets/kit/shard_aeon.webp';
import shEpic from '../../assets/kit/shard_epic.webp';
import shRift from '../../assets/kit/shard_rift.webp';
// Éclats peints du kit SpriteCook (v1.73.0), un par appel.
const SHARD_IMG: Record<string, string> = { standard: shCommon, aeon: shAeon, epic: shEpic, event_ash: shRift };
import { Coach } from '../components/Coach';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { BANNERS, BANNER_BY_ID, EPIC_SHARD_PRICE, EVENT_WELCOME_GIFT } from '../../data/summons';
import { HEROES, HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { RESOURCES } from '../../data/resources';
import type { RarityId } from '../../data/types';
import { buyEpicShards, canAfford, summon, type SummonResult } from '../../game/summon';
import { applyReward } from '../../game/rewards';
import { bannerAvailable } from '../../game/events';
import { play } from '../../audio/sfx';
import { playEmerge, playFlip, playHush, playRevealFlash, playRiftOpen, playShardCharge, playShatter } from '../../audio/battleSfx';
import { Stage25 } from '../fx/stage25';
import { HERO_LINES } from '../../data/heroLines';
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
  const pity = save.summons.pity[b.id] ?? 0;
  const altar = placeArt('altar');

  const doSummon = (count: 1 | 10, id = bannerId) => {
    let out: ReturnType<typeof summon> = { ok: false, results: [] };
    mutate((s) => { out = summon(s, id, count, Math.random, Date.now()); });
    if (!out.ok) { toast(out.reason ?? 'Impossible.', 'error'); return; }
    trackStat({ kind: 'summon', n: count });
    setReveal({ results: out.results, banner: id, count, key: Date.now() });
  };
  const giftAvailable = b.featured && !save.flags[EVENT_WELCOME_GIFT.flag];

  return (
    <Screen title="Autel des Failles" bg={<div className="altar-bg">{altar && <img src={altar} alt="" draggable={false} />}</div>}>
      <Coach id="summon_call" target=".summon-one" when={!reveal && canAfford(save, b.id, 1)} text="Pose un éclat sur l’autel : un Héritier répondra à l’appel." />
      <div className="shard-tabs" role="tablist" aria-label="Type d’éclat">
        {BANNERS.filter((x) => bannerAvailable(x.id, now)).map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === bannerId} className={`shard-tab ${x.id === bannerId ? 'on' : ''}`} style={{ ['--bc' as string]: x.color, ['--bg2' as string]: x.glow }} onClick={() => { play('tap'); setBannerId(x.id); }}>
            {SHARD_IMG[x.id] ? <img className="st-ico" src={SHARD_IMG[x.id]} alt="" /> : <Crystal color={x.color} glow={x.glow} size={20} />}
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
        <GetButton res={b.cost.resource} label />
        <div className="altar-caption">
          <h2>{b.name.replace('Invocation ', 'Appel ').replace('Appel standard', 'Appel ordinaire')}</h2>
          <p>{b.subtitle}</p>
        </div>
      </div>

      {b.pity && (
        <div className="pity">
          <div className="pity-label"><span>Fissure du Cœur</span><span><b>{Math.max(1, b.pity.every - pity)}</b> appel{Math.max(1, b.pity.every - pity) > 1 ? 's' : ''} avant un {RARITIES[b.pity.rarity].name.toLowerCase()} garanti</span></div>
          <div className="pity-bar"><div style={{ width: `${Math.min(100, (pity / b.pity.every) * 100)}%`, background: RARITIES[b.pity.rarity].color }} /></div>
        </div>
      )}

      {giftAvailable && (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => { mutate((s) => { applyReward(s, EVENT_WELCOME_GIFT.reward); s.flags[EVENT_WELCOME_GIFT.flag] = true; }); play('claim'); toast('Cadeau d’événement : +10 éclats de faille !', 'ok'); }}>
          Récupérer 10 éclats de faille (cadeau)
        </button>
      )}

      <div className="row summon-bar" style={{ gap: 10, marginTop: 12 }}>
        <button className="btn grow summon-btn summon-one kit-s1" disabled={!canAfford(save, b.id, 1)} onClick={() => doSummon(1)}>
          Appeler ×1<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {fmt(b.cost.amount)}</small>
        </button>
        <button className="btn grow summon-btn kit-s10" disabled={!canAfford(save, b.id, 10)} onClick={() => doSummon(10)}>
          Appeler ×10<small><ResourceIcon icon={res.icon} color={res.color} size={14} /> {fmt(b.cost.amount * 10)}</small>
        </button>
      </div>
      {b.cost.resource === 'shardEpic' && (
        <div className="epic-exchange">
          <span className="faint">Échanger <ResourceIcon icon={RESOURCES.crystals.icon} color={RESOURCES.crystals.color} size={12} /> {EPIC_SHARD_PRICE} → 1 éclat épique · tu as <ResourceIcon icon={RESOURCES.crystals.icon} color={RESOURCES.crystals.color} size={12} /> {fmt(save.resources.crystals)}</span>
          <div className="row" style={{ gap: 8 }}>
            {[1, 10].map((n) => (
              <button key={n} className="btn secondary small grow" disabled={save.resources.crystals < EPIC_SHARD_PRICE * n}
                onClick={() => { let r = { ok: false } as ReturnType<typeof buyEpicShards>; mutate((s) => { r = buyEpicShards(s, n); }); if (r.ok) { play('claim'); toast(`+${n} éclat${n > 1 ? 's' : ''} épique${n > 1 ? 's' : ''}.`, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error'); }}>
                +{n} <small>({fmt(EPIC_SHARD_PRICE * n)})</small>
              </button>
            ))}
          </div>
        </div>
      )}
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
              <span>{v} % <span className="faint">· {HEROES.filter((h) => h.rarity === r).map((h) => h.name.split(/[ ,]/)[0]).join(', ')}</span></span>
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

type Stage = 'charge' | 'shatter' | 'rift' | 'hush' | 'flash' | 'emerge';

// RÉVÉLATION D'INVOCATION (v1.85.0) — mise en scène façon grands jeux d'invocation :
// 1. l'éclat monte, aspire des lueurs en tourbillon ; leur couleur vire à celle de la meilleure rareté (l'indice) ;
// 2. il vole en éclats ; 3. la faille se déchire, des braises en montent (rayons et ralenti pour Légendaire/Mythique) ;
// 4. Légendaire/Mythique : silence tendu, tout s'assombrit ; 5. éclair blanc (Épique et mieux) ;
// 6. le héros sort : silhouette puis lumière, reflet sur la carte, étoiles une à une, nom lettre par lettre.
// Appel ×10 : les cartes arrivent face cachée (leur dos brille déjà à la couleur de leur rareté) et se retournent une à une.
function RiftReveal({ results, bannerColor, bannerGlow, altar, onClose, again, count }: { results: SummonResult[]; bannerColor: string; bannerGlow: string; altar?: string; onClose: () => void; again?: () => void; count: number }) {
  const best = results.reduce((a, r) => (RARITIES[r.rarity].order > RARITIES[a.rarity].order ? r : a), results[0]);
  const order = RARITIES[best.rarity].order;
  const rc = RARITIES[best.rarity].color;
  const rg = RARITIES[best.rarity].glow;
  const reduced = useGame.getState().save?.settings.reducedMotion;
  const [stage, setStage] = useState<Stage>(reduced ? 'emerge' : 'charge');
  const [cracks, setCracks] = useState(0);
  const [tell, setTell] = useState(false);
  const [flipped, setFlipped] = useState(reduced || count === 1 ? results.length : 0);
  const timers = useRef<number[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<Stage25 | null>(null);
  const loop = useRef<number | undefined>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);
  const shards = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * 360 + Math.random() * 18, d: 90 + Math.random() * 120, r: Math.random() * 540 - 270, s: 0.5 + Math.random() * 0.8 })), []);
  // Ordre de retournement (×10) : les plus rares en dernier, pour garder le suspense.
  const flipOrder = useMemo(() => results.map((r, i) => ({ i, o: RARITIES[r.rarity].order })).sort((a, b) => a.o - b.o || a.i - b.i).map((x) => x.i), [results]);
  const rank = useMemo(() => { const m = new Map<number, number>(); flipOrder.forEach((idx, k) => m.set(idx, k)); return m; }, [flipOrder]);

  const center = () => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.44 });
  const t = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const every = (ms: number, f: () => void) => { if (loop.current) clearInterval(loop.current); loop.current = window.setInterval(f, ms); };

  const go = (st: Stage) => {
    setStage(st);
    const st25 = fx.current, c = center();
    if (st === 'shatter') { playShatter(); st25?.burst(c, rc, 50, 0.55); st25?.burst(c, '#ffffff', 24, 0.4); st25?.burst(c, bannerGlow, 20, 0.35); }
    if (st === 'rift') { playRiftOpen(order); every(140, () => fx.current?.embers({ x: c.x, y: window.innerHeight * 0.36 }, Math.random() < 0.5 ? rc : rg, order >= 5 ? 5 : 3, 34, 120)); }
    if (st === 'hush') { playHush(order); if (loop.current) clearInterval(loop.current); every(60, () => fx.current?.vortex({ x: c.x, y: window.innerHeight * 0.36 }, Math.random() < 0.3 ? '#ffffff' : rc, 4, 220)); }
    if (st === 'flash') { if (loop.current) clearInterval(loop.current); playRevealFlash(order); }
    if (st === 'emerge') {
      if (loop.current) clearInterval(loop.current);
      playEmerge(order);
      if (count === 1 && order >= 4) {
        // Aura : braises qui montent autour de la carte du héros.
        every(160, () => { const r = cardRef.current?.getBoundingClientRect(); if (r) fx.current?.embers({ x: r.left + r.width / 2, y: r.bottom - 10 }, Math.random() < 0.6 ? rc : rg, order >= 5 ? 3 : 2, r.width / 2, 8); });
      }
    }
  };

  useEffect(() => {
    if (canvas.current && !reduced) { const st25 = new Stage25(canvas.current, () => 1, [], 0); st25.start(); fx.current = st25; }
    if (reduced) { playEmerge(order); return () => { fx.current?.stop(); }; }
    playShardCharge();
    // Tourbillon de lueurs aspirées par l'éclat ; à 650 ms, elles prennent la couleur de la rareté (l'indice).
    let tellOn = false;
    every(90, () => { const c = center(); fx.current?.vortex(c, tellOn ? (Math.random() < 0.7 ? rc : '#ffffff') : (Math.random() < 0.6 ? bannerColor : bannerGlow), 3, 160); });
    t(650, () => { tellOn = true; setTell(true); });
    [150, 350, 550, 750, 950].forEach((ms, i) => t(ms, () => setCracks((i + 1) / 5)));
    t(1150, () => go('shatter'));
    t(1500, () => go('rift'));
    const riftLen = order >= 6 ? 2300 : order >= 5 ? 1900 : order >= 4 ? 1200 : 800;
    let at = 1500 + riftLen;
    if (order >= 5) { t(at, () => go('hush')); at += 650; }
    if (order >= 4) { t(at, () => go('flash')); at += 240; }
    t(at, () => go('emerge'));
    return () => { timers.current.forEach(clearTimeout); if (loop.current) clearInterval(loop.current); fx.current?.stop(); fx.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = () => { if (stage !== 'emerge') { timers.current.forEach(clearTimeout); timers.current = []; setTell(true); go('emerge'); } };

  // ×10 : arrivée face cachée, puis retournements un à un (pause avant les Légendaires et Mythiques).
  useEffect(() => {
    if (stage !== 'emerge' || count === 1 || reduced) return;
    let at = 900;
    flipOrder.forEach((idx, k) => {
      const o = RARITIES[results[idx].rarity].order;
      if (o >= 5) at += 450;
      t(at, () => {
        setFlipped(k + 1); playFlip(o);
        const el = document.querySelector<HTMLElement>(`.rr-card[data-i="${idx}"]`); const r = el?.getBoundingClientRect();
        if (r && o >= 4) fx.current?.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, RARITIES[results[idx].rarity].color, o >= 5 ? 34 : 16, o >= 5 ? 0.4 : 0.25);
      });
      at += o >= 5 ? 520 : 170;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);
  const revealAll = () => { timers.current.forEach(clearTimeout); timers.current = []; setFlipped(results.length); };

  const name = HERO_BY_ID[best.heroId].name;
  return (
    <div className={`rift-reveal st-${stage} ${order >= 5 ? 'legend' : ''} ${order >= 6 ? 'mythic' : ''} ${tell ? 'tell' : ''}`} style={{ ['--bc' as string]: bannerColor, ['--bg2' as string]: bannerGlow, ['--rc' as string]: rc, ['--rg' as string]: rg }} onClick={skip}>
      <div className="rr-bg">{altar && <img src={altar} alt="" draggable={false} />}</div>
      {order >= 5 && <div className="rr-rays" aria-hidden />}
      <div className="rr-rift"><i /><i /></div>
      <canvas ref={canvas} className="rr-fx" aria-hidden />
      {(stage === 'charge' || stage === 'shatter') && (
        <div className="rr-shard"><Crystal color={tell ? rc : bannerColor} glow={tell ? rg : bannerGlow} size={96} cracks={cracks} /></div>
      )}
      {stage === 'shatter' && (
        <div className="rr-pieces">
          {shards.map((p, i) => <i key={i} style={{ ['--a' as string]: `${p.a}deg`, ['--d' as string]: `${p.d}px`, ['--r' as string]: `${p.r}deg`, ['--s' as string]: p.s, background: i % 2 ? rg : rc }} />)}
        </div>
      )}
      {stage === 'shatter' && <div className="rr-flash" />}
      {(stage === 'rift' || stage === 'hush') && order >= 5 && <div className="rr-title">{best.rarity === 'mythic' ? 'MYTHIQUE' : 'LÉGENDAIRE'}</div>}
      {stage === 'flash' && <div className="rr-white" />}
      {stage !== 'emerge' && <div className="rr-skip faint">Toucher pour passer</div>}

      {stage === 'emerge' && (
        <div className="rr-result" onClick={(e) => e.stopPropagation()}>
          {count === 1 ? (
            <div className="rr-single">
              {order >= 4 && <div className="rr-halo" aria-hidden />}
              <div className="rr-hero" ref={cardRef} style={{ borderColor: rc }}><HeroArt heroId={best.heroId} kind="full" /><span className="rr-shine" /></div>
              <div className="rr-rar" style={{ color: rc }}>
                {Array.from({ length: order }, (_, i) => <span key={i} className="rr-star" style={{ animationDelay: `${0.75 + i * 0.12}s` }}>★</span>)}
                <span className="rr-rarname" style={{ animationDelay: `${0.8 + order * 0.12}s` }}> {RARITIES[best.rarity].name.toUpperCase()}</span>
              </div>
              <h2 className="rr-name" aria-label={name}>{(() => { let k = 0; return name.split(' ').map((w, wi) => (
                <span key={wi} className="rr-word">{wi > 0 && <span style={{ animationDelay: `${1 + k++ * 0.035}s` }}> </span>}{[...w].map((ch, i) => <span key={i} style={{ animationDelay: `${1 + k++ * 0.035}s` }}>{ch}</span>)}</span>
              )); })()}</h2>
              <div className="muted rr-sub" style={{ animationDelay: `${1.1 + name.length * 0.035}s` }}>{HERO_BY_ID[best.heroId].title}</div>
              {order >= 5 && HERO_LINES[best.heroId]?.[0] && <div className="rr-quote rr-sub" style={{ animationDelay: `${1.3 + name.length * 0.035}s` }}>« {HERO_LINES[best.heroId][0]} »</div>}
              <div className={`chip rr-sub ${best.duplicate ? '' : 'active'}`} style={{ margin: '10px auto 0', width: 'fit-content', animationDelay: `${1.2 + name.length * 0.035}s` }}>{best.duplicate ? 'Déjà à tes côtés · +1 doublon' : 'Un nouvel Héritier répond à l’appel'}</div>
            </div>
          ) : (
            <div className="rr-grid">
              {results.map((r, i) => {
                const o = RARITIES[r.rarity].order;
                const up = (rank.get(i) ?? 0) < flipped;
                return (
                  <div key={i} data-i={i} className={`rr-card ${up ? 'up' : ''} ${o >= 5 ? 'hi' : o >= 4 ? 'mid' : ''}`} style={{ animationDelay: `${0.05 + i * 0.07}s`, ['--rc' as string]: RARITIES[r.rarity].color, ['--fx' as string]: `${((i % 5) - 2) * -60}px`, ['--fy' as string]: `${-160 - Math.floor(i / 5) * 90}px` }}
                    onClick={() => { if (!up) revealAll(); }}>
                    <div className="rr-flip">
                      <div className="rr-face rr-back" aria-hidden><span /></div>
                      <div className="rr-face rr-front"><HeroCard heroId={r.heroId} level={1} />{up && <span className={`rg-tag ${r.duplicate ? '' : 'new'}`}>{r.duplicate ? 'DOUBLON' : 'NOUVEAU'}</span>}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {count > 1 && flipped < results.length
            ? <button className="btn secondary block" style={{ marginTop: 18 }} onClick={revealAll}>Tout révéler</button>
            : (
              <div className="row" style={{ gap: 8, marginTop: 18 }}>
                <button className="btn secondary grow" onClick={onClose}>Continuer</button>
                {again && <button className="btn grow" onClick={again}>Encore ×{count}</button>}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

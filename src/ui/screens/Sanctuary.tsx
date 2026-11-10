import { Coach } from '../components/Coach';
import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { BALANCE } from '../../data/balance';
import { RARITIES } from '../../data/rarities';
import { maxLevelForRank, powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';
import { ascend, ascendCheck, awaken, awakenCheck, canImprove, elixirPreview, elixirsToCap, rankUp, rankUpCheck, skillCheck, useElixirs as applyElixirs, type Check } from '../../game/upgrade';
import { play } from '../../audio/sfx';
import { Modal, Screen, fmt } from '../components/common';
import { CostView } from '../components/Cost';
import { HeroStrip, useHeroOrder } from '../components/HeroStrip';
import { HeroArt } from '../art/HeroArt';
import { Icon, ResourceIcon } from '../art/Icons';
import { PlaceAmbient } from '../art/PlaceScene';
import { HeroUpgrade } from './HeroUpgrade';
import { Wallet } from '../components/Wallet';
import { FeedPanel } from '../components/FeedPanel';
import { MasteryPanel } from '../components/MasteryPanel';
import { canLearnAny } from '../../game/masteries';
import { MASTERY_TIERS } from '../../data/masteries';

// SANCTUAIRE — un héros à la fois, une ligne par amélioration.
export function Sanctuary({ uid }: { uid?: string }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const { defaultUid } = useHeroOrder();
  const [sel, setSel] = useState<string | undefined>(uid && save.heroes.some((h) => h.uid === uid) ? uid : defaultUid);
  const h = save.heroes.find((x) => x.uid === sel) ?? save.heroes[0];
  if (!h) return <Screen title="Sanctuaire"><p className="muted">Aucun héros.</p></Screen>;
  const d = HERO_BY_ID[h.heroId];
  const cap = maxLevelForRank(h.rank);
  const toCap = elixirsToCap(h);
  const [maxAsk, setMaxAsk] = useState(false);
  const one = elixirPreview(save, h, 1);
  const all = elixirPreview(save, h, toCap);

  const run = (fn: (s: typeof save) => Check, okMsg: string) => {
    let c: Check = { ok: false, cost: {} };
    mutate((s) => { c = fn(s); });
    if (c.ok) { play('rare'); toast(okMsg, 'ok'); } else toast(c.reason ?? 'Impossible.', 'error');
  };
  const elixir = (n: number) => {
    let r: ReturnType<typeof applyElixirs> = { used: 0, levels: 0 };
    mutate((s) => { r = applyElixirs(s, h.uid, n); });
    if (r.used) { play('claim'); toast(r.levels ? `+${r.levels} niveau(x)` : `+${r.used} élixir(s)`, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const skillMax = d.skills.reduce((a, s) => a + s.upgrades.length + 1, 0);
  const skillNow = d.skills.reduce((a, s) => a + (h.skillLevels[s.id] ?? 1), 0);
  const skillReady = d.skills.some((s) => skillCheck(save, h, s.id).ok);

  const [tab, setTab] = useState<'level' | 'rank' | 'ascend' | 'skills' | 'mastery'>('level');
  const TABS = [
    { id: 'level', label: 'Niveau', dot: !!toCap && save.resources.xpElixir > 0 },
    { id: 'rank', label: 'Rang', dot: rankUpCheck(save, h).ok },
    { id: 'ascend', label: 'Ascension', dot: ascendCheck(save, h).ok || awakenCheck(save, h).ok },
    { id: 'skills', label: 'Compétences', dot: skillReady },
    { id: 'mastery', label: 'Maîtrises', dot: canLearnAny(save, h) },
  ] as const;
  // Les Maîtrises n'apparaissent qu'une fois un héros au niveau 20 (avant, la page ne servirait à rien).
  const masteryOpen = save.heroes.some((x) => x.level >= MASTERY_TIERS[1].minLevel || (x.masteries?.length ?? 0) > 0);
  const tabs = TABS.filter((t) => t.id !== 'mastery' || masteryOpen);

  return (
    <Screen title="Sanctuaire" bg={<PlaceAmbient place="sanctuary" />}>
      <Coach id="sanct_level" target=".upg-line .ul-act" text="Les élixirs font monter le niveau : « Max » utilise tout ce qu’il faut." />
      <HeroStrip selected={h.uid} onSelect={setSel} dot={canImprove} />

      <button className="sanct-focus" onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })} aria-label={`Fiche de ${d.name}`}>
        <div className="sf-art" style={{ ['--rc' as string]: RARITIES[d.rarity].color }}><HeroArt heroId={d.id} kind="portrait" /></div>
        <div className="sf-name">{d.name}</div>
        <div className="sf-power">Niv. <b>{h.level}</b>/{cap} · Puissance <b>{fmt(powerOf(heroTotalStats(save, h).total))}</b></div>
      </button>

      {/* Pages du Sanctuaire (comme une taverne) : une amélioration par page. */}
      <div className="seg sanct-tabs" style={{ marginBottom: 10 }}>
        {tabs.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={(e) => { setTab(t.id); e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center' }); }}>{t.label}{t.dot && <span className="seg-dot" />}</button>)}
      </div>

      {tab === 'level' && (
        <>
          <Wallet ids={['xpElixir', 'gold']} cols={2} />
          <div className="upg-list">
            <UpRow icon={<ResourceIcon icon="flask" color="#9bdc6a" size={20} />} label="Élixirs" value={`${h.level}/${cap}`}
              sub={h.level < cap ? <span>{save.resources.xpElixir} élixir(s) · +1 : {fmt(BALANCE.upgrades.elixirGoldPerLevel * h.level)} or</span> : <span>Niveau maximum du rang : monte de rang</span>}>
              <button className="btn secondary small" disabled={!one.used} onClick={() => elixir(1)}>+1</button>
              <button className="btn small" disabled={!all.used} onClick={() => setMaxAsk(true)}>Max</button>
            </UpRow>
            {h.level < cap && all.used > 0 && (
              <div className="elx-cost">
                <span>Max : niv. <b>{all.from}</b> → <b>{all.to}</b></span>
                <span><ResourceIcon icon="flask" color="#9bdc6a" size={15} /> {all.used} · <ResourceIcon icon="coin" size={15} /> {fmt(all.gold)}</span>
              </div>
            )}
          </div>
          <FeedPanel targetUid={h.uid} />
          {maxAsk && (
            <Modal onClose={() => setMaxAsk(false)}>
              <h2>Monter au maximum ?</h2>
              <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
                {d.name.split(/[ ,]/)[0]} passe du niveau <b>{all.from}</b> au niveau <b>{all.to}</b>{all.to < cap ? ` (le maximum du rang est ${cap})` : ''}.
              </p>
              <div className="elx-bill">
                <div><ResourceIcon icon="flask" color="#9bdc6a" size={22} /><span>Élixirs d’expérience</span><b>{all.used}</b><small>sur {save.resources.xpElixir}</small></div>
                <div><ResourceIcon icon="coin" size={22} /><span>Or</span><b>{all.gold.toLocaleString('fr-FR')}</b><small>sur {save.resources.gold.toLocaleString('fr-FR')}</small></div>
              </div>
              {all.limit && <p className="hint" style={{ marginTop: 8 }}>{all.limit === 'elixirs' ? 'Pas assez d’élixirs pour aller jusqu’au bout : ' : 'Pas assez d’or pour aller jusqu’au bout : '}on s’arrête au niveau {all.to}.</p>}
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button className="btn secondary grow" onClick={() => setMaxAsk(false)}>Annuler</button>
                <button className="btn grow" onClick={() => { setMaxAsk(false); elixir(all.used); }}>Utiliser</button>
              </div>
            </Modal>
          )}
        </>
      )}
      {tab === 'rank' && (
        <>
          <Wallet ids={['rankSigil', 'gold']} cols={2} />
          <div className="upg-list">
            <CheckRow icon={<ResourceIcon icon="sigil" color="#ffd48a" size={20} />} label="Rang" value={`${h.rank}/${BALANCE.hero.maxRank}`} check={rankUpCheck(save, h)} max={h.rank >= BALANCE.hero.maxRank}
              heroId={h.heroId} onGo={() => run((s) => rankUp(s, h.uid), `Rang ${h.rank + 1} !`)} />
          </div>
          <p className="faint">Chaque rang relève le niveau maximum de {BALANCE.hero.levelsPerRank} niveaux et renforce le héros.</p>
        </>
      )}
      {tab === 'ascend' && (
        <>
          <Wallet ids={['potionMinor', 'potionGreater', 'potionSupreme', 'awakenEssence', 'gold']} cols={5} />
          <div className="upg-list">
            <CheckRow icon={<ResourceIcon icon="potion" color="#6fa8ff" size={20} />} label="Ascension" value={`${h.ascension}/${BALANCE.hero.maxAscension}`} check={ascendCheck(save, h)} max={h.ascension >= BALANCE.hero.maxAscension}
              heroId={h.heroId} onGo={() => run((s) => ascend(s, h.uid), `Ascension ${h.ascension + 1} !`)} />
            <CheckRow icon={<ResourceIcon icon="essence" color="#ff9bb5" size={20} />} label="Éveil" value={`${h.awaken}/${BALANCE.hero.maxAwaken}`} check={awakenCheck(save, h)} max={h.awaken >= BALANCE.hero.maxAwaken}
              heroId={h.heroId} onGo={() => run((s) => awaken(s, h.uid), `Éveil ${h.awaken + 1} !`)} />
          </div>
          <p className="faint">L’éveil demande un doublon du héros (obtenu en l’invoquant à nouveau).</p>
        </>
      )}
      {tab === 'mastery' && (
        <>
          <Wallet ids={['masteryScroll', 'gold']} cols={2} />
          <div style={{ marginTop: 8 }}><MasteryPanel h={h} /></div>
        </>
      )}

      {tab === 'skills' && (
        <>
          <Wallet ids={['skillTome', 'gold']} cols={2} />
          <div className="faint" style={{ margin: '0 0 6px' }}>Compétences {skillNow}/{skillMax}</div>
          <HeroUpgrade h={h} section="skills" />
        </>
      )}
    </Screen>
  );
}

function UpRow({ icon, label, value, sub, dot, children }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode; dot?: boolean; children?: React.ReactNode }) {
  return (
    <div className="upg-line">
      <span className="ul-ic">{icon}{dot && <span className="badge-dot" style={{ top: -2, right: -2 }} />}</span>
      <div className="ul-txt">
        <div><b>{label}</b> <span className="ul-val">{value}</span></div>
        {sub && <div className="ul-sub">{sub}</div>}
      </div>
      <div className="ul-act">{children}</div>
    </div>
  );
}

function CheckRow({ icon, label, value, check, max, heroId, onGo }: { icon: React.ReactNode; label: string; value: string; check: Check; max: boolean; heroId: string; onGo: () => void }) {
  const save = useGame((s) => s.save)!;
  const blocked = !check.ok && !!check.reason && !check.reason.includes('insuffisant');
  return (
    <UpRow icon={icon} label={label} value={value} dot={check.ok}
      sub={max ? <span>Maximum atteint</span> : blocked ? <span>{check.reason}</span> : <CostView cost={check.cost} save={save} heroId={heroId} />}>
      {max ? <span className="chip active">Max</span> : blocked ? <span className="ul-lock" aria-label="Verrouillé"><Icon.lock size={16} /></span> : <button className="btn small" disabled={!check.ok} onClick={onGo}>Monter</button>}
    </UpRow>
  );
}

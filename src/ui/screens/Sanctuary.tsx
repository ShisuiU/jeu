import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { BALANCE } from '../../data/balance';
import { RARITIES } from '../../data/rarities';
import { maxLevelForRank, powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';
import { ascend, ascendCheck, awaken, awakenCheck, canImprove, elixirsToCap, rankUp, rankUpCheck, skillCheck, useElixirs as applyElixirs, type Check } from '../../game/upgrade';
import { play } from '../../audio/sfx';
import { Modal, Screen, fmt } from '../components/common';
import { CostView } from '../components/Cost';
import { HeroStrip, useHeroOrder } from '../components/HeroStrip';
import { HeroArt } from '../art/HeroArt';
import { Icon, ResourceIcon } from '../art/Icons';
import { PlaceAmbient } from '../art/PlaceScene';
import { HeroUpgrade } from './HeroUpgrade';
import { Wallet } from '../components/Wallet';

// SANCTUAIRE — un héros à la fois, une ligne par amélioration.
export function Sanctuary({ uid }: { uid?: string }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const { defaultUid } = useHeroOrder();
  const [sel, setSel] = useState<string | undefined>(uid && save.heroes.some((h) => h.uid === uid) ? uid : defaultUid);
  const [skills, setSkills] = useState(false);
  const h = save.heroes.find((x) => x.uid === sel) ?? save.heroes[0];
  if (!h) return <Screen title="Sanctuaire"><p className="muted">Aucun héros.</p></Screen>;
  const d = HERO_BY_ID[h.heroId];
  const cap = maxLevelForRank(h.rank);
  const toCap = elixirsToCap(h);

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

  return (
    <Screen title="Sanctuaire" bg={<PlaceAmbient place="sanctuary" />}>
      <Wallet ids={['gold', 'xpElixir', 'rankSigil', 'skillTome', 'potionMinor', 'potionGreater', 'potionSupreme', 'awakenEssence']} />
      <HeroStrip selected={h.uid} onSelect={setSel} dot={canImprove} />

      <button className="sanct-focus" onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })} aria-label={`Fiche de ${d.name}`}>
        <div className="sf-art" style={{ ['--rc' as string]: RARITIES[d.rarity].color }}><HeroArt heroId={d.id} kind="portrait" /></div>
        <div className="sf-name">{d.name}</div>
        <div className="sf-power">Puissance <b>{fmt(powerOf(heroTotalStats(save, h).total))}</b></div>
      </button>

      <div className="upg-list">
        <UpRow icon={<ResourceIcon icon="flask" color="#9bdc6a" size={20} />} label="Niveau" value={`${h.level}/${cap}`}
          sub={h.level < cap ? <span>{save.resources.xpElixir} élixir(s)</span> : <span>Plafond du rang : montez de rang</span>}>
          <button className="btn secondary small" disabled={!toCap || !save.resources.xpElixir} onClick={() => elixir(1)}>+1</button>
          <button className="btn small" disabled={!toCap || !save.resources.xpElixir} onClick={() => elixir(toCap)}>Max</button>
        </UpRow>
        <CheckRow icon={<ResourceIcon icon="sigil" color="#ffd48a" size={20} />} label="Rang" value={`${h.rank}/${BALANCE.hero.maxRank}`} check={rankUpCheck(save, h)} max={h.rank >= BALANCE.hero.maxRank}
          heroId={h.heroId} onGo={() => run((s) => rankUp(s, h.uid), `Rang ${h.rank + 1} !`)} />
        <CheckRow icon={<ResourceIcon icon="potion" color="#6fa8ff" size={20} />} label="Ascension" value={`${h.ascension}/${BALANCE.hero.maxAscension}`} check={ascendCheck(save, h)} max={h.ascension >= BALANCE.hero.maxAscension}
          heroId={h.heroId} onGo={() => run((s) => ascend(s, h.uid), `Ascension ${h.ascension + 1} !`)} />
        <CheckRow icon={<ResourceIcon icon="essence" color="#ff9bb5" size={20} />} label="Éveil" value={`${h.awaken}/${BALANCE.hero.maxAwaken}`} check={awakenCheck(save, h)} max={h.awaken >= BALANCE.hero.maxAwaken}
          heroId={h.heroId} onGo={() => run((s) => awaken(s, h.uid), `Éveil ${h.awaken + 1} !`)} />
        <UpRow icon={<Icon.book size={20} />} label="Compétences" value={`${skillNow}/${skillMax}`} dot={skillReady}
          sub={<span>{skillReady ? 'Amélioration possible' : 'Grimoires de compétence'}</span>}>
          <button className="btn secondary small" onClick={() => setSkills(true)}>Voir</button>
        </UpRow>
      </div>

      {skills && (
        <Modal onClose={() => setSkills(false)}>
          <h2>Compétences · {d.name.split(' ')[0]}</h2>
          <Wallet ids={['skillTome', 'gold']} cols={2} />
          <HeroUpgrade h={h} section="skills" />
          <button className="btn secondary block" style={{ marginTop: 10 }} onClick={() => setSkills(false)}>Fermer</button>
        </Modal>
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

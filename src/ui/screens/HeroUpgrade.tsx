import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { BALANCE } from '../../data/balance';
import type { HeroInstance } from '../../save/schema';
import { maxLevelForRank } from '../../game/stats';
import { heroXpToNext } from '../../game/progression';
import { ascend, ascendCheck, awaken, awakenCheck, elixirPreview, elixirsToCap, rankUp, rankUpCheck, skillCheck, upgradeSkill, useElixirs as applyElixirs, type Check } from '../../game/upgrade';
import { play } from '../../audio/sfx';
import { Panel, fmt } from '../components/common';
import { CostView } from '../components/Cost';
import { ResourceIcon } from '../art/Icons';

const SLOT_TAG = { basic: 'Base', special: 'Spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

export type UpgradeSection = 'level' | 'power' | 'skills';

export function HeroUpgrade({ h, section }: { h: HeroInstance; section?: UpgradeSection }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
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
    if (r.used) { play('claim'); toast(`${r.used} élixir(s) utilisé(s)${r.levels ? ` · +${r.levels} niveau(x)` : ''}.`, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error');
  };

  const rank = rankUpCheck(save, h);
  const asc = ascendCheck(save, h);
  const awk = awakenCheck(save, h);

  const show = (x: UpgradeSection) => !section || section === x;
  return (
    <>
      {show('level') && <>
      <Panel title="Niveau">
        <div className="row between"><span>Niveau <b style={{ color: 'var(--gold-hi)' }}>{h.level}</b> / {cap}</span><span className="faint">{h.level < cap ? `XP ${h.xp} / ${heroXpToNext(h.level)}` : 'Plafond du rang'}</span></div>
        <div className="progress" style={{ margin: '6px 0 10px' }}><div style={{ width: `${h.level < cap ? (h.xp / heroXpToNext(h.level)) * 100 : 100}%` }} /></div>
        <div className="row between">
          <span className="row" style={{ gap: 6 }}><ResourceIcon icon="flask" color="#9bdc6a" size={18} /> {save.resources.xpElixir} élixirs <span className="faint">(+{BALANCE.upgrades.elixirXp} XP, {fmt(BALANCE.upgrades.elixirGoldPerLevel * h.level)} or)</span></span>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="btn secondary small grow" disabled={!toCap || !save.resources.xpElixir} onClick={() => elixir(1)}>+1 élixir</button>
          <button className="btn small grow" disabled={!toCap || !save.resources.xpElixir} onClick={() => elixir(toCap)}>{(() => { const p = elixirPreview(save, h, toCap); return `Max : niv. ${p.to} · ${p.used} élixir${p.used > 1 ? 's' : ''} · ${fmt(p.gold)} or`; })()}</button>
        </div>
      </Panel>

      <Panel title={`Rang ${h.rank} / ${BALANCE.hero.maxRank}`}>
        <p className="faint" style={{ marginTop: 0 }}>Chaque rang ajoute 10 niveaux maximum et +{Math.round(BALANCE.hero.rankBonus * 100)} % aux statistiques.</p>
        <UpgradeRow check={rank} label={h.rank < BALANCE.hero.maxRank ? `Passer au rang ${h.rank + 1}` : 'Rang maximum'} onClick={() => run((s) => rankUp(s, h.uid), `Rang ${h.rank + 1} atteint ! Niveau max : ${maxLevelForRank(h.rank + 1)}.`)} save={save} heroId={h.heroId} />
      </Panel>

      </>}
      {show('power') && <>
      <Panel title={`Ascension ${h.ascension} / ${BALANCE.hero.maxAscension}`}>
        <p className="faint" style={{ marginTop: 0 }}>+{Math.round(BALANCE.hero.ascensionBonus * 100)} % aux stats, +2 VIT, +1 % critique, +3 PRÉ et RÉS par palier.</p>
        <UpgradeRow check={asc} label={h.ascension < BALANCE.hero.maxAscension ? `Ascension ${h.ascension + 1}` : 'Ascension maximale'} onClick={() => run((s) => ascend(s, h.uid), `Ascension ${h.ascension + 1} !`)} save={save} heroId={h.heroId} />
      </Panel>

      <Panel title={`Éveil ${h.awaken} / ${BALANCE.hero.maxAwaken}`}>
        <p className="faint" style={{ marginTop: 0 }}>Réservé aux héros avancés : +{Math.round(BALANCE.hero.awakenBonus * 100)} % aux stats, +2 VIT, +5 % dégâts critiques par niveau. Coûte 1 doublon du héros (obtenu en l’invoquant à nouveau).</p>
        <UpgradeRow check={awk} label={h.awaken < BALANCE.hero.maxAwaken ? `Éveil ${h.awaken + 1}` : 'Éveil maximal'} onClick={() => run((s) => awaken(s, h.uid), `Éveil ${h.awaken + 1} !`)} save={save} heroId={h.heroId} />
      </Panel>

      </>}
      {show('skills') && <Panel title="Compétences">
        {d.skills.map((sk) => {
          const lv = h.skillLevels[sk.id] ?? 1;
          const max = sk.upgrades.length + 1;
          const c = skillCheck(save, h, sk.id);
          return (
            <div key={sk.id} className="upg-row" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <b>{sk.name}</b> <span className="faint">· {SLOT_TAG[sk.slot]} · niv. {lv}/{max}</span>
                {lv < max && <div className="faint">Prochain : {sk.upgrades[lv - 1]}</div>}
                {lv < max && <CostView cost={c.cost} save={save} />}
              </div>
              {lv < max ? <button className="btn small" disabled={!c.ok} onClick={() => run((s) => upgradeSkill(s, h.uid, sk.id), `${sk.name} niveau ${lv + 1} !`)}>Améliorer</button> : <span className="chip active">Max</span>}
            </div>
          );
        })}
      </Panel>}
    </>
  );
}

function UpgradeRow({ check, label, onClick, save, heroId }: { check: Check; label: string; onClick: () => void; save: ReturnType<typeof useGame.getState>['save'] & object; heroId: string }) {
  const empty = Object.keys(check.cost).length === 0;
  return (
    <div className="upg-row">
      <div className="grow">
        <b>{label}</b>
        {!empty && <div><CostView cost={check.cost} save={save} heroId={heroId} /></div>}
        {check.reason && <div className="faint" style={{ color: '#ff9b9b' }}>{check.reason}</div>}
      </div>
      {!empty && <button className="btn small" disabled={!check.ok} onClick={onClick}>Valider</button>}
    </div>
  );
}

import type { SkillDef } from '../../data/types';
import { HERO_BY_ID } from '../../data/heroes';
import { targetKind } from '../../game/battle/engine';
import { effectiveCooldown } from '../../game/battle/skillMods';
import { STATUS_INFO, type Unit } from '../../game/battle/types';
import { groupStatuses, statusDescription, statusValueText, STATUS_LEGEND } from '../../game/battle/statusText';
import { SIGNATURES } from '../../data/signatures';
import { AFFINITIES } from '../../data/affinities';
import { act3Of } from '../../data/bossActs';
import { AffinityIcon } from '../art/Identity';
import { StatusIcon } from '../art/StatusIcon';
import { Modal } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { shortName } from './UnitView';

// Extrait de Battle.tsx (v1.98.0).
export const SLOT_TAG = { basic: 'Base', special: 'Spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

export function SkillInfoBody({ unit, sk, onLaunch }: { unit: Unit; sk: SkillDef; onLaunch?: () => void }) {
  const tk = targetKind(sk);
  return (
    <>
      <div className="si-head">
        <span><b>{shortName(unit.name)}</b> · {sk.name}</span>
        {onLaunch ? <button className="btn small" style={{ minHeight: 28 }} onClick={onLaunch}>Lancer</button>
          : <span className="hint-target">{tk === 'ally' ? '▸ un allié' : tk === 'none' ? '▸ automatique' : '▸ un ennemi'}</span>}
      </div>
      <div className="si-meta">{SLOT_TAG[sk.slot]} · {sk.cooldown ? `recharge ${effectiveCooldown(sk, unit.skillLevels[sk.id] ?? 1)} tours` : 'utilisable à chaque tour'}</div>
      <div className="desc">{sk.description}</div>
    </>
  );
}

/** Effets en cours, listés sous la carte avec leur valeur : néfastes d'abord (rouge), puis bénéfiques (vert), et les tours restants. */
/** Récap de fin de combat : part des dégâts infligés par chaque héros (du plus gros au plus petit). */
/** Héros du combat : part des dégâts (et, après une victoire, niveau et expérience gagnée) en une seule liste. */
export function DamageRecap({ units, xp }: { units: Unit[]; xp?: { uid: string; heroId: string; xp: number; levelsGained: number; capped: boolean; level: number }[] }) {
  const heroes = units.filter((u) => u.side === 'ally' && u.kind === 'hero');
  const total = heroes.reduce((n, u) => n + (u.flags.dmgDealt ?? 0), 0);
  if (!total && !xp?.length) return null;
  const rows = [...heroes].sort((a, b) => (b.flags.dmgDealt ?? 0) - (a.flags.dmgDealt ?? 0));
  const top = rows[0].flags.dmgDealt ?? 0;
  const fmt = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)} k` : n.toLocaleString('fr-FR'));
  return (
    <div className="dmg-recap">
      <div className="dr-title">{xp ? 'Tes héros' : 'Dégâts infligés'}</div>
      {rows.map((u, i) => {
        const d = u.flags.dmgDealt ?? 0;
        const pct = total ? Math.round((d / total) * 100) : 0;
        const x = xp?.find((h) => h.uid === u.heroUid);
        return (
          <div key={u.id} className={`dr-row ${i === 0 ? 'mvp' : ''}`}>
            <div className="xp-ava"><HeroArt heroId={u.refId} /></div>
            <div className="grow">
              <div className="row between"><b>{HERO_BY_ID[u.refId]?.name.split(/[ ,]/)[0] ?? u.name}{i === 0 && <span className="dr-mvp">Meilleur</span>}</b><span className="dr-pct">{pct} %</span></div>
              <div className="dr-bar"><div style={{ width: `${top ? (d / top) * 100 : 0}%`, animationDelay: `${0.15 + i * 0.12}s` }} /></div>
              {x && <div className="dr-xp"><span className={x.levelsGained ? 'lvlup' : ''}>{x.levelsGained ? `Niv. ${x.level} ▲` : x.capped ? 'Niveau max' : `Niv. ${x.level}`}</span><span>+{x.xp} XP</span></div>}
            </div>
            <span className="faint dr-val">{fmt(d)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Fiche d'une unité en combat (appui long) : statistiques, mécaniques du boss, effets en cours. */
export function UnitInfo({ u, mechanics, onClose }: { u: Unit; mechanics: boolean; onClose: () => void }) {
  const list = [...u.statuses].sort((a, b) => Number(STATUS_INFO[b.status].debuff) - Number(STATUS_INFO[a.status].debuff));
  return (
    <div className="unit-info-backdrop" onClick={() => onClose()}>
      <div className={`unit-info ${u.side}`} role="dialog" aria-label={u.name}>
        <div className="ui-head"><b>{u.name}</b><span className="faint">Niv. {u.level}</span></div>
        {u.kind === 'hero' && SIGNATURES[u.refId] && <div className="ui-sig"><b>★ {SIGNATURES[u.refId].name}</b> : {SIGNATURES[u.refId].text}</div>}
        <div className="ui-aff"><AffinityIcon id={u.affinity} size={16} /> {AFFINITIES[u.affinity].name}{AFFINITIES[u.affinity].strongAgainst ? ` · fort contre ${AFFINITIES[AFFINITIES[u.affinity].strongAgainst!].name}` : ' · neutre'}</div>
        <div className="ui-hp"><span>PV</span><b>{Math.max(0, Math.round(u.hp))} / {Math.round(u.base.hp)}</b></div>
        <div className="ui-stats"><span>ATQ <b>{Math.round(u.base.atk)}</b></span><span>DÉF <b>{Math.round(u.base.def)}</b></span><span>VIT <b>{Math.round(u.base.spd)}</b></span></div>
        {u.isBoss && u.side === 'enemy' && u.flags.fractureMax > 0 && <div className="ui-boss"><div><b>Fracture</b> {u.flags.fractured ? '· brisée' : `· ${u.flags.fracture}/${u.flags.fractureMax}`} : chaque coup use la jauge (beaucoup plus avec l’affinité avantagée ▲). À zéro, le boss perd un tour et subit +40 % de dégâts pendant 2 de ses tours.</div></div>}
        {u.isBoss && (u.flags.carapaceMax > 0 || mechanics) && (
          <div className="ui-boss">
            {u.flags.carapaceMax > 0 && <div><b>Carapace</b> {u.flags.carapace > 0 ? `· ${u.flags.carapace} charge${u.flags.carapace > 1 ? 's' : ''}` : '· brisée'} : −30 % de dégâts, chaque coup retire une charge. Brisée, le boss perd 30 % de DÉF pendant 2 tours ; elle se reforme 8 tours plus tard. Les attaques à plusieurs coups la brisent vite.</div>}
            <div><b>{u.flags.enraged ? 'Acte II' : 'Acte II à 50 %'}</b> : sous la moitié de ses PV, le boss gagne +30 % d’ATQ, se purifie de ses effets négatifs, se protège d’un bouclier et recharge son ultime.</div>
            {u.flags.acts === 3 && <div><b style={{ color: act3Of(u.affinity).color }}>{u.flags.act3 ? 'Dernier acte' : 'Dernier acte à 25 %'} · {act3Of(u.affinity).name}</b> : le boss {act3Of(u.affinity).text}.</div>}
          </div>
        )}
        {list.length === 0 ? <p className="faint" style={{ margin: '8px 0 0' }}>Aucun effet en cours.</p> : (
          <div className="ui-status">
            {groupStatuses(list).sort((a, b) => Number(STATUS_INFO[b.id].debuff) - Number(STATUS_INFO[a.id].debuff)).map((g) => (
              <div key={g.id} className="ui-st">
                <StatusIcon id={g.id} size={20} />
                <span className="grow"><b className={STATUS_INFO[g.id].debuff ? 'neg' : 'pos'}>{STATUS_INFO[g.id].name}{statusValueText(g, u.isBoss) ? ` ${statusValueText(g, u.isBoss)}` : ''}</b><br /><span className="faint">{statusDescription(g, u.isBoss)}</span></span>
                <span className="faint">{g.turns} tour{g.turns > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
        <p className="faint" style={{ margin: '10px 0 0', textAlign: 'center' }}>Touche pour fermer</p>
      </div>
    </div>
  );
}

/** Légende des effets de combat. */
export function EffectsLegend({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={() => onClose()}>
      <h2>Effets en combat</h2>
      <p className="faint" style={{ textAlign: 'center', margin: '0 0 8px' }}>Sous chaque carte : symbole, valeur, puis tours restants. Vert = bonus, rouge = malus.</p>
      <div className="fx-legend">
        {STATUS_LEGEND.map(({ id, text }, i) => (
          <div key={id} className={`fxl-row ${STATUS_INFO[id].debuff ? 'neg' : 'pos'} ${i === 6 ? 'sep' : ''}`}>
            <span className="fxl-ico"><StatusIcon id={id} size={22} /></span>
            <span>{text}</span>
          </div>
        ))}
      </div>
      <button className="btn grow" style={{ width: '100%', marginTop: 10 }} onClick={() => onClose()}>Compris</button>
    </Modal>
  );
}

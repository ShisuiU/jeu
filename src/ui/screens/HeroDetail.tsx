import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { ROLES } from '../../data/roles';
import { AFFINITIES } from '../../data/affinities';
import { RARITIES } from '../../data/rarities';
import { BALANCE } from '../../data/balance';
import { computeStats, maxLevelForRank, powerOf, STAT_LABELS, STAT_ORDER } from '../../game/stats';
import { Disclosure, Panel, RarityTag, Screen, Stars, fmt } from '../components/common';
import { HeroArt, hasRealArt } from '../art/HeroArt';
import { FactionEmblem } from '../art/FactionEmblem';
import { Icon } from '../art/Icons';
import { heroXpToNext } from '../../game/progression';
import { heroTotalStats } from '../../game/heroStats';
import { summonWithFragments } from '../../game/summon';
import { HeroGear } from './HeroUpgrade';
import { canImprove } from '../../game/upgrade';
import { useState } from 'react';

const SLOT_LABEL = { basic: 'Attaque de base', special: 'Compétence spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

export function HeroDetail({ uid, heroId }: { uid?: string; heroId: string }) {
  const save = useGame((s) => s.save)!;
  const setProfile = useGame((s) => s.setProfile);
  const toggleLock = useGame((s) => s.toggleHeroLock);
  const toast = useUI((s) => s.toast);
  const mutate = useGame((s) => s.mutate);
  const [tab, setTab] = useState<'info' | 'gear'>('info');
  const push = useUI((s) => s.push);
  const d = HERO_BY_ID[heroId];
  const inst = uid ? save.heroes.find((h) => h.uid === uid) : undefined;
  const rar = RARITIES[d.rarity];
  const progress = inst ?? { level: 1, rank: rar.startRank, ascension: 0, awaken: 0 };
  const full = inst ? heroTotalStats(save, inst) : null;
  const stats = full ? full.total : computeStats(d, progress);
  const fragments = save.heroFragments[d.id] ?? 0;
  const fragNeed = rar.fragmentsToSummon;
  const f = FACTIONS[d.faction];
  const aff = AFFINITIES[d.affinity];
  const maxLv = maxLevelForRank(progress.rank);

  return (
    <Screen title={d.name} right={inst && (
      <button className="back-btn" aria-label={inst.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={() => { toggleLock(inst.uid); toast(inst.locked ? 'Héros déverrouillé.' : 'Héros verrouillé : il ne pourra pas être sacrifié par erreur.'); }}>
        {inst.locked ? <Icon.lock /> : <Icon.unlock />}
      </button>
    )}>
      <div className="hero-sheet-art">
        <HeroArt heroId={d.id} kind="full" position="center 15%" />
        <div className="shade" />
      </div>
      <div className="hero-sheet-head">
        <div className="title-line">{d.title}</div>
        <h2>{d.name}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}><Stars rarity={d.rarity} /></div>
        <div className="tag-row">
          <RarityTag rarity={d.rarity} />
          <span className="chip"><FactionEmblem id={d.faction} size={14} />{f.short}</span>
          <span className="chip">{ROLES[d.role].name}</span>
          <span className="chip" style={{ color: aff.color }}>{aff.name}</span>
        </div>
        <p className="quote">{d.quote.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»')}</p>
      </div>

      {inst && (
        <div className="seg" style={{ margin: '4px 0 12px' }}>
          <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>Infos</button>
          <button className={tab === 'gear' ? 'on' : ''} onClick={() => setTab('gear')}>Équipement</button>
        </div>
      )}
      {!inst && (
        <Panel title="Fragments">
          <div className="row between"><span>{fragments} / {fragNeed} fragments</span><span className="faint">Doublons d’invocation</span></div>
          <div className="progress" style={{ margin: '6px 0 10px' }}><div style={{ width: `${Math.min(100, (fragments / fragNeed) * 100)}%` }} /></div>
          <button className="btn block" disabled={fragments < fragNeed} onClick={() => { let ok = false; mutate((st) => { ok = summonWithFragments(st, d.id, Date.now()); }); if (ok) toast(`${d.name} rejoint vos Héritiers !`, 'ok'); }}>Invoquer avec les fragments</button>
          <p className="faint">Ce héros s’obtient aussi par les invocations ({rar.name}).</p>
        </Panel>
      )}
      {inst && tab === 'gear' && <HeroGear h={inst} />}
      {(tab === 'info' || !inst) && <>

      <Panel title={inst ? 'Progression' : 'Non obtenu : statistiques de base'}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span>Niveau <b style={{ color: 'var(--gold-hi)' }}>{progress.level}</b> / {maxLv}</span>
          <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(powerOf(stats))}</b></span>
        </div>
        <div className="progress"><div style={{ width: `${inst && progress.level < maxLv ? (inst.xp / heroXpToNext(inst.level)) * 100 : 100}%` }} /></div>
        {inst && <div className="faint" style={{ marginTop: 4 }}>{progress.level < maxLv ? `XP ${inst.xp} / ${heroXpToNext(inst.level)}` : 'Niveau maximum du rang atteint. Augmentez le rang au Sanctuaire.'}</div>}
        <div className="row between wrap" style={{ marginTop: 10, fontSize: 13 }}>
          <span>Rang <b>{progress.rank}</b>/{BALANCE.hero.maxRank}</span>
          <span>Ascension <b>{progress.ascension}</b>/{BALANCE.hero.maxAscension}</span>
          <span>Éveil <b>{progress.awaken}</b>/{BALANCE.hero.maxAwaken}</span>
        </div>
        {inst && (
          <button className="btn block sanct-cta" style={{ marginTop: 12 }} onClick={() => push({ name: 'sanctuary', uid: inst.uid })}>
            <Icon.temple size={18} /> Améliorer au Sanctuaire
            {canImprove(save, inst) && <span className="badge-dot" style={{ top: -3, right: -3 }} />}
          </button>
        )}
      </Panel>

      <Panel title="Statistiques">
        <div className="stat-grid">
          {STAT_ORDER.map((k) => (
            <div key={k} className="stat-row"><span className="muted">{STAT_LABELS[k].long}</span><b>{fmt(stats[k])}{STAT_LABELS[k].pct ? ' %' : ''}{full && stats[k] !== full.base[k] && <small style={{ color: '#7bea8f', marginLeft: 4 }}>(+{fmt(Math.round((stats[k] - full.base[k]) * 10) / 10)})</small>}</b></div>
          ))}
        </div>
      </Panel>

      <Disclosure title="Compétences" summary={`${d.skills.length} compétences${d.leaderSkill ? ' · aura de chef' : ''}`}>
        {d.skills.map((s, i) => (
          <div key={s.id} className="skill">
            <div className="skill-icon" style={{ ['--sc' as string]: s.slot === 'ultimate' ? rar.color : s.slot === 'passive' ? '#3b3350' : f.colors.primary }}>{s.slot === 'passive' ? 'P' : i + 1}</div>
            <div className="grow">
              <div className="row between">
                <span className="skill-name">{s.name}</span>
                <span className="faint">{s.cooldown > 0 ? `Recharge ${s.cooldown} t.` : s.slot === 'passive' ? 'Permanent' : 'Chaque tour'}</span>
              </div>
              <div className="skill-tag">{SLOT_LABEL[s.slot]}{inst ? ` · Niv. ${inst.skillLevels[s.id] ?? 1}/${s.upgrades.length + 1}` : ''}</div>
              <div className="skill-desc">{s.description}</div>
              {s.upgrades.length > 0 && <div className="faint" style={{ marginTop: 4 }}>Améliorations : {s.upgrades.join(' · ')}</div>}
            </div>
          </div>
        ))}
        {d.leaderSkill && (
          <div className="hint" style={{ marginTop: 10 }}><b style={{ color: 'var(--gold-hi)' }}>Aura de chef :</b> {d.leaderSkill.description}</div>
        )}
      </Disclosure>

      <Disclosure title="Histoire" summary={`${f.short} · faction et apparence`}>
        <div className="lore"><p>{d.lore}</p></div>
        <div className="panel-title" style={{ marginTop: 14 }}>Faction</div>
        <div className="lore"><p><b>{f.name}</b> : {f.synergy}</p></div>
        <div className="panel-title" style={{ marginTop: 14 }}>Apparence</div>
        <div className="lore"><p className="muted">{d.look}</p></div>
        {!hasRealArt(d.id) && <p className="faint">Illustration définitive en cours de création, portrait provisoire affiché.</p>}
      </Disclosure>

      {inst && (
        <button className="btn secondary block" style={{ marginTop: 14 }} disabled={save.profile.avatarHeroId === d.id}
          onClick={() => { setProfile({ avatarHeroId: d.id }); toast(`${d.name} est maintenant votre avatar.`, 'ok'); }}>
          {save.profile.avatarHeroId === d.id ? 'Avatar actuel' : 'Choisir comme avatar'}
        </button>
      )}
      </>}
    </Screen>
  );
}

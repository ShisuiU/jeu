import { SIGNATURES } from '../../data/signatures';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import { BALANCE } from '../../data/balance';
import { computeStats, maxLevelForRank, powerOf, STAT_LABELS, STAT_ORDER } from '../../game/stats';
import { Disclosure, Screen, fmt } from '../components/common';
import { IdentityStrip } from '../art/Identity';
import { Icon, StatIcon } from '../art/Icons';
import { heroXpToNext } from '../../game/progression';
import { heroTotalStats } from '../../game/heroStats';
import { CopiesCard } from '../components/Copies';
import { HeroShowcase } from '../components/HeroShowcase';
import { canImprove } from '../../game/upgrade';

const SLOT_LABEL = { basic: 'Attaque de base', special: 'Compétence spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

export function HeroDetail({ uid, heroId }: { uid?: string; heroId: string }) {
  const save = useGame((s) => s.save)!;
  const setProfile = useGame((s) => s.setProfile);
  const toggleLock = useGame((s) => s.toggleHeroLock);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const d = HERO_BY_ID[heroId];
  const inst = uid ? save.heroes.find((h) => h.uid === uid) : undefined;
  const rar = RARITIES[d.rarity];
  const progress = inst ?? { level: 1, rank: rar.startRank, ascension: 0, awaken: 0 };
  const full = inst ? heroTotalStats(save, inst) : null;
  const stats = full ? full.total : computeStats(d, progress);
  const f = FACTIONS[d.faction];
  const maxLv = maxLevelForRank(progress.rank);

  return (
    <Screen title={d.name} right={inst && (
      <button className="hdr-icon-btn" aria-label={inst.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={() => { toggleLock(inst.uid); toast(inst.locked ? 'Héros déverrouillé.' : 'Héros verrouillé : il ne pourra pas être sacrifié par erreur.'); }}>
        {inst.locked ? <Icon.lock /> : <Icon.unlock />}
      </button>
    )}>
      <HeroShowcase heroId={d.id} h={inst} below={
      <div className="hero-sheet-head">
          <div className="title-line">{d.title}</div>
          <IdentityStrip rarity={d.rarity} affinity={d.affinity} role={d.role} faction={d.faction} />
        </div>
      } />

      <section className="hero-summary">
        <div className="hs-line">
          <span className="hs-lv">Niv. <b>{progress.level}</b><small>/{maxLv}</small></span>
          <div className="hs-xp"><div style={{ width: `${inst && progress.level < maxLv ? (inst.xp / heroXpToNext(inst.level)) * 100 : 100}%` }} /></div>
          <span className="hs-pw">{fmt(powerOf(stats))}<small> puissance</small></span>
        </div>
        <div className="hs-line">
          <span className="hs-pill">Rang <b>{progress.rank}</b>/{BALANCE.hero.maxRank}</span>
          <span className="hs-pill">Asc. <b>{progress.ascension}</b>/{BALANCE.hero.maxAscension}</span>
          <span className="hs-pill">Éveil <b>{progress.awaken}</b>/{BALANCE.hero.maxAwaken}</span>
          {inst ? (
            <button className="hs-upgrade" onClick={() => push({ name: 'sanctuary', uid: inst.uid })} aria-label="Améliorer au Sanctuaire">
              <Icon.temple size={14} /> Améliorer{canImprove(save, inst) && <span className="hs-dot" />}
            </button>
          ) : <span className="hs-pill muted">{d.exclusive ? 'Exclusif · événement' : 'Non obtenu'}</span>}
        </div>
      </section>
      {inst && <CopiesCard h={inst} />}

      <section className="stat-sheet" aria-label="Statistiques">
        {STAT_ORDER.map((k) => {
          const I = StatIcon[k];
          const bonus = full ? Math.round((stats[k] - full.base[k]) * 10) / 10 : 0;
          return (
            <div key={k} className="ss-row" title={STAT_LABELS[k].long}>
              <I size={15} />
              <span className="ss-k">{STAT_LABELS[k].short}{STAT_LABELS[k].pct ? ' %' : ''}</span>
              <b className="ss-v">{fmt(stats[k])}{STAT_LABELS[k].pct ? '%' : ''}</b>
              {bonus > 0 && <span className="ss-b">+{fmt(bonus)}</span>}
            </div>
          );
        })}
      </section>

      <Disclosure title="Compétences" summary={`${d.skills.length} compétences${SIGNATURES[d.id] ? ' · signature' : ''}${d.leaderSkill ? ' · aura de chef' : ''}`}>
        {SIGNATURES[d.id] && (
          <div className="skill sig-skill">
            <div className="skill-icon" style={{ ['--sc' as string]: rar.color }}>★</div>
            <div className="grow"><div className="skill-tag">Signature</div><b>{SIGNATURES[d.id].name}</b><div className="muted">{SIGNATURES[d.id].text}</div></div>
          </div>
        )}
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
      </Disclosure>

      {inst && (
        <button className="btn secondary block" style={{ marginTop: 14 }} disabled={save.profile.avatarHeroId === d.id}
          onClick={() => { setProfile({ avatarHeroId: d.id }); toast(`${d.name} est maintenant ton avatar.`, 'ok'); }}>
          {save.profile.avatarHeroId === d.id ? 'Avatar actuel' : 'Choisir comme avatar'}
        </button>
      )}
    </Screen>
  );
}

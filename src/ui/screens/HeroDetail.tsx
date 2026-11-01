import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { ROLES } from '../../data/roles';
import { AFFINITIES } from '../../data/affinities';
import { RARITIES } from '../../data/rarities';
import { BALANCE } from '../../data/balance';
import { computeStats, maxLevelForRank, powerOf, STAT_LABELS, STAT_ORDER } from '../../game/stats';
import { Panel, RarityTag, Screen, Stars, fmt } from '../components/common';
import { HeroArt, hasRealArt } from '../art/HeroArt';
import { FactionEmblem } from '../art/FactionEmblem';
import { Icon } from '../art/Icons';
import { heroXpToNext } from '../../game/progression';

const SLOT_LABEL = { basic: 'Attaque de base', special: 'Compétence spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

export function HeroDetail({ uid, heroId }: { uid?: string; heroId: string }) {
  const save = useGame((s) => s.save)!;
  const setProfile = useGame((s) => s.setProfile);
  const toggleLock = useGame((s) => s.toggleHeroLock);
  const toast = useUI((s) => s.toast);
  const d = HERO_BY_ID[heroId];
  const inst = uid ? save.heroes.find((h) => h.uid === uid) : undefined;
  const rar = RARITIES[d.rarity];
  const progress = inst ?? { level: 1, rank: rar.startRank, ascension: 0, awaken: 0 };
  const stats = computeStats(d, progress);
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
        <p className="quote">{d.quote}</p>
      </div>

      <Panel title={inst ? 'Progression' : 'Non obtenu — statistiques de base'}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span>Niveau <b style={{ color: 'var(--gold-hi)' }}>{progress.level}</b> / {maxLv}</span>
          <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(powerOf(stats))}</b></span>
        </div>
        <div className="progress"><div style={{ width: `${inst && progress.level < maxLv ? (inst.xp / heroXpToNext(inst.level)) * 100 : 100}%` }} /></div>
        {inst && <div className="faint" style={{ marginTop: 4 }}>{progress.level < maxLv ? `XP ${inst.xp} / ${heroXpToNext(inst.level)}` : 'Niveau maximum du rang atteint — augmentez le rang pour continuer (phase 3).'}</div>}
        <div className="row between wrap" style={{ marginTop: 10, fontSize: 13 }}>
          <span>Rang <b>{progress.rank}</b>/{BALANCE.hero.maxRank}</span>
          <span>Ascension <b>{progress.ascension}</b>/{BALANCE.hero.maxAscension}</span>
          <span>Éveil <b>{progress.awaken}</b>/{BALANCE.hero.maxAwaken}</span>
        </div>
        {inst && <p className="faint" style={{ marginTop: 10 }}>Le héros gagne de l’expérience en combattant. Rang, ascension, éveil, compétences et équipement : phase 3.</p>}
      </Panel>

      <Panel title="Statistiques">
        <div className="stat-grid">
          {STAT_ORDER.map((k) => (
            <div key={k} className="stat-row"><span className="muted">{STAT_LABELS[k].long}</span><b>{fmt(stats[k])}{STAT_LABELS[k].pct ? ' %' : ''}</b></div>
          ))}
        </div>
      </Panel>

      <Panel title="Compétences">
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
      </Panel>

      <Panel title="Histoire">
        <div className="lore"><p>{d.lore}</p></div>
        <div className="panel-title" style={{ marginTop: 14 }}>Faction</div>
        <div className="lore"><p><b>{f.name}</b> — {f.synergy}</p></div>
        <div className="panel-title" style={{ marginTop: 14 }}>Apparence</div>
        <div className="lore"><p className="muted">{d.look}</p></div>
        {!hasRealArt(d.id) && <p className="faint">Illustration définitive en cours de création — portrait provisoire affiché.</p>}
      </Panel>

      {inst && (
        <button className="btn secondary block" style={{ marginTop: 14 }} disabled={save.profile.avatarHeroId === d.id}
          onClick={() => { setProfile({ avatarHeroId: d.id }); toast(`${d.name} est maintenant votre avatar.`, 'ok'); }}>
          {save.profile.avatarHeroId === d.id ? 'Avatar actuel' : 'Choisir comme avatar'}
        </button>
      )}
    </Screen>
  );
}

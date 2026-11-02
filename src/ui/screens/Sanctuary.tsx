import { useMemo, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { BALANCE } from '../../data/balance';
import { RARITIES } from '../../data/rarities';
import { maxLevelForRank, powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';
import { canImprove } from '../../game/upgrade';
import { Screen, fmt } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { PlaceBanner } from '../art/PlaceScene';
import { HeroUpgrade, type UpgradeSection } from './HeroUpgrade';

// SANCTUAIRE — le lieu où l'on fait progresser les héros :
// niveau (élixirs), rang, ascension, éveil et compétences.
export function Sanctuary({ uid }: { uid?: string }) {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const teamUids = team.slots.filter(Boolean) as string[];

  // Héros de l'équipe active d'abord, puis par puissance.
  const order = useMemo(() => {
    const pw = (u: string) => { const h = save.heroes.find((x) => x.uid === u)!; return powerOf(heroTotalStats(save, h).total); };
    return [...save.heroes].map((h) => h.uid).sort((a, b) => (teamUids.includes(b) ? 1 : 0) - (teamUids.includes(a) ? 1 : 0) || pw(b) - pw(a));
  }, [save, teamUids.join()]);

  const [sel, setSel] = useState<string>(uid && save.heroes.some((h) => h.uid === uid) ? uid : (team.leader ?? order[0]));
  const [section, setSection] = useState<UpgradeSection>('level');
  const h = save.heroes.find((x) => x.uid === sel) ?? save.heroes[0];
  if (!h) return <Screen title="Sanctuaire"><p className="muted">Aucun héros.</p></Screen>;
  const d = HERO_BY_ID[h.heroId];
  const power = powerOf(heroTotalStats(save, h).total);

  return (
    <Screen title="Sanctuaire">
      <PlaceBanner place="sanctuary" title="Sanctuaire des Héritiers" subtitle="Faites grandir vos héros" />

      <div className="sanct-strip" role="listbox" aria-label="Choisir un héros">
        {order.map((u) => {
          const x = save.heroes.find((y) => y.uid === u)!;
          return (
            <button key={u} role="option" aria-selected={u === h.uid} className={`ss-item ${u === h.uid ? 'on' : ''}`}
              style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[x.heroId].rarity].color }} onClick={() => setSel(u)}>
              <HeroArt heroId={x.heroId} kind="portrait" />
              <span className="ss-lv">{x.level}</span>
              {teamUids.includes(u) && <span className="ss-team" aria-label="Dans l’équipe" />}
              {canImprove(save, x) && <span className="badge-dot" style={{ top: -3, right: -3 }} />}
            </button>
          );
        })}
      </div>

      <div className="sanct-hero">
        <div className="sh-art" style={{ ['--rc' as string]: RARITIES[d.rarity].color }}><HeroArt heroId={d.id} kind="portrait" /></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="sh-name">{d.name}</div>
          <div className="sh-stats">
            <span>Niv. <b>{h.level}</b>/{maxLevelForRank(h.rank)}</span>
            <span>Rang <b>{h.rank}</b>/{BALANCE.hero.maxRank}</span>
            <span>Asc. <b>{h.ascension}</b>/{BALANCE.hero.maxAscension}</span>
            <span>Éveil <b>{h.awaken}</b>/{BALANCE.hero.maxAwaken}</span>
          </div>
          <div className="sh-power">Puissance <b>{fmt(power)}</b></div>
        </div>
        <button className="btn secondary small" onClick={() => push({ name: 'hero', uid: h.uid, heroId: h.heroId })}>Fiche</button>
      </div>

      <div className="seg" style={{ margin: '10px 0 12px' }}>
        <button className={section === 'level' ? 'on' : ''} onClick={() => setSection('level')}>Niveau</button>
        <button className={section === 'power' ? 'on' : ''} onClick={() => setSection('power')}>Ascension</button>
        <button className={section === 'skills' ? 'on' : ''} onClick={() => setSection('skills')}>Compétences</button>
      </div>
      <HeroUpgrade key={h.uid} h={h} section={section} />
    </Screen>
  );
}

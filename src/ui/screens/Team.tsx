import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import { computeStats, powerOf } from '../../game/stats';
import { Panel, Screen, fmt } from '../components/common';
import { HeroCard } from '../components/HeroCard';

// Formation : 3 héros en première ligne (exposés), 2 en seconde ligne (protégés).
// Le moteur de combat (phase 2) utilisera ces positions pour le ciblage.
export function Team() {
  const save = useGame((s) => s.save)!;
  const { setTeamSlot, setLeader, setActiveTeam, renameTeam } = useGame.getState();
  const toast = useUI((s) => s.toast);
  const [teamId, setTeamId] = useState(save.activeTeamId);
  const [picking, setPicking] = useState<number | null>(null);
  const team = save.teams.find((t) => t.id === teamId) ?? save.teams[0];
  const byUid = Object.fromEntries(save.heroes.map((h) => [h.uid, h]));
  const members = team.slots.map((u) => (u ? byUid[u] : undefined));
  const power = members.reduce((acc, h) => acc + (h ? powerOf(computeStats(HERO_BY_ID[h.heroId], h)) : 0), 0);
  const leaderDef = team.leader && byUid[team.leader] ? HERO_BY_ID[byUid[team.leader].heroId] : null;

  const factionCount: Record<string, number> = {};
  members.forEach((h) => { if (h) { const f = HERO_BY_ID[h.heroId].faction; factionCount[f] = (factionCount[f] ?? 0) + 1; } });
  const roles = new Set(members.filter(Boolean).map((h) => HERO_BY_ID[h!.heroId].role));

  const onSlot = (i: number) => setPicking(picking === i ? null : i);
  const pick = (uid: string | null) => {
    if (picking === null) return;
    setTeamSlot(team.id, picking, uid);
    setPicking(null);
  };

  return (
    <Screen title="Équipe et formation">
      <div className="seg" style={{ marginBottom: 12 }}>
        {save.teams.map((t) => <button key={t.id} className={t.id === team.id ? 'on' : ''} onClick={() => { setTeamId(t.id); setPicking(null); }}>{t.name}</button>)}
      </div>

      <Panel>
        <div className="row between" style={{ marginBottom: 10 }}>
          <input className="text-input" style={{ height: 36, flex: 1 }} defaultValue={team.name} key={team.id} maxLength={24}
            onBlur={(e) => renameTeam(team.id, e.target.value)} aria-label="Nom de l’équipe" />
          <span className="muted" style={{ whiteSpace: 'nowrap' }}>Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(power)}</b></span>
        </div>
        <div className="faint" style={{ marginBottom: 6 }}>PREMIÈRE LIGNE</div>
        <div className="formation">
          {[0, 1, 2].map((i) => renderSlot(i))}
        </div>
        <div className="faint" style={{ margin: '10px 0 6px' }}>SECONDE LIGNE</div>
        <div className="formation">
          {[3, 4].map((i) => renderSlot(i, true))}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          {team.id === save.activeTeamId
            ? <span className="chip active">Équipe active</span>
            : <button className="btn small" onClick={() => { setActiveTeam(team.id); toast(`« ${team.name} » est l’équipe active.`, 'ok'); }}>Définir comme active</button>}
          {leaderDef && <span className="chip">Chef : {leaderDef.name}</span>}
        </div>
      </Panel>

      {picking !== null && (
        <Panel title={`Emplacement ${picking + 1} — choisir un héros`}>
          <div className="hero-grid">
            {save.heroes.map((h) => (
              <HeroCard key={h.uid} heroId={h.heroId} level={h.level} selected={team.slots[picking] === h.uid}
                badge={team.slots.includes(h.uid) ? `Pos. ${team.slots.indexOf(h.uid) + 1}` : undefined} onClick={() => pick(h.uid)} />
            ))}
          </div>
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            {team.slots[picking] && <button className="btn secondary small grow" onClick={() => pick(null)}>Retirer</button>}
            {team.slots[picking] && team.leader !== team.slots[picking] && (
              <button className="btn small grow" onClick={() => { setLeader(team.id, team.slots[picking!]); setPicking(null); }}>Nommer chef</button>
            )}
          </div>
        </Panel>
      )}

      <Panel title="Synergies">
        {Object.entries(factionCount).map(([f, n]) => (
          <div key={f} className="stat-row"><span>{FACTIONS[f as keyof typeof FACTIONS].name} ×{n}</span><span className="faint" style={{ maxWidth: '60%', textAlign: 'right' }}>{FACTIONS[f as keyof typeof FACTIONS].synergy}</span></div>
        ))}
        {leaderDef?.leaderSkill && <div className="stat-row"><span>Aura de chef</span><b>{leaderDef.leaderSkill.description}</b></div>}
        <div className="hint" style={{ marginTop: 10 }}>
          Rôles présents : {roles.size}/6. {!members.some((h) => h && HERO_BY_ID[h.heroId].role === 'healer') && 'Aucun soigneur : les combats longs seront difficiles. '}
          {!members.some((h) => h && HERO_BY_ID[h.heroId].role === 'defender') && 'Aucun défenseur en première ligne.'}
        </div>
        <p className="faint" style={{ marginTop: 8 }}>Les synergies de faction et l’aura du chef sont appliquées automatiquement en combat. Première ligne : exposée. Seconde ligne : subit 15 % de dégâts en moins tant que la première ligne tient.</p>
      </Panel>
    </Screen>
  );

  function renderSlot(i: number, back?: boolean) {
    const h = members[i];
    return (
      <button key={i} className={`slot ${back ? 'back' : ''} ${picking === i ? 'picking' : ''}`} onClick={() => onSlot(i)}>
        {h ? (
          <>
            {team.leader === h.uid && <span className="leader-crown">CHEF</span>}
            <HeroCard heroId={h.heroId} level={h.level} />
          </>
        ) : <span>+ Ajouter</span>}
        {h && <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: RARITIES[HERO_BY_ID[h.heroId].rarity].color }} />}
      </button>
    );
  }
}

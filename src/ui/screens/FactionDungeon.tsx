import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useState } from 'react';
import { FACTION_DUNGEONS, FACTION_FLOORS, FACTION_MAX_STARS, FACTION_STAR_MILESTONES, factionReward } from '../../data/factionDungeon';
import { FACTIONS } from '../../data/factions';
import { claimFactionMilestone, claimableMilestones, factionBest, factionHeroes, factionOfDay, familyStars, floorStars, milestoneClaimed, nextRotation, totalFactionStars } from '../../game/factionDungeon';
import { play } from '../../audio/sfx';
import { formatDuration } from '../../core/time';
import { RewardInline, rewardMainIcon } from '../components/RewardView';
import { Modal, Screen } from '../components/common';
import { FactionEmblem } from '../art/FactionEmblem';
import { Icon } from '../art/Icons';

const de = (short: string) => (short === 'Akkar' ? 'd’Akkar' : `de ${short}`);

// DONJON DES FAMILLES (v1.79.0) — un donjon par famille, un par jour : seuls les héros de la famille du jour y entrent.
// Il change chaque jour au renouvellement et revient tous les 6 jours ; la progression de chaque famille est gardée.
export function FactionDungeon() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const f = factionOfDay(now);
  const d = FACTION_DUNGEONS[f];
  const fa = FACTIONS[f];
  const best = factionBest(save, f);
  const owned = factionHeroes(save, f).length;
  const mutate = useGame((s) => s.mutate);
  const [showMs, setShowMs] = useState(false);
  const total = totalFactionStars(save);
  const claimable = claimableMilestones(save);
  const nextMs = FACTION_STAR_MILESTONES.find((m) => m.stars > total);
  const prevMs = [...FACTION_STAR_MILESTONES].reverse().find((m) => m.stars <= total)?.stars ?? 0;
  const claim = (i: number) => {
    let r = { ok: false } as ReturnType<typeof claimFactionMilestone>;
    mutate((s) => { r = claimFactionMilestone(s, i); });
    if (r.ok) { play('claim'); toast(`Palier de ${FACTION_STAR_MILESTONES[i].stars} étoiles réclamé !`, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const Stars = ({ n, size = 13 }: { n: number; size?: number }) => <span className="sn-stars">{[1, 2, 3].map((k) => <Icon.star key={k} size={size} color={k <= n ? '#ffd36b' : '#3a3442'} />)}</span>;

  return (
    <Screen title="Donjon des familles">
      <section className="fd-banner" style={{ ['--fc' as string]: fa.colors.glow, ['--fp' as string]: fa.colors.primary }}>
        <FactionEmblem id={f} size={84} />
        <div className="grow">
          <div className="faint fd-today">Aujourd’hui</div>
          <div className="fd-name">{d.name}</div>
          <div className="fd-sub">Seulement les héros {de(fa.short)} · {owned} héros possédé{owned > 1 ? 's' : ''}</div>
          <div className="fd-sub">Étage {best}/{FACTION_FLOORS} · <Icon.star size={11} color="#ffd36b" /> {familyStars(save, f)}/{FACTION_FLOORS * 3} · change dans {formatDuration(nextRotation(now) - now)}</div>
        </div>
      </section>

      <div className="fd-rotation" aria-label="Rotation des prochains jours">
        {[1, 2, 3, 4, 5].map((k) => {
          const g = factionOfDay(now, k);
          return (
            <div key={k} className="fd-next" title={FACTION_DUNGEONS[g].name}>
              <FactionEmblem id={g} size={34} />
              <span>{k === 1 ? 'Demain' : `J+${k}`}</span>
              <small><Icon.star size={9} color="#ffd36b" /> {familyStars(save, g)}</small>
            </div>
          );
        })}
      </div>

      <button className={`fd-stars ${claimable.length ? 'ready' : ''}`} onClick={() => setShowMs(true)}>
        <div className="row between" style={{ gap: 8 }}>
          <b><Icon.star size={16} color="#ffd36b" /> Étoiles des familles</b>
          <span>{total}/{FACTION_MAX_STARS}</span>
        </div>
        <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${nextMs ? ((total - prevMs) / (nextMs.stars - prevMs)) * 100 : 100}%` }} /></div>
        <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
          {claimable.length ? `${claimable.length} récompense${claimable.length > 1 ? 's' : ''} à réclamer !` : nextMs ? `Prochain palier : ${nextMs.stars} étoiles` : 'Toutes les étoiles sont gagnées.'}
        </div>
        {claimable.length > 0 && <span className="badge-dot" />}
      </button>

      <div className="stage-path">
        {Array.from({ length: FACTION_FLOORS }, (_, i) => i + 1).map((fl) => {
          const open = fl <= best + 1;
          const done = fl <= best;
          const st = floorStars(save, f, fl);
          return (
            <button key={fl} className={`stage-node ${open && !done ? '' : done ? 'cleared' : 'locked'} ${fl % 10 === 0 ? 'boss' : ''}`}
              onClick={() => (open ? push({ name: 'prep', spec: { mode: 'faction', faction: f, floor: fl } }) : toast('Termine l’étage précédent.'))}>
              <span className="sn-idx">{fl}</span>
              <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                <div className="sn-name">{fl % 10 === 0 ? 'Gardien du donjon' : `Étage ${fl}`}</div>
                <div className="faint">{done ? (st < 3 ? 'Rejouer pour plus d’étoiles' : 'Conquis') : 'Sans énergie'}</div>
              </div>
              {done ? <Stars n={st} size={14} /> : open && <span className="row" style={{ gap: 4 }}>{rewardMainIcon(factionReward(fl), 18)}</span>}
              {!open && <Icon.lock size={16} />}
            </button>
          );
        })}
      </div>

      {showMs && (
        <Modal onClose={() => setShowMs(false)}>
          <h2>Étoiles des familles</h2>
          <p className="faint" style={{ marginTop: 0, fontSize: 13 }}>Chaque étage gagné rapporte jusqu’à 3 étoiles : 3 si aucun héros n’est KO, 2 avec un KO, 1 sinon. Rejoue un étage pour améliorer ses étoiles. Les étoiles des 6 familles s’additionnent : {total}/{FACTION_MAX_STARS}.</p>
          <div className="fd-ms-list">
            {FACTION_STAR_MILESTONES.map((m, i) => {
              const got = milestoneClaimed(save, i);
              const ok = total >= m.stars;
              return (
                <div key={m.stars} className={`fd-ms ${got ? 'got' : ok ? 'ok' : ''}`}>
                  <span className="fd-ms-n"><Icon.star size={14} color="#ffd36b" /> {m.stars}</span>
                  <div className="grow" style={{ minWidth: 0 }}><RewardInline reward={m.reward} /></div>
                  {got ? <span className="faint" style={{ fontSize: 12 }}>Reçu</span> : <button className="btn small" disabled={!ok} onClick={() => claim(i)}>Prendre</button>}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </Screen>
  );
}

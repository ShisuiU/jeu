import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { FACTION_DUNGEONS, FACTION_FLOORS, factionLevel, factionReward } from '../../data/factionDungeon';
import { FACTIONS } from '../../data/factions';
import { factionBest, factionHeroes, factionOfDay, nextRotation } from '../../game/factionDungeon';
import { formatDuration } from '../../core/time';
import { rewardMainIcon } from '../components/RewardView';
import { Screen } from '../components/common';
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

  return (
    <Screen title="Donjon des familles">
      <section className="fd-banner" style={{ ['--fc' as string]: fa.colors.glow, ['--fp' as string]: fa.colors.primary }}>
        <FactionEmblem id={f} size={84} />
        <div className="grow">
          <div className="faint fd-today">Aujourd’hui</div>
          <div className="fd-name">{d.name}</div>
          <div className="fd-sub">Seulement les héros {de(fa.short)} · {owned} héros possédé{owned > 1 ? 's' : ''}</div>
          <div className="fd-sub">Étage {best}/{FACTION_FLOORS} · change dans {formatDuration(nextRotation(now) - now)}</div>
        </div>
      </section>

      <div className="fd-rotation" aria-label="Rotation des prochains jours">
        {[1, 2, 3, 4, 5].map((k) => {
          const g = factionOfDay(now, k);
          return (
            <div key={k} className="fd-next" title={FACTION_DUNGEONS[g].name}>
              <FactionEmblem id={g} size={34} />
              <span>{k === 1 ? 'Demain' : `J+${k}`}</span>
              <small>{factionBest(save, g)}/{FACTION_FLOORS}</small>
            </div>
          );
        })}
      </div>
      <p className="faint" style={{ textAlign: 'center', margin: '0 0 10px', fontSize: 12.5 }}>Un donjon par famille, qui change chaque jour. Ta progression est gardée : tu reprends où tu en étais quand il revient.</p>

      <div className="stage-path">
        {Array.from({ length: FACTION_FLOORS }, (_, i) => i + 1).map((fl) => {
          const open = fl <= best + 1;
          const done = fl <= best;
          return (
            <button key={fl} className={`stage-node ${open && !done ? '' : done ? 'cleared' : 'locked'} ${fl % 10 === 0 ? 'boss' : ''}`}
              onClick={() => (done ? toast('Étage déjà conquis.') : open ? push({ name: 'prep', spec: { mode: 'faction', faction: f, floor: fl } }) : toast('Termine l’étage précédent.'))}>
              <span className="sn-idx">{fl}</span>
              <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                <div className="sn-name">{fl % 10 === 0 ? 'Gardien du donjon' : `Étage ${fl}`}</div>
                <div className="faint">{done ? 'Conquis' : <>Ennemis niv. {factionLevel(fl)} · sans énergie</>}</div>
              </div>
              {!done && <span className="row" style={{ gap: 4 }}>{rewardMainIcon(factionReward(fl), 18)}</span>}
              {!open && <Icon.lock size={16} />}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

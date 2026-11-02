import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { CHAPTERS } from '../../data/campaign';
import { DUNGEONS } from '../../data/dungeons';
import { TOWER_FLOORS } from '../../data/tower';
import { WORLD_BOSS } from '../../data/worldBoss';
import { ARENA, arenaTier } from '../../data/arena';
import { chapterStars, isStageUnlocked } from '../../game/campaign';
import { activeEvents } from '../../game/events';
import { Screen } from '../components/common';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';

// COMBATS — tous les modes de jeu au même endroit, avec leur état du jour.
export function Combats() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const chap = [...CHAPTERS].reverse().find((c) => isStageUnlocked(save, 'normal', c.stages[0])) ?? CHAPTERS[0];
  const st = chapterStars(save, 'normal', chap.n);
  const bestDungeon = Math.max(0, ...DUNGEONS.map((d) => save.progress.dungeons[d.id]?.bestFloor ?? 0));
  const keys = WORLD_BOSS.keysPerDay - save.worldBoss.keysUsed;
  const tickets = ARENA.ticketsPerDay - save.arena.ticketsUsed;
  const ev = activeEvents(now)[0];
  const cards: { title: string; sub: string; art: string; color: string; route: Route; dot?: boolean }[] = [
    { title: 'Campagne', sub: `Chapitre ${chap.n} · ${chap.name} · ★ ${st.stars}/${st.max}`, art: chap.stages[9].waves[1]?.find((w) => w.hpMult)?.enemy ?? 'herald', color: '#d9b36a', route: { name: 'campaign' } },
    { title: 'Donjons', sub: `Meilleur étage ${bestDungeon}/10`, art: 'forge_golem', color: '#ff9a3c', route: { name: 'dungeons' } },
    { title: 'Tour des Âges', sub: `Étage ${save.progress.tower.floor}/${TOWER_FLOORS}`, art: 'tower_sentinel', color: '#b98cff', route: { name: 'tower' } },
    { title: 'Boss mondial', sub: `${WORLD_BOSS.name} · ${keys}/${WORLD_BOSS.keysPerDay} clés`, art: WORLD_BOSS.enemy, color: '#ffcc66', route: { name: 'worldboss' }, dot: keys > 0 },
    { title: 'Arène', sub: `Ligue ${arenaTier(save.arena.rating).name} · ${tickets}/${ARENA.ticketsPerDay} tickets`, art: 'hollow_knight', color: '#ff6b7d', route: { name: 'arena' }, dot: tickets > 0 },
  ];
  if (ev) cards.push({ title: ev.name, sub: 'Événement en cours', art: 'ash_lord', color: ev.color ?? '#ff3d6e', route: { name: 'events' } });
  return (
    <Screen title="Combats">
      <div className="combat-list">
        {cards.map((c) => (
          <button key={c.title} className="combat-card" style={{ ['--mc' as string]: c.color }} onClick={() => push(c.route)}>
            <div className="cc-art"><EnemyArt enemyId={c.art} /></div>
            <div className="cc-text">
              <div className="cc-title">{c.title}</div>
              <div className="cc-sub">{c.sub}</div>
            </div>
            {c.dot && <span className="badge-dot" style={{ top: 10, right: 10 }} />}
            <Icon.back size={18} />
          </button>
        ))}
      </div>
    </Screen>
  );
}

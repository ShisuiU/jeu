import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { CHAPTERS } from '../../data/campaign';
import { DUNGEONS } from '../../data/dungeons';
import { TOWER_FLOORS } from '../../data/tower';
import { WORLD_BOSS } from '../../data/worldBoss';
import { ARENA, arenaTier } from '../../data/arena';
import { chapterStars, isStageUnlocked } from '../../game/campaign';
import { activeEvents } from '../../game/events';
import { eventClaimable } from '../../game/missions';
import { BONUS_SHORT } from '../../data/eventCycle';
import { EXPEDITION_SLOTS, finishedExpeditions } from '../../game/expeditions';
import { Screen } from '../components/common';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';
import { isUnlocked, unlockOrder, unlockText, type Feature } from '../../game/unlocks';

// COMBATS — tous les modes de jeu au même endroit, avec leur état du jour.
export function Combats() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const toast = useUI((s) => s.toast);
  const chap = [...CHAPTERS].reverse().find((c) => isStageUnlocked(save, 'normal', c.stages[0])) ?? CHAPTERS[0];
  const st = chapterStars(save, 'normal', chap.n);
  const bestDungeon = Math.max(0, ...DUNGEONS.map((d) => save.progress.dungeons[d.id]?.bestFloor ?? 0));
  const keys = WORLD_BOSS.keysPerDay - save.worldBoss.keysUsed;
  const tickets = ARENA.ticketsPerDay - save.arena.ticketsUsed;
  const cards: { title: string; sub: string; art: string; color: string; route: Route; dot?: boolean; feature?: Feature }[] = [
    { title: 'Campagne', sub: `Chapitre ${chap.n} · ${chap.name} · ★ ${st.stars}/${st.max}`, art: chap.stages[9].waves[1]?.find((w) => w.hpMult)?.enemy ?? 'herald', color: '#d9b36a', route: { name: 'campaign' } },
    { title: 'Donjons', sub: `Meilleur étage ${bestDungeon}/10`, art: 'forge_golem', color: '#ff9a3c', route: { name: 'dungeons' }, feature: 'dungeons' },
    { title: 'Tour des Âges', sub: `Étage ${save.progress.tower.floor}/${TOWER_FLOORS}`, art: 'tower_sentinel', color: '#b98cff', route: { name: 'tower' }, feature: 'tower' },
    { title: 'Boss mondial', sub: `${WORLD_BOSS.name} · ${keys}/${WORLD_BOSS.keysPerDay} clés`, art: WORLD_BOSS.enemy, color: '#ffcc66', route: { name: 'worldboss' }, dot: keys > 0, feature: 'worldboss' },
    { title: 'Expéditions', sub: (() => { const f = finishedExpeditions(save, now); const r = save.expeditions?.runs.length ?? 0; return f ? `${f} de retour : butin à récupérer` : r ? `${r} en cours` : `${EXPEDITION_SLOTS} missions par jour, même jeu fermé`; })(), art: 'seam_stalker', color: '#9fb7ff', route: { name: 'expeditions' }, feature: 'expeditions', dot: finishedExpeditions(save, now) > 0 || (save.expeditions?.runs.length ?? 0) + (save.expeditions?.done.length ?? 0) === 0 },
    { title: 'Arène', sub: `Ligue ${arenaTier(save.arena.rating).name} · ${tickets}/${ARENA.ticketsPerDay} tickets`, art: 'hollow_knight', color: '#ff6b7d', route: { name: 'arena' }, dot: tickets > 0, feature: 'arena' },
  ];
  for (const ev of [...activeEvents(now)].reverse()) cards.unshift({
    title: ev.name, sub: ev.cycle ? `Cette semaine · bonus ${BONUS_SHORT[ev.cycle.bonus.kind]} ×${String(ev.cycle.bonus.mult).replace('.', ',')}` : 'Événement spécial',
    art: ev.cycle?.art ?? 'ash_lord', color: ev.color ?? '#ff3d6e', route: { name: 'events' }, dot: !save.flags[`seen_${ev.id}`] || eventClaimable(save, now, ev.id) > 0, feature: 'events',
  });
  const open = cards.filter((c) => !c.feature || isUnlocked(save, c.feature));
  // Modes fermés : seul le prochain à s'ouvrir est montré (les autres sont annoncés en une ligne).
  const closedAll = cards.filter((c) => c.feature && !isUnlocked(save, c.feature)).sort((a, b) => unlockOrder(a.feature!) - unlockOrder(b.feature!));
  const closed = closedAll.slice(0, 1);
  const later = new Set(closedAll.slice(1).map((c) => c.feature)).size;
  return (
    <Screen title="Combats">
      <div className="combat-list">
        {open.map((c) => (
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
        {/* Modes encore fermés : rangés en bas, avec le niveau qui les ouvre (un seul nom de mode à la fois, pas de détails). */}
        {closed.map((c) => (
          <button key={c.title} className="combat-card locked" style={{ ['--mc' as string]: '#5a5364' }} onClick={() => toast(`${c.title} : ${unlockText(c.feature!).toLowerCase()} de la campagne.`)}>
            <div className="cc-text">
              <div className="cc-title">{c.title}</div>
              <div className="cc-sub">{unlockText(c.feature!)}</div>
            </div>
            <Icon.lock size={18} />
          </button>
        ))}
      </div>
      {later > 0 && <p className="faint" style={{ textAlign: 'center', marginTop: 12 }}>Encore {later} mode{later > 1 ? 's' : ''} à découvrir en avançant dans la campagne.</p>}
    </Screen>
  );
}

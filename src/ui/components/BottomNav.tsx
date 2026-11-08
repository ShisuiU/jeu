import { useUI, type Tab } from '../../state/ui';
import { useGame } from '../../state/store';
import { canClaimDaily } from '../../game/daily';
import { Icon } from '../art/Icons';
import { unreadMail } from '../screens/Mail';
import { claimableCount, eventsDot } from '../../game/missions';
import { isUnlocked } from '../../game/unlocks';
import { canImprove } from '../../game/upgrade';
import { useGifts } from '../../state/gifts';
import { collectionClaimable } from '../../game/collection';
import type { SaveData } from '../../save/schema';
import { newCopies } from '../../game/copies';
import { cloudWanted, useAccount } from '../../cloud/account';
import { campElapsed } from '../../game/camp';

const ITEMS: { tab: Tab; label: string; icon: keyof typeof Icon }[] = [
  { tab: 'home', label: 'Accueil', icon: 'home' },
  { tab: 'collection', label: 'Héros', icon: 'heroes' },
  { tab: 'summon', label: 'Invoquer', icon: 'portal' },
  { tab: 'combats', label: 'Combats', icon: 'sword' },
  { tab: 'menu', label: 'Menu', icon: 'menu' },
];

const teamCanImprove = (s: SaveData) => { const t = s.teams.find((x) => x.id === s.activeTeamId) ?? s.teams[0]; return t.slots.some((u) => { const h = s.heroes.find((x) => x.uid === u); return !!h && canImprove(s, h); }); };

export function BottomNav() {
  const root = useUI((s) => s.stack[0].name);
  // L'onglet reste allumé quand on navigue dans ses sous-écrans.
  const tab = useUI((s) => s.tab);
  // Un sélecteur par pastille : chacun renvoie un booléen stable (sinon React redessine en boucle).
  // Une pastille = quelque chose à RÉCUPÉRER (pas « une activité est possible », sinon tout clignote tout le temps).
  // Invoquer : cadeau d'événement, ou de quoi faire un appel ×10 d'éclats d'Aeon.
  const summonDot = useGame((s) => !!s.save && (s.save.resources.shardAeon >= 10 || (isUnlocked(s.save, 'events') && !s.save.flags.gift_event_ash)));
  // Combats : une expédition revenue (butin qui attend). Les clés et tickets du jour restent signalés sur les cartes.
  const combatsDot = useGame((s) => !!s.save && (s.save.expeditions?.runs ?? []).some((r) => s.now >= r.endsAt));
  const gifts = useGifts((g) => g.waiting > 0);
  const homeDotGame = useGame((s) => !!s.save && (canClaimDaily(s.save, s.now) || unreadMail(s.save.flags) || claimableCount(s.save) > 0 || (isUnlocked(s.save, 'events') && eventsDot(s.save, s.now)) || (isUnlocked(s.save, 'camp') && campElapsed(s.save, s.now) >= 4 * 3600_000)));
  const homeDot = gifts || homeDotGame;
  // Héros : nouveaux doublons, ou un héros de l'équipe peut progresser au Sanctuaire.
  const heroesDot = useGame((s) => !!s.save && (newCopies(s.save) || teamCanImprove(s.save) || collectionClaimable(s.save).length > 0));
  // Menu : invitation à protéger sa partie, jusqu'à la première visite de l'écran Sauvegarde.
  const menuDot = useGame((s) => !!s.save && !s.save.flags.saves_seen && !useAccount.getState().user && !cloudWanted() && s.save.stats.battlesWon >= 3);
  const dots: Partial<Record<Tab, boolean>> = { home: homeDot, collection: heroesDot, summon: summonDot, combats: combatsDot, menu: menuDot };
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        const I = Icon[it.icon] as (p: { size?: number }) => JSX.Element;
        return (
          <button key={it.tab} className={`nav-item ${root === it.tab ? 'active' : ''}`} onClick={() => tab(it.tab)}>
            <I />
            {it.label}
            {dots[it.tab] && <span className="badge-dot" />}
          </button>
        );
      })}
    </nav>
  );
}

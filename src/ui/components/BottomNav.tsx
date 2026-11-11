import { useUI, type Tab } from '../../state/ui';
import { useGame } from '../../state/store';
import { canClaimDaily } from '../../game/daily';
import navHome from '../../assets/home/nav_home.webp';
import navHeroes from '../../assets/home/nav_heroes.webp';
import navSummon from '../../assets/home/nav_summon.webp';
import navBattle from '../../assets/home/nav_battle.webp';
import navMenu from '../../assets/home/nav_menu.webp';
import navHomeOn from '../../assets/home/nav_home_on.webp';
import navHeroesOn from '../../assets/home/nav_heroes_on.webp';
import navBattleOn from '../../assets/home/nav_battle_on.webp';
import navMenuOn from '../../assets/home/nav_menu_on.webp';
import { unreadMail } from '../screens/Mail';
import { claimableCount, eventsDot } from '../../game/missions';
import { isUnlocked } from '../../game/unlocks';
import { canImprove } from '../../game/upgrade';
import { useGifts } from '../../state/gifts';
import { collectionClaimable } from '../../game/collection';
import type { SaveData } from '../../save/schema';
import { newCopies } from '../../game/copies';
import { cloudWanted, useAccount } from '../../cloud/account';

// Icônes peintes (v1.72.0, maquette SpriteCook) ; Invoquer est un cristal rond qui dépasse de la barre.
const ITEMS: { tab: Tab; label: string; img: string; on?: string }[] = [
  { tab: 'home', label: 'Accueil', img: navHome, on: navHomeOn },
  { tab: 'collection', label: 'Héros', img: navHeroes, on: navHeroesOn },
  { tab: 'summon', label: 'Invocation', img: navSummon },
  { tab: 'combats', label: 'Combat', img: navBattle, on: navBattleOn },
  { tab: 'menu', label: 'Menu', img: navMenu, on: navMenuOn },
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
  const homeDotGame = useGame((s) => !!s.save && (canClaimDaily(s.save, s.now) || unreadMail(s.save.flags) || claimableCount(s.save) > 0 || (isUnlocked(s.save, 'events') && eventsDot(s.save, s.now))));
  const homeDot = gifts || homeDotGame;
  // Héros : nouveaux doublons, ou un héros de l'équipe peut progresser au Sanctuaire.
  const heroesDot = useGame((s) => !!s.save && (newCopies(s.save) || teamCanImprove(s.save) || collectionClaimable(s.save).length > 0));
  // Menu : invitation à protéger sa partie, jusqu'à la première visite de l'écran Sauvegarde.
  const menuDot = useGame((s) => !!s.save && !s.save.flags.saves_seen && !useAccount.getState().user && !cloudWanted() && s.save.stats.battlesWon >= 3);
  const dots: Partial<Record<Tab, boolean>> = { home: homeDot, collection: heroesDot, summon: summonDot, combats: combatsDot, menu: menuDot };
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        return (
          <button key={it.tab} className={`nav-item ${it.tab === 'summon' ? 'summon' : ''} ${root === it.tab ? 'active' : ''}`} onClick={() => tab(it.tab)}>
            <img className={it.tab === 'summon' ? 'nav-crystal' : 'nav-ico'} src={root === it.tab && it.on ? it.on : it.img} alt="" draggable={false} />
            {it.label}
            {dots[it.tab] && <span className="badge-dot" />}
          </button>
        );
      })}
    </nav>
  );
}

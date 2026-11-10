import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { Guide } from './ui/components/Guide';
import { NamePrompt } from './ui/components/NamePrompt';
import { needsName } from './game/profile';
import { useGame } from './state/store';
import { useUI, type Route } from './state/ui';
import { initSaveSystem } from './save/saveManager';
import { loadEvents } from './game/events';
import { configureAudio, play, unlockAudio } from './audio/sfx';
import { type MusicMode, configureMusic, playMusic, resumeMusic, stopMusic } from './audio/music';
import { canClaimDaily } from './game/daily';
import { claimableCount } from './game/missions';
import { finishedExpeditions } from './game/expeditions';
import { cloudWanted, loadCloud } from './cloud/account';
import { AccountPrompt, CloudConflictModal } from './ui/screens/Account';
import { inTutorial } from './ui/components/Coach';
import { UnlockAnnounce } from './ui/components/UnlockAnnounce';
import { BondsIntro } from './ui/components/Copies';
import { BottomNav } from './ui/components/BottomNav';
import { BgIndicator } from './ui/components/BgIndicator';
import { Toasts } from './ui/components/Toasts';
import { Title } from './ui/screens/Title';
import { Home } from './ui/screens/Home';

// Écrans chargés à la demande (tous pré-cachés pour le hors-ligne) : démarrage plus rapide.
const L = <K extends string>(load: () => Promise<Record<K, React.ComponentType<any>>>, key: K) => lazy(() => load().then((m) => ({ default: m[key] })));
const Collection = L(() => import('./ui/screens/Collection'), 'Collection');
const HeroDetail = L(() => import('./ui/screens/HeroDetail'), 'HeroDetail');
const Team = L(() => import('./ui/screens/Team'), 'Team');
const Inventory = L(() => import('./ui/screens/Inventory'), 'Inventory');
const Menu = L(() => import('./ui/screens/Menu'), 'Menu');
const Settings = L(() => import('./ui/screens/Settings'), 'Settings');
const Saves = L(() => import('./ui/screens/Saves'), 'Saves');
const Codex = L(() => import('./ui/screens/Codex'), 'Codex');
const Campaign = L(() => import('./ui/screens/Campaign'), 'Campaign');
const Battle = L(() => import('./ui/screens/Battle'), 'Battle');
const Summon = L(() => import('./ui/screens/Summon'), 'Summon');
const Gear = L(() => import('./ui/screens/Gear'), 'Gear');
const Sanctuary = L(() => import('./ui/screens/Sanctuary'), 'Sanctuary');
const Mail = L(() => import('./ui/screens/Mail'), 'Mail');
const Stage = L(() => import('./ui/screens/Stage'), 'Stage');
const Prep = L(() => import('./ui/screens/Stage'), 'Prep');
const Dungeons = L(() => import('./ui/screens/Modes'), 'Dungeons');
const Dungeon = L(() => import('./ui/screens/Modes'), 'Dungeon');
const Tower = L(() => import('./ui/screens/Modes'), 'Tower');
const WorldBoss = L(() => import('./ui/screens/Modes'), 'WorldBoss');
const Arena = L(() => import('./ui/screens/Modes'), 'Arena');
const Combats = L(() => import('./ui/screens/Combats'), 'Combats');
const Expeditions = L(() => import('./ui/screens/Expeditions'), 'Expeditions');
const Market = L(() => import('./ui/screens/Market'), 'Market');
const Camp = L(() => import('./ui/screens/Camp'), 'Camp');
const Wheel = L(() => import('./ui/screens/Wheel'), 'Wheel');
const ProfileScreen = L(() => import('./ui/screens/Profile'), 'Profile');
const Guild = L(() => import('./ui/screens/Guild'), 'Guild');
const Friends = L(() => import('./ui/screens/Friends'), 'Friends');
const Moderation = L(() => import('./ui/screens/Moderation'), 'Moderation');
const Ranks = L(() => import('./ui/screens/Ranks'), 'Ranks');
const Missions = L(() => import('./ui/screens/Missions'), 'Missions');
const Events = L(() => import('./ui/screens/Events'), 'Events');

function renderRoute(r: Route) {
  switch (r.name) {
    case 'home': return <Home />;
    case 'collection': return <Collection />;
    case 'hero': return <HeroDetail key={r.uid ?? r.heroId} uid={r.uid} heroId={r.heroId} />;
    case 'team': return <Team />;
    case 'inventory': return <Inventory />;
    case 'menu': return <Menu />;
    case 'daily': return <Mail tab="daily" />;
    case 'settings': return <Settings />;
    case 'saves': return <Saves />;
    case 'codex': return <Codex />;
    case 'campaign': return <Campaign />;
    case 'summon': return <Summon />;
    case 'gear': return <Gear gearUid={r.gearUid} />;
    case 'sanctuary': return <Sanctuary uid={r.uid} />;
    case 'mail': return <Mail />;
    case 'dungeons': return <Dungeons />;
    case 'dungeon': return <Dungeon key={r.dungeonId} dungeonId={r.dungeonId} />;
    case 'tower': return <Tower />;
    case 'worldboss': return <WorldBoss />;
    case 'arena': return <Arena />;
    case 'missions': return <Missions />;
    case 'events': return <Events />;
    case 'combats': return <Combats />;
    case 'expeditions': return <Expeditions />;
    case 'market': return <Market />;
    case 'camp': return <Camp />;
    case 'wheel': return <Wheel />;
    case 'profile': return <ProfileScreen />;
    case 'guild': return <Guild />;
    case 'ranks': return <Ranks tab={r.tab} />;
    case 'account': return <Saves mode={r.mode} />;
    case 'stage': return <Stage key={r.stageId} stageId={r.stageId} />;
    case 'prep': return <Prep key={JSON.stringify(r.spec)} spec={r.spec} />;
    case 'battle': return <Battle key={r.seed} spec={r.spec} teamId={r.teamId} seed={r.seed} guest={r.guest} />;
    case 'friends': return <Friends />;
    case 'moderation': return <Moderation />;
  }
}

export default function App() {
  const save = useGame((s) => s.save);
  const route = useUI((s) => s.stack[s.stack.length - 1]);
  const tab = useUI((s) => s.stack[0].name); // onglet de départ de la pile : sert à l'identité visuelle de chaque partie
  const depth = useUI((s) => s.stack.length);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    initSaveSystem()
      .then(() => setReady(true))
      .then(() => loadEvents(import.meta.env.BASE_URL))
      .catch((e) => setError(`Impossible d’accéder au stockage : ${e instanceof Error ? e.message : e}. Désactive la navigation privée.`));
  }, []);

  // Horloge du jeu : énergie, renouvellements quotidiens.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => useGame.getState().tick(), 1000);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => { if (save) configureAudio({ enabled: save.settings.sound, volume: save.settings.volume }); }, [save?.settings.sound, save?.settings.volume]);
  useEffect(() => { if (save) configureMusic({ enabled: save.settings.music, volume: save.settings.musicVolume }); }, [save?.settings.music, save?.settings.musicVolume]);
  // Musique : ambiance au menu, pulsation en combat ; coupée quand l'app passe en arrière-plan.
  // Le combat choisit lui-même son morceau (région, boss) ; ailleurs : Accueil, ou Invocation à l'Autel.
  // Chaque lieu a sa musique : Forge, Sanctuaire, Tour, Arène, Marché, Camp.
  useEffect(() => {
    if (!started || !save?.settings.music || route.name === 'battle') return;
    const place: Record<string, MusicMode> = { summon: 'summon', gear: 'forge', sanctuary: 'sanctuary', tower: 'tower', arena: 'arena', market: 'market', camp: 'camp' };
    playMusic(place[route.name] ?? 'menu');
  }, [started, route.name, save?.settings.music]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') stopMusic(); else if (started && useGame.getState().save?.settings.music) resumeMusic(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [started]);

  // Notification « mission accomplie » : dès qu'une nouvelle récompense devient réclamable.
  useEffect(() => {
    if (!started) return;
    let prev = useGame.getState().save ? claimableCount(useGame.getState().save!) : 0;
    let lastSave = useGame.getState().save;
    let lastToast = 0;
    const unsub = useGame.subscribe((st) => {
      if (!st.save || st.save === lastSave) return;
      // Partie chargée (code, fichier, compte) : on repart du nouveau compte, sans message.
      const swapped = !lastSave || lastSave.createdAt !== st.save.createdAt;
      lastSave = st.save;
      const n = claimableCount(st.save);
      // Pendant le tutoriel du début, pas de message par-dessus les éléments à toucher.
      const tutorial = inTutorial(st.save);
      // Au plus un message toutes les 3 minutes, et jamais sur l'écran des missions : la pastille suffit ensuite.
      const quiet = Date.now() - lastToast < 180_000 || useUI.getState().stack.at(-1)?.name === 'missions';
      if (n > prev && !tutorial && !swapped && !quiet) {
        lastToast = Date.now();
        const ui = useUI.getState();
        ui.toast(n - prev > 1 ? `${n - prev} missions accomplies : récompenses à réclamer.` : 'Mission accomplie : récompense à réclamer.', 'ok',
          { label: 'Voir', run: () => useUI.getState().push({ name: 'missions' }) }, 4000);
      }
      prev = n;
      const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
      try { if (n > 0) void nav.setAppBadge?.(n)?.catch(() => {}); else void nav.clearAppBadge?.()?.catch(() => {}); } catch { /* non pris en charge */ }
    });
    return unsub;
  }, [started]);

  // Notification « expédition de retour » : quand une expédition se termine (même pendant le jeu).
  useEffect(() => {
    if (!started) return;
    const st0 = useGame.getState();
    let prev = st0.save ? finishedExpeditions(st0.save, st0.now) : 0;
    return useGame.subscribe((st) => {
      if (!st.save) return;
      const n = finishedExpeditions(st.save, st.now);
      if (n > prev && useUI.getState().stack.at(-1)?.name !== 'expeditions') useUI.getState().toast('Une expédition est de retour : butin à récupérer.', 'ok', { label: 'Voir', run: () => useUI.getState().push({ name: 'expeditions' }) }, 6000);
      prev = n;
    });
  }, [started]);

  // Compte en ligne : reprise automatique de la connexion au démarrage (SDK chargé seulement si besoin).
  // Retour d'une connexion Google par redirection : on charge le compte pour lire le résultat.
  useEffect(() => {
    if (!started) return;
    let googleBack = false; try { googleBack = !!sessionStorage.getItem('aeonfall.googlePending'); } catch { /* */ }
    if (cloudWanted() || googleBack) void loadCloud().then((m) => { m.startCloud(); if (googleBack) void m.finishGoogleRedirect(); }).catch(() => {});
  }, [started]);

  // Retour par glissement depuis le bord gauche (comme les apps iPhone), sauf en combat.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipe.current = t.clientX < 24 && depth > 1 && route.name !== 'battle' ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = swipe.current; swipe.current = null;
    if (!st || document.querySelector('.modal-backdrop, .sheet-backdrop')) return;
    const t = e.changedTouches[0];
    if (t.clientX - st.x > 70 && Math.abs(t.clientY - st.y) < 60) useUI.getState().back();
  };

  const start = () => {
    unlockAudio();
    setStarted(true);
    setTimeout(() => play('claim'), 50);
    const s = useGame.getState();
    // Pas de calendrier pendant les premières minutes : l'histoire et le premier combat d'abord.
    if (s.save && !inTutorial(s.save) && canClaimDaily(s.save, s.now)) useUI.getState().push({ name: 'daily' });
  };

  return (
    <div data-tab={tab} className={`app ${save?.settings.reducedMotion ? 'reduced-motion' : ''} theme-v2`} onPointerDown={unlockAudio} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {!started || !save ? (
        <Title ready={ready && !!save} onStart={start} error={error} />
      ) : (
        <>
          <div key={`${depth}-${route.name}`} style={{ position: 'absolute', inset: 0 }}>
            <ErrorBoundary resetKey={`${depth}-${route.name}`}>
              <Suspense fallback={<div className="screen"><div className="bg-ambient" /></div>}>{renderRoute(route)}</Suspense>
            </ErrorBoundary>
          </div>
          {route.name !== 'battle' && <BgIndicator />}
          {route.name !== 'battle' && <BottomNav />}
          <CloudConflictModal />
          {(route.name === 'home' || route.name === 'combats' || route.name === 'campaign') && <UnlockAnnounce />}
          {(route.name === 'home' || route.name === 'collection' || route.name === 'summon') && <BondsIntro />}
          {route.name === 'home' && <AccountPrompt />}
          {route.name === 'home' && !save.flags.guide_done && <Guide />}
          {save.flags.guide_done && route.name !== 'battle' && needsName(save) && <NamePrompt />}
        </>
      )}
      <Toasts />
    </div>
  );
}

// CORRECTIF iPhone — bande vide en bas en mode application.
// Sur certaines versions d'iOS, le système réserve en bas une zone où la page ne peut rien afficher.
// Le jeu y ajoutait sa propre marge (barre d'accueil) : double espace vide. Quand cette réserve est
// détectée, la marge du jeu est supprimée (classe ios-bottom-reserved → --sab: 0).
function standalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
}

function measureInset(side: 'top' | 'bottom'): number {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;padding-${side}:env(safe-area-inset-${side},0px)`;
  document.body.appendChild(d);
  const v = parseFloat(getComputedStyle(d)[side === 'top' ? 'paddingTop' : 'paddingBottom']) || 0;
  d.remove();
  return v;
}

/** Un champ de saisie est actif (clavier ouvert) : rien ne doit alors bouger la page ni retirer le curseur. */
function typing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
}
/** Orientation réelle de l'appareil (le clavier peut changer la taille de la zone, pas l'orientation). */
const orientation = () => screen.orientation?.type ?? String((window as unknown as { orientation?: number }).orientation ?? '');

export function fixViewport() {
  const apply = () => {
    if (typing()) return; // le clavier change la hauteur de la zone : ce n'est pas une réserve d'iOS
    const portrait = window.innerHeight >= window.innerWidth;
    const screenH = Math.max(screen.height, screen.width);
    // Cas observé sur iPhone (app installée, barre d'état transparente) : la page passe sous la barre
    // d'état (marge du haut > 0) mais la zone d'affichage est raccourcie d'autant en bas, et ce bas
    // n'est pas affichable. Écran 932, zone 873, haut 59 : écart = marge du haut. La barre d'accueil
    // est alors déjà hors de la zone : la marge du bas du jeu est superflue.
    const gap = screenH - window.innerHeight;
    const top = measureInset('top');
    const reserved = standalone() && portrait && ((top > 0 && gap >= top - 2) || gap > 80);
    document.documentElement.classList.toggle('ios-bottom-reserved', reserved);
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 300));
  // Après une vraie rotation, iOS peut laisser la page légèrement défilée ou garder d'anciennes zones de toucher :
  // on remet la page en place et on force un nouveau calcul de la mise en page (v1.68.20).
  // v1.83.2 : jamais pendant une saisie, et sans plus jamais retirer le curseur d'un champ (sur iPhone, le clavier
  // s'ouvrait puis se refermait sans arrêt : impossible d'écrire dans le chat ou un code promo).
  let lastOrientation = orientation();
  const settle = () => {
    if (typing()) return;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
    const app = document.querySelector<HTMLElement>('.app');
    if (app) { app.style.transform = 'translateZ(0)'; void app.offsetHeight; requestAnimationFrame(() => { app.style.transform = ''; }); }
  };
  const onRotate = () => {
    const o = orientation();
    if (o && o === lastOrientation) return; // pas de vraie rotation (ex. clavier)
    lastOrientation = o;
    setTimeout(settle, 350); setTimeout(settle, 900);
  };
  window.addEventListener('orientationchange', onRotate);
  screen.orientation?.addEventListener?.('change', onRotate);
}

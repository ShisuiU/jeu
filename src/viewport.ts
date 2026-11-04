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

export function viewportInfo() {
  const portrait = window.innerHeight >= window.innerWidth;
  const screenH = portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width);
  return { app: standalone(), screenH, innerH: window.innerHeight, gap: screenH - window.innerHeight, top: measureInset('top'), bottom: measureInset('bottom'),
    reserved: document.documentElement.classList.contains('ios-bottom-reserved') };
}

export function fixViewport() {
  const apply = () => {
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
}

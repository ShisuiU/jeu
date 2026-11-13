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
  // Après une rotation, iOS peut laisser la page légèrement défilée ou garder d'anciennes zones de toucher :
  // on remet la page en place et on force un nouveau calcul de la mise en page (v1.68.20).
  const settle = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
    const el = document.activeElement as HTMLElement | null;
    if (el && el !== document.body && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) el.blur();
    const app = document.querySelector<HTMLElement>('.app');
    if (app) { app.style.transform = 'translateZ(0)'; void app.offsetHeight; requestAnimationFrame(() => { app.style.transform = ''; }); }
  };
  window.addEventListener('orientationchange', () => { setTimeout(settle, 350); setTimeout(settle, 900); });
  screen.orientation?.addEventListener?.('change', () => setTimeout(settle, 350));
  // v1.83.1 : l'ouverture du clavier redimensionne aussi la zone visible et iOS fait défiler la page pour montrer
  // le champ ; il ne faut alors surtout rien remettre en place (cela retirait le curseur et fermait le clavier :
  // impossible d'écrire dans le chat du clan).
  const typing = () => { const el = document.activeElement as HTMLElement | null; return !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable); };
  window.visualViewport?.addEventListener('resize', () => { if (!typing() && (window.scrollY || document.documentElement.scrollTop)) settle(); });
}

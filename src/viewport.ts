// CORRECTIF D'AFFICHAGE iPhone (mode application installée).
// Certaines versions d'iOS laissent une bande vide en bas : la zone d'affichage s'arrête avant le bas
// de l'écran, ou la marge de sécurité annoncée est bien plus grande que la barre d'accueil réelle.
// 1) La marge du bas est plafonnée en CSS (--sab, voir global.css).
// 2) Si la zone d'affichage est plus courte que l'écran, on étire l'application jusqu'en bas (--vgap).
function standalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
}

export function fixViewport() {
  const apply = () => {
    let gap = 0;
    if (standalone() && window.innerHeight >= window.innerWidth) {
      const screenH = Math.max(screen.height, screen.width);
      const d = screenH - window.innerHeight;
      if (d > 0 && d < 160) gap = d;
    }
    document.documentElement.style.setProperty('--vgap', `${gap}px`);
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 300));
}

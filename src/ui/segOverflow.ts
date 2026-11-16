// Onglets qui défilent (.seg) : la classe « ovf » est posée tant qu'il reste des onglets cachés à droite,
// pour afficher un fondu au lieu d'un mot coupé net. Rien n'est posé quand tout tient sur l'écran.
const update = (el: Element) => {
  const e = el as HTMLElement;
  e.classList.toggle('ovf', e.scrollWidth - e.clientWidth - e.scrollLeft > 4);
};
const scan = () => document.querySelectorAll('.seg').forEach(update);

export function watchSegOverflow(): void {
  let queued = false;
  const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; scan(); }); };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', later);
  document.addEventListener('scroll', (ev) => { const t = ev.target as Element | null; if (t && t instanceof Element && t.classList.contains('seg')) update(t); }, true);
  later();
}

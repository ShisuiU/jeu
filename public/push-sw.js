// Notifications (camp plein, énergie au maximum, cadeau d'un ami) : affichées même jeu fermé.
// Chargé par le service hors ligne du jeu (workbox importScripts).
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data ? event.data.text() : '' }; }
  const scope = self.registration.scope;
  event.waitUntil(self.registration.showNotification(d.title || 'Aeonfall', {
    body: d.body || '',
    icon: new URL('icons/icon-192.png', scope).href,
    badge: new URL('icons/icon-192.png', scope).href,
    tag: d.tag || 'aeonfall',
    lang: 'fr',
    data: { url: new URL(d.url || '.', scope).href },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) if ('focus' in w) return w.focus();
    return self.clients.openWindow(url);
  })());
});

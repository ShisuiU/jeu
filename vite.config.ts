/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// BASE_PATH permet l'hébergement dans un sous-dossier (ex. GitHub Pages : /jeu/).
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Aeonfall — Les Héritiers de la Fracture',
        short_name: 'Aeonfall',
        description: 'RPG de collection de héros au tour par tour. Jouable hors ligne.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#07060b',
        theme_color: '#07060b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tout le jeu (code, polices, illustrations) est pré-caché : jouable hors ligne après le 1er chargement.
        globPatterns: ['**/*.{js,css,html,woff2,png,webp,svg,json}'],
        // Les événements sont téléchargés frais à chaque lancement (repli : dernière version mémorisée).
        // Les illustrations des héros et des ennemis (~14 Mo) ne sont plus téléchargées d'un coup à l'installation :
        // chacune l'est quand elle s'affiche, puis reste en cache (jouable hors ligne pour tout ce qui a été vu).
        globIgnores: ['events.json', 'assets/full-*.webp', 'assets/portrait-*.webp', 'assets/battle-*.webp', 'assets/gear-*.webp', 'assets/res-*.webp'],
        runtimeCaching: [{
          urlPattern: /\/assets\/(full|portrait|battle|gear|res)-[^/]+\.webp$/,
          handler: 'CacheFirst',
          options: { cacheName: 'aeonfall-art', expiration: { maxEntries: 700, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        }],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Pages de connexion Google (servies par Firebase via vercel.json) : jamais remplacées par le jeu.
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        // Dès la première visite, le service hors ligne prend la main : les illustrations vues sont gardées tout de suite.
        clientsClaim: true,
        // Notifications : affichage et clic (public/push-sw.js).
        importScripts: ['push-sw.js'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

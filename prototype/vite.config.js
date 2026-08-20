import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/prototypes/forgeos/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        id: base,
        name: 'Forge OS',
        short_name: 'Forge OS',
        description: 'Forge OS prototype',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#0a0b0f',
        theme_color: '#0a0b0f',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache only the app shell. Mermaid, katex, cytoscape and the
        // highlight.js bundle are dynamically imported and are collectively
        // several MB — precaching them (the default `**/*.js`) would make a
        // first install download every diagram engine just to read a note.
        globPatterns: ['**/*.{css,html,png,svg,ico,woff2}'],
        // The entry chunk isn't precached either, but CacheFirst below stores it
        // on the first visit, so offline cold-start works from then on.
        runtimeCaching: [
          {
            // Lazy chunks: fetched on first use, then served from cache — so
            // opening a note with a diagram is slow once, instant after.
            urlPattern: ({ url }) => url.pathname.includes('/assets/') && url.pathname.endsWith('.js'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'forge-lazy-chunks',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            // API reads: fresh when online, last-known when not.
            urlPattern: ({ url }) => url.origin === 'https://api.domguy.dev',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forge-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});

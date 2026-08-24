import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // GitHub Pages serves project sites below /<repository>/; keep local
  // development at / while allowing the workflow to provide that prefix.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Slog — Health Tracker',
        short_name: 'Slog',
        description: 'Local-first privacy health and fitness tracker',
        version,
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f6f7f8',
        theme_color: '#7f9d77',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            // Google accounts / Drive API — NetworkOnly (never cache auth)
            urlPattern: /^https:\/\/(accounts\.google\.com|www\.googleapis\.com)\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
});

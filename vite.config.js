import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves project sites below /<repository>/; keep local
  // development at / while allowing the workflow to provide that prefix.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: false, // we serve our own public/manifest.json
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

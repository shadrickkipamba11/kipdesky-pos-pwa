// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Kipdesky POS',
        short_name: 'KipdeskyPOS',
        description: 'Point of Sale System',
        start_url: '/',           // ⬅️ SPA should boot from /
        scope: '/',               // ⬅️ makes routing consistent
        display: 'standalone',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html', // ⬅️ SPA shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          // Cache-first for same-origin static images/icons
          {
            urlPattern: ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/icons/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'icons-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Network-first for GET /api/* (do NOT cache POST/PUT/DELETE here)
          {
            urlPattern: ({url, request}) => url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 5 }
            }
          }
        ]
      },
      devOptions: { enabled: true } // simple dev SW
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://app.kipdesky.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})

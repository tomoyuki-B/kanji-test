import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/kanji-test/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'data/*.json',
      ],
      manifest: {
        name: '漢字テスト',
        short_name: '漢字テスト',
        description: '小学校で学ぶ漢字のテストアプリ',
        theme_color: '#534AB7',
        background_color: '#f0f9ff',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ja',
        scope: '/kanji-test/',
        start_url: '/kanji-test/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,woff,woff2}',
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: '/kanji-test/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})

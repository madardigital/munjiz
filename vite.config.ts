import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'منجِز — تنظيم تكليفات الطلاب',
        short_name: 'منجِز',
        description: 'نظّم تكليفاتك ومهامك ومواعيد التسليم من الهاتف.',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#12365a',
        background_color: '#f5f7fb',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ]
})

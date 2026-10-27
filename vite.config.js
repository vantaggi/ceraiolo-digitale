import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/ceraiolo-digitale/',
  plugins: [
    vue(),
    vueDevTools(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm.wasm',
          dest: '',
        },
        {
          // Caratteri standard per l'anteprima delle tessere (pdf.js)
          src: 'node_modules/pdfjs-dist/standard_fonts/*',
          dest: 'pdfjs/standard_fonts',
        },
      ],
    }),
    // App installabile: il service worker salva l'app nel browser, cosi' dopo la prima
    // apertura online funziona anche senza connessione
    VitePWA({
      // Senza ricaricare la pagina: la nuova versione parte quando l'app viene riaperta
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Ceraiolo Digitale',
        short_name: 'Ceraiolo',
        description: 'Tesseramento dei Ceraioli, anche senza connessione',
        lang: 'it',
        display: 'standalone',
        // Stessi colori di --color-background e --color-accent in main.css
        background_color: '#f4f5f7',
        theme_color: '#b71c1c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Tutto quello che serve offline: codice, sql-wasm.wasm, caratteri di pdf.js e dell'app
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,jpg,svg,wasm,pfb,ttf,woff,woff2}'],
        // pdf.worker e il codice principale superano il limite predefinito di 2 MB
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/nuxt.css'],
  runtimeConfig: {
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || 'http://webserver/api',
    baseDomain: process.env.NUXT_BASE_DOMAIN || 'deliveriano.ch',
    defaultRestaurant: process.env.NUXT_DEFAULT_RESTAURANT || '',
    public: {
      apiBase: '/api',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      ownerPortalUrl: 'https://backend.deliveriano.ch/vondo-admin',
      baseDomain: process.env.NUXT_BASE_DOMAIN || 'deliveriano.ch',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#c95028' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      runtimeCaching: [{
        // Exclude precise-location discovery responses from shared service-worker caching
        urlPattern: /\/api\/v1\/discovery\//,
        handler: 'NetworkOnly',
      }, {
        urlPattern: /\/api\/v1\/storefront\/bootstrap(?:\?|$)/,
        handler: 'NetworkFirst',
        options: { cacheName: 'tenant-bootstrap', networkTimeoutSeconds: 4, expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
      }, {
        urlPattern: /\/api\/v1\/storefront\/menus(?:\/|\?|$)/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'tenant-catalog', expiration: { maxEntries: 100, maxAgeSeconds: 3600 } },
      }],
    },
    client: { installPrompt: true },
  },
  nitro: { compressPublicAssets: true },
  // `npm run typecheck` is the single type-check gate. Running vue-tsc again
  // inside Vite mixes --project with generated entry files on Windows.
  typescript: { typeCheck: false, strict: true },
})

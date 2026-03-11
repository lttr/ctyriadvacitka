export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    "@nuxthub/core",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/plausible",
    "@nuxtjs/seo",
    "@lttr/nuxt-puleo",
    "@vueuse/nuxt",
    "nuxt-security",
  ],

  experimental: {
    typedPages: true,
  },

  hub: {
    blob: true,
    db: "sqlite",
  },

  plausible: {
    autoPageviews: true,
  },

  site: {
    indexable: false,
  },

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
    exclude: [
      "/administrace/**",
      "/ucet/**",
      "/prihlaseni",
      "/registrace",
      "/odhlasit",
    ],
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        "img-src": ["'self'", "data:", "blob:"],
        "script-src": ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'"],
        "frame-src": ["'self'", "https://calendar.google.com"],
      },
      crossOriginEmbedderPolicy: "unsafe-none",
    },
  },

  devtools: { enabled: true },
  compatibilityDate: "2026-03-04",
})

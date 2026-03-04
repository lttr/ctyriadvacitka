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

  devtools: { enabled: true },
  compatibilityDate: "2026-03-04",
})

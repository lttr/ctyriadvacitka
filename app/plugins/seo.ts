const DEFAULT_SITE_NAME = "Čtyřiadvacítka"
const DEFAULT_DESCRIPTION = "Webové stránky 24. oddílu Junáka v Hradci Králové"

export function buildSeoDefaults(siteName: string) {
  return {
    ogSiteName: siteName || DEFAULT_SITE_NAME,
    ogType: "website" as const,
    description: DEFAULT_DESCRIPTION,
  }
}

export default defineNuxtPlugin(() => {
  const { settings } = useSiteSettings()

  const seoDefaults = computed(() => buildSeoDefaults(settings.value.siteName))

  useSeoMeta({
    ogSiteName: () => seoDefaults.value.ogSiteName,
    ogType: seoDefaults.value.ogType,
    description: () => seoDefaults.value.description,
  })
})

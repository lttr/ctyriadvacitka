export interface SiteSettings {
  siteName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  introArticleId: string
  googleCalendarId: string
}

const defaultSettings: SiteSettings = {
  siteName: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  introArticleId: "",
  googleCalendarId: "",
}

export function parseSiteSettings(
  raw: Record<string, string> | null | undefined,
): SiteSettings {
  if (!raw) {return { ...defaultSettings }}

  return {
    siteName: raw.siteName ?? "",
    contactEmail: raw.contactEmail ?? "",
    contactPhone: raw.contactPhone ?? "",
    contactAddress: raw.contactAddress ?? "",
    introArticleId: raw.introArticleId ?? "",
    googleCalendarId: raw.googleCalendarId ?? "",
  }
}

export function useSiteSettings() {
  const { data: rawSettings } = useFetch("/api/settings")

  const settings = computed(() =>
    parseSiteSettings(
      rawSettings.value as Record<string, string> | null | undefined,
    ),
  )

  return { settings }
}

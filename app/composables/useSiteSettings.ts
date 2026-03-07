import type { ContactPerson } from "~~/shared/types/contact"

export interface SiteSettings {
  siteName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  introArticleId: string
  googleCalendarId: string
  contactInfo: ContactPerson[]
}

const defaultSettings: SiteSettings = {
  siteName: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  introArticleId: "",
  googleCalendarId: "",
  contactInfo: [],
}

export function parseContactInfo(
  raw: string | undefined | null,
): ContactPerson[] {
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed as ContactPerson[]
    }
    return []
  } catch {
    return []
  }
}

export function parseSiteSettings(
  raw: Record<string, string> | null | undefined,
): SiteSettings {
  if (!raw) {
    return { ...defaultSettings }
  }

  return {
    siteName: raw.siteName ?? "",
    contactEmail: raw.contactEmail ?? "",
    contactPhone: raw.contactPhone ?? "",
    contactAddress: raw.contactAddress ?? "",
    introArticleId: raw.introArticleId ?? "",
    googleCalendarId: raw.googleCalendarId ?? "",
    contactInfo: parseContactInfo(raw.contactInfo),
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

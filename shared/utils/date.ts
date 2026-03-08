export function formatCzechDate(datetime: string | undefined | null): string {
  if (!datetime) {
    return ""
  }
  return new Date(datetime).toLocaleDateString("cs-CZ")
}

export function formatCzechDateTime(
  datetime: string | undefined | null,
): string {
  if (!datetime) {
    return ""
  }
  const date = new Date(datetime)
  const dateStr = date.toLocaleDateString("cs-CZ")
  const timeStr = date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${dateStr} ${timeStr}`
}

export function formatRelativeDate(
  datetime: string | undefined | null,
): string {
  if (!datetime) {
    return ""
  }

  const date = new Date(datetime)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return "právě teď"
  }
  if (diffMinutes < 60) {
    return `před ${diffMinutes} min`
  }
  if (diffHours < 24) {
    return `před ${diffHours} hod`
  }
  if (diffDays < 7) {
    return `před ${diffDays} dny`
  }

  return formatCzechDate(datetime)
}

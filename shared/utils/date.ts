export function formatCzechDate(datetime: string | undefined | null): string {
  if (!datetime) {
    return ""
  }
  return new Date(datetime).toLocaleDateString("cs-CZ")
}

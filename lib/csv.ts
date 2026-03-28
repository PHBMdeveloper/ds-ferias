export function escapeCsvFormulas(value: string | null | undefined): string {
  if (!value) return "";
  const sanitized = String(value)
    .replace(/;/g, ",")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ");
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    return "'" + sanitized;
  }
  return sanitized;
}

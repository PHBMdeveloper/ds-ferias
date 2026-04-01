export function escapeCsvFormulas(value: string | null | undefined): string {
  if (!value) return "";

  let sanitized = String(value).replace(/;/g, ",");
  sanitized = sanitized.replace(/[\n\r]/g, " ");

  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  return sanitized;
}

/**
 * Sanitizes values for CSV export to prevent Formula Injection (CSV Injection).
 * Replaces semicolons (;) with commas (,) to maintain CSV structure.
 * Replaces newlines (\n) and carriage returns (\r) with spaces to prevent row injection.
 * Prepends a single quote (') to strings starting with '=', '+', '-', '@', '\t', or '\r'.
 * @param value The value to sanitize.
 * @returns The sanitized string.
 */
export function escapeCsvFormulas(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";

  let sanitized = String(value);

  // Prevent breaking CSV columns and rows
  sanitized = sanitized.replace(/;/g, ",").replace(/[\n\r]+/g, " ");

  // Prevent Formula Injection
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  return sanitized;
}

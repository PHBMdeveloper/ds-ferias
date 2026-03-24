export function escapeCsvFormulas(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[@=+\-]/.test(str)) {
    return "'" + str;
  }
  return str;
}

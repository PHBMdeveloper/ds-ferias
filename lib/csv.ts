export function escapeCsvFormulas(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Prevent row injection by replacing newlines and carriage returns with spaces
  str = str.replace(/[\n\r]+/g, " ");

  // Replace semicolons with commas to avoid breaking the CSV format since we use semicolons as separators
  str = str.replace(/;/g, ",");

  // Prevent formula injection (CSV Injection)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return str;
}

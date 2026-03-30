export function escapeCsvFormulas(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Replace semicolons with commas to avoid breaking CSV columns
  str = str.replace(/;/g, ",");

  // Replace newlines and carriage returns with spaces to prevent row injection
  str = str.replace(/[\n\r]+/g, " ");

  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  return str;
}

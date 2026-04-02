export function escapeCsvFormulas(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  let str = String(value);

  // Replace semicolons with commas to prevent cell injection,
  // and replace newlines with spaces to prevent row injection.
  str = str.replace(/;/g, ",").replace(/[\r\n]+/g, " ");

  // Prevent Formula Injection (CSV Injection)
  // If the value starts with '=', '+', '-', '@', '\t', or '\r', prepend a single quote.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return str;
}

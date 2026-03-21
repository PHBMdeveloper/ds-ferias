export function escapeCsvFormulas(value: string | null | undefined): string {
  if (!value) return "";
  const strValue = String(value);
  const firstChar = strValue.charAt(0);

  // Characters that trigger formula execution in Excel, LibreOffice Calc, etc.
  if (["=", "+", "-", "@", "\t", "\r"].includes(firstChar)) {
    return "'" + strValue;
  }
  return strValue;
}

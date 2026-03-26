export function escapeCsvFormulas(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Se o valor começa com um caractere perigoso, adiciona um apóstrofo
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    return `'${stringValue}`;
  }

  return stringValue;
}

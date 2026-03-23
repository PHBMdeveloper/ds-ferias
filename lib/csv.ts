export function escapeCsvFormulas(value: string | null | undefined): string {
  if (!value) return "";
  const v = value.toString();
  // Se o valor começar com caracteres que acionam fórmulas no Excel
  if (/^[=+\-@]/.test(v)) {
    return `'${v}`;
  }
  return v;
}

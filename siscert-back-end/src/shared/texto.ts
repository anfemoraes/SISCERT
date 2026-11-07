/** Maiúsculas, sem acentos e sem espaços repetidos. Use ao gravar e ao buscar. */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Neutraliza \, % e _ para o texto digitado não virar curinga no LIKE. */
export function escaparLike(valor: string): string {
  return valor.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Padrão "contém" para LIKE: normaliza, escapa e envolve com %. */
export function padraoContem(valor: string): string {
  return `%${escaparLike(normalizarTexto(valor))}%`;
}

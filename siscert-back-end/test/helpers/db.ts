import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../src/db/schema.js';

/** Banco Postgres em memória (WASM), com as migrações reais aplicadas. Não precisa do Supabase. */
export async function criarBancoDeTeste() {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  return db;
}

/** Gera um CPF válido a partir de um número base de 9 dígitos. */
export function gerarCpf(base: number): string {
  const d = String(base).padStart(9, '0').split('').map(Number);
  for (const tamanho of [9, 10]) {
    const soma = d.reduce((acc, n, i) => acc + n * (tamanho + 1 - i), 0);
    d.push(((soma * 10) % 11) % 10);
  }
  return d.join('');
}

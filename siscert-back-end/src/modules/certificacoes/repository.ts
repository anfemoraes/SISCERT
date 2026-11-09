import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { certificacoes, sequencias } from '../../db/schema.js';
import type * as schema from '../../db/schema.js';
import { padraoContem } from '../../shared/texto.js';

// Aceita tanto o banco (postgres-js) quanto uma transação ou o PGlite dos testes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

export type Curso = (typeof certificacoes.curso.enumValues)[number];
export type LinhaCertificacao = typeof certificacoes.$inferSelect;
export type NovaLinha = typeof certificacoes.$inferInsert;

/**
 * Incrementa o contador de curso/ano de forma atômica. A linha fica travada até o fim da
 * transação: cadastros simultâneos não repetem número e, se a transação falhar, o número
 * volta junto (sem buracos na sequência).
 */
export async function proximoNumero(db: Db, curso: Curso, ano: number): Promise<number> {
  const [linha] = await db
    .insert(sequencias)
    .values({ curso, ano, ultimo: 1 })
    .onConflictDoUpdate({
      target: [sequencias.curso, sequencias.ano],
      set: { ultimo: sql`${sequencias.ultimo} + 1` },
    })
    .returning({ ultimo: sequencias.ultimo });
  return linha!.ultimo;
}

export async function inserir(db: Db, valores: NovaLinha): Promise<LinhaCertificacao> {
  const [linha] = await db.insert(certificacoes).values(valores).returning();
  return linha!;
}

export interface FiltrosBusca {
  nome?: string | undefined;
  cpf?: string | undefined;
  municipio?: string | undefined;
  curso?: Curso | undefined;
  codigo?: string | undefined;
  todos?: string | undefined;
  pagina: number;
  tamanho: number;
}

export async function buscar(db: Db, f: FiltrosBusca) {
  const cond: SQL[] = [];
  if (f.nome) {
    cond.push(sql`${certificacoes.nomeBusca} LIKE ${padraoContem(f.nome)} ESCAPE '\\'`);
  }
  if (f.municipio) {
    cond.push(sql`${certificacoes.municipioBusca} LIKE ${padraoContem(f.municipio)} ESCAPE '\\'`);
  }
  if (f.cpf) cond.push(eq(certificacoes.cpf, f.cpf));
  if (f.curso) cond.push(eq(certificacoes.curso, f.curso));
  if (f.codigo) cond.push(eq(certificacoes.codigo, f.codigo.toUpperCase()));
  const where = cond.length > 0 ? and(...cond) : undefined;

  const [contagem] = await db.select({ total: count() }).from(certificacoes).where(where);
  const itens = await db
    .select()
    .from(certificacoes)
    .where(where)
    .orderBy(asc(certificacoes.nomeBusca), asc(certificacoes.id))
    .limit(f.tamanho)
    .offset((f.pagina - 1) * f.tamanho);

  return { total: contagem?.total ?? 0, itens };
}

export async function porCodigo(db: Db, codigo: string): Promise<LinhaCertificacao | undefined> {
  const [linha] = await db.select().from(certificacoes).where(eq(certificacoes.codigo, codigo));
  return linha;
}

export async function porId(db: Db, id: number): Promise<LinhaCertificacao | undefined> {
  const [linha] = await db.select().from(certificacoes).where(eq(certificacoes.id, id));
  return linha;
}

export async function atualizar(
  db: Db,
  id: number,
  valores: Partial<NovaLinha>,
): Promise<LinhaCertificacao | undefined> {
  const [linha] = await db
    .update(certificacoes)
    .set(valores)
    .where(eq(certificacoes.id, id))
    .returning();
  return linha;
}

export async function excluir(db: Db, id: number): Promise<boolean> {
  const resultado = await db.delete(certificacoes).where(eq(certificacoes.id, id)).returning({ id: certificacoes.id });
  return resultado.length > 0;
}

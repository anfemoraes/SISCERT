import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const cursoEnum = pgEnum('curso', ['CFAT', 'CFATR', 'CAAT', 'CAATR']);
export const resultadoEnum = pgEnum('resultado', ['APROVADO', 'REPROVADO']);

export const certificacoes = pgTable(
  'certificacoes',
  {
    id: serial('id').primaryKey(),

    // Só recebe valor quando o resultado é APROVADO. Nulos repetidos são permitidos pelo UNIQUE.
    codigo: varchar('codigo', { length: 20 }).unique(),
    curso: cursoEnum('curso').notNull(),
    ano: integer('ano').notNull(),
    numero: integer('numero'),

    municipio: varchar('municipio', { length: 120 }).notNull(),
    municipioBusca: varchar('municipio_busca', { length: 120 }).notNull(),
    periodoInicio: date('periodo_inicio', { mode: 'string' }).notNull(),
    periodoFim: date('periodo_fim', { mode: 'string' }).notNull(),

    nome: varchar('nome', { length: 200 }).notNull(),
    nomeBusca: varchar('nome_busca', { length: 200 }).notNull(),
    cargoFuncao: varchar('cargo_funcao', { length: 120 }).notNull(),
    cpf: varchar('cpf', { length: 11 }).notNull(), // somente dígitos

    frequencia: numeric('frequencia', { precision: 5, scale: 2 }).notNull(),
    // Nulas porque os cursos de atualização (CAAT/CAATR) não têm nota
    notaAd: numeric('nota_ad', { precision: 5, scale: 2 }),
    notaOd: numeric('nota_od', { precision: 5, scale: 2 }),
    notaAf: numeric('nota_af', { precision: 5, scale: 2 }),
    mediaFinal: numeric('media_final', { precision: 5, scale: 2 }),
    resultado: resultadoEnum('resultado').notNull(),

    observacoes: text('observacoes'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('uq_concluinte_curso').on(t.cpf, t.curso, t.periodoInicio, t.periodoFim),
    index('idx_certificacoes_cpf').on(t.cpf),
    index('idx_certificacoes_nome_busca').on(t.nomeBusca),
    index('idx_certificacoes_municipio_busca').on(t.municipioBusca),
  ],
);

// Contador por curso/ano, usado para gerar o número sequencial do código
export const sequencias = pgTable(
  'sequencias',
  {
    curso: cursoEnum('curso').notNull(),
    ano: integer('ano').notNull(),
    ultimo: integer('ultimo').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.curso, t.ano] })],
);

export type Certificacao = typeof certificacoes.$inferSelect;
export type NovaCertificacao = typeof certificacoes.$inferInsert;

import { z } from 'zod';
import { cpfValido, soDigitos } from '../../shared/cpf.js';

export const CURSOS = ['CFAT', 'CFATR', 'CAAT', 'CAATR'] as const;
/** Ajuste se a escala de notas do CETRAN for outra (ex.: 100). */
export const NOTA_MAXIMA = 10;
/** Item 6.3 do Anexo I e 6.6 do Anexo II da Res. 004/2025. */
export const MAX_POR_ATA = 50;

const texto = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((s) => s.replace(/\s+/g, ' '));

const textoComMarcador = (max: number) =>
  z.preprocess(
    (valor) => (valor === undefined || valor === null ? 'XXXXXX' : valor),
    z
      .string()
      .trim()
      .transform((s) => s.replace(/\s+/g, ' ') || 'XXXXXX')
      .pipe(z.string().max(max)),
  );

const nota = z.number().min(0).max(NOTA_MAXIMA);

const cpf = z
  .string()
  .transform(soDigitos)
  .refine(cpfValido, { message: 'CPF inválido' });

const concluinteSchema = z.object({
  nome: textoComMarcador(200),
  cargoFuncao: textoComMarcador(120),
  cpf,
  frequencia: z.number().min(0).max(100).nullable().optional(),
  notaAd: nota.nullable().optional(),
  notaOd: nota.nullable().optional(),
  notaAf: nota.nullable().optional(),
  mediaFinal: nota.nullable().optional(),
  resultado: z.enum(['APROVADO', 'REPROVADO']).nullable().optional(),
  observacoes: textoComMarcador(500),
});

export const ataSchema = z
  .object({
    curso: z.enum(CURSOS),
    municipio: texto(2, 120),
    periodoInicio: z.iso.date(),
    periodoFim: z.iso.date(),
    concluintes: z.array(concluinteSchema).min(1).max(MAX_POR_ATA),
  })
  .superRefine((ata, ctx) => {
    if (ata.periodoFim < ata.periodoInicio) {
      ctx.addIssue({
        code: 'custom',
        path: ['periodoFim'],
        message: 'periodoFim não pode ser anterior a periodoInicio',
      });
    }

    const vistos = new Set<string>();
    ata.concluintes.forEach((c, i) => {
      if (vistos.has(c.cpf)) {
        ctx.addIssue({
          code: 'custom',
          path: ['concluintes', i, 'cpf'],
          message: 'CPF repetido na mesma ata',
        });
      }
      vistos.add(c.cpf);
    });
  });

export type AtaInput = z.infer<typeof ataSchema>;

export const certificacaoSchema = z.object({
  id: z.number(),
  codigo: z.string().nullable(),
  curso: z.enum(CURSOS),
  municipio: z.string(),
  periodoInicio: z.string(),
  periodoFim: z.string(),
  nome: z.string(),
  cargoFuncao: z.string(),
  cpf: z.string().describe('CPF mascarado'),
  frequencia: z.number().nullable(),
  notaAd: z.number().nullable(),
  notaOd: z.number().nullable(),
  notaAf: z.number().nullable(),
  mediaFinal: z.number().nullable(),
  resultado: z.enum(['APROVADO', 'REPROVADO']).nullable(),
  observacoes: z.string().nullable(),
});

export type CertificacaoDto = z.infer<typeof certificacaoSchema>;

export const paginaSchema = z.object({
  total: z.number(),
  pagina: z.number(),
  tamanho: z.number(),
  itens: z.array(certificacaoSchema),
});

export const buscaSchema = z
  .object({
    nome: z.string().trim().min(2).optional(),
    cpf: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : soDigitos(v)))
      .refine((v) => v === undefined || v.length === 11, { message: 'CPF deve ter 11 dígitos' }),
    municipio: z.string().trim().min(2).optional(),
    curso: z.enum(CURSOS).optional(),
    codigo: z.string().trim().optional(),
    todos: z.string().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    tamanho: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => q.nome || q.cpf || q.municipio || q.curso || q.codigo || q.todos, {
    message: 'Informe ao menos um filtro: nome, cpf, município, curso ou código',
  });

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'ID deve ser um número positivo' }),
});

export const atualizarCertificacaoSchema = z
  .object({
    nome: textoComMarcador(200).optional(),
    cargoFuncao: textoComMarcador(120).optional(),
    cpf: z
      .string()
      .transform(soDigitos)
      .refine(cpfValido, { message: 'CPF inválido' })
      .optional(),
    municipio: texto(2, 120).optional(),
    curso: z.enum(CURSOS).optional(),
    periodoInicio: z.iso.date().optional(),
    periodoFim: z.iso.date().optional(),
    frequencia: z.number().min(0).max(100).nullable().optional(),
    notaAd: nota.nullable().optional(),
    notaOd: nota.nullable().optional(),
    notaAf: nota.nullable().optional(),
    mediaFinal: nota.nullable().optional(),
    resultado: z.enum(['APROVADO', 'REPROVADO']).nullable().optional(),
    observacoes: textoComMarcador(500).optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.periodoInicio && dados.periodoFim && dados.periodoFim < dados.periodoInicio) {
      ctx.addIssue({
        code: 'custom',
        path: ['periodoFim'],
        message: 'periodoFim não pode ser anterior a periodoInicio',
      });
    }
  });

export type AtualizarCertificacaoInput = z.infer<typeof atualizarCertificacaoSchema>;

export const exclusaoRespostaSchema = z.object({
  ok: z.boolean(),
  mensagem: z.string(),
});

export const codigoParamsSchema = z.object({
  codigo: z
    .string()
    .transform((s) => s.toUpperCase())
    .refine((s) => /^(CFATR|CFAT|CAATR|CAAT)\d{4}\.\d{4,}$/.test(s), {
      message: 'Formato de código inválido (ex.: CAAT2025.0001)',
    }),
});

export const erroSchema = z.object({
  erro: z.string(),
  detalhes: z.array(z.object({ campo: z.string(), mensagem: z.string() })).optional(),
});

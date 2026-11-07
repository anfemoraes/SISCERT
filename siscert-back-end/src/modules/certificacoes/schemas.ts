import { z } from 'zod';
import { cpfValido, soDigitos } from '../../shared/cpf.js';

export const CURSOS = ['CFAT', 'CFATR', 'CAAT', 'CAATR'] as const;
/** Cursos de formação exigem notas; os de atualização são avaliados por observação (Res. 004/2025). */
export const CURSOS_COM_NOTA: readonly string[] = ['CFAT', 'CFATR'];
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

const nota = z.number().min(0).max(NOTA_MAXIMA);

const cpf = z
  .string()
  .transform(soDigitos)
  .refine(cpfValido, { message: 'CPF inválido' });

const concluinteSchema = z.object({
  nome: texto(3, 200),
  cargoFuncao: texto(2, 120),
  cpf,
  frequencia: z.number().min(0).max(100),
  notaAd: nota.optional(),
  notaOd: nota.optional(),
  notaAf: nota.optional(),
  mediaFinal: nota.optional(),
  resultado: z.enum(['APROVADO', 'REPROVADO']),
  observacoes: z.string().trim().max(500).optional(),
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

      if (CURSOS_COM_NOTA.includes(ata.curso)) {
        for (const campo of ['notaAd', 'notaOd', 'notaAf', 'mediaFinal'] as const) {
          if (c[campo] === undefined) {
            ctx.addIssue({
              code: 'custom',
              path: ['concluintes', i, campo],
              message: 'Obrigatório para cursos de formação (CFAT e CFATR)',
            });
          }
        }
      }
    });
  });

export type AtaInput = z.infer<typeof ataSchema>;

export const certificacaoSchema = z.object({
  codigo: z.string().nullable(),
  curso: z.enum(CURSOS),
  municipio: z.string(),
  periodoInicio: z.string(),
  periodoFim: z.string(),
  nome: z.string(),
  cargoFuncao: z.string(),
  cpf: z.string().describe('CPF mascarado'),
  frequencia: z.number(),
  notaAd: z.number().nullable(),
  notaOd: z.number().nullable(),
  notaAf: z.number().nullable(),
  mediaFinal: z.number().nullable(),
  resultado: z.enum(['APROVADO', 'REPROVADO']),
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
    pagina: z.coerce.number().int().min(1).default(1),
    tamanho: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => q.nome || q.cpf || q.municipio || q.curso, {
    message: 'Informe ao menos um filtro: nome, cpf, município ou curso',
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

import { describe, expect, it } from 'vitest';
import { ataSchema, buscaSchema, codigoParamsSchema } from '../src/modules/certificacoes/schemas.js';
import { gerarCpf } from './helpers/db.js';

const concluinte = (n: number, extra = {}) => ({
  nome: `Agente ${n} da Silva`,
  cargoFuncao: 'Agente de Trânsito',
  cpf: gerarCpf(100000 + n),
  frequencia: 90,
  resultado: 'APROVADO' as const,
  ...extra,
});

const ata = (curso: string, concluintes: unknown[]) => ({
  curso,
  municipio: 'Belém',
  periodoInicio: '2025-10-01',
  periodoFim: '2025-10-10',
  concluintes,
});

describe('ataSchema', () => {
  it('aceita atualização sem notas', () => {
    expect(ataSchema.safeParse(ata('CAAT', [concluinte(1)])).success).toBe(true);
  });

  it('exige notas na formação', () => {
    const r = ataSchema.safeParse(ata('CFAT', [concluinte(1)]));
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join('.'))).toContain('concluintes.0.notaAd');
  });

  it('aceita formação com todas as notas', () => {
    const c = concluinte(1, { notaAd: 8, notaOd: 8, notaAf: 9, mediaFinal: 8.5 });
    expect(ataSchema.safeParse(ata('CFATR', [c])).success).toBe(true);
  });

  it('limpa a pontuação do CPF', () => {
    const cpf = gerarCpf(123456);
    const formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    const r = ataSchema.parse(ata('CAAT', [concluinte(1, { cpf: formatado })]));
    expect(r.concluintes[0]!.cpf).toBe(cpf);
  });

  it('recusa CPF inválido, CPF repetido, período invertido e mais de 50 concluintes', () => {
    expect(ataSchema.safeParse(ata('CAAT', [concluinte(1, { cpf: '11111111111' })])).success).toBe(false);
    expect(ataSchema.safeParse(ata('CAAT', [concluinte(1), concluinte(1)])).success).toBe(false);
    expect(
      ataSchema.safeParse({ ...ata('CAAT', [concluinte(1)]), periodoFim: '2025-09-01' }).success,
    ).toBe(false);
    const muitos = Array.from({ length: 51 }, (_, i) => concluinte(i));
    expect(ataSchema.safeParse(ata('CAAT', muitos)).success).toBe(false);
  });

  it('recusa data inexistente', () => {
    expect(ataSchema.safeParse({ ...ata('CAAT', [concluinte(1)]), periodoFim: '2025-02-31' }).success).toBe(false);
  });
});

describe('buscaSchema', () => {
  it('exige ao menos um filtro', () => {
    expect(buscaSchema.safeParse({}).success).toBe(false);
    expect(buscaSchema.safeParse({ curso: 'CAAT' }).success).toBe(true);
    expect(buscaSchema.safeParse({ nome: 'ma' }).success).toBe(true);
  });
  it('exige CPF com 11 dígitos', () => {
    expect(buscaSchema.safeParse({ cpf: '123' }).success).toBe(false);
    expect(buscaSchema.parse({ cpf: '529.982.247-25' }).cpf).toBe('52998224725');
  });
});

describe('codigoParamsSchema', () => {
  it('normaliza e valida o formato', () => {
    expect(codigoParamsSchema.parse({ codigo: 'caat2025.0001' }).codigo).toBe('CAAT2025.0001');
    expect(codigoParamsSchema.safeParse({ codigo: 'XYZ' }).success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { cpfValido, mascararCpf, soDigitos } from '../src/shared/cpf.js';
import { escaparLike, normalizarTexto, padraoContem } from '../src/shared/texto.js';

describe('cpf', () => {
  it('aceita CPF válido', () => expect(cpfValido('52998224725')).toBe(true));
  it('recusa dígito verificador errado', () => expect(cpfValido('52998224724')).toBe(false));
  it('recusa sequência repetida', () => expect(cpfValido('11111111111')).toBe(false));
  it('recusa tamanho errado e letras', () => {
    expect(cpfValido('123')).toBe(false);
    expect(cpfValido('5299822472a')).toBe(false);
  });
  it('limpa pontuação', () => expect(soDigitos('529.982.247-25')).toBe('52998224725'));
  it('mascara', () => expect(mascararCpf('52998224725')).toBe('***.982.247-**'));
});

describe('texto', () => {
  it('normaliza acento, caixa e espaços', () =>
    expect(normalizarTexto('  João   d’Ávila ')).toBe('JOAO D’AVILA'));
  it('escapa curingas', () => expect(escaparLike('50%_a\\b')).toBe('50\\%\\_a\\\\b'));
  it('monta padrão contém', () => expect(padraoContem('são')).toBe('%SAO%'));
});

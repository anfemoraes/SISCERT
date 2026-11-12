import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { criarBancoDeTeste, gerarCpf } from './helpers/db.js';

const CHAVE = 'chave-de-teste-com-16+';
let app: FastifyInstance;

const concluinte = (n: number, extra = {}) => ({
  nome: `Agente ${n} da Silva`,
  cargoFuncao: 'Agente de Trânsito',
  cpf: gerarCpf(200000 + n),
  frequencia: 90,
  resultado: 'APROVADO',
  ...extra,
});

const ata = (concluintes: unknown[], extra = {}) => ({
  curso: 'CAAT',
  municipio: 'Belém',
  periodoInicio: '2025-10-01',
  periodoFim: '2025-10-10',
  concluintes,
  ...extra,
});

const cadastrar = (corpo: unknown, chave: string | null = CHAVE) =>
  app.inject({
    method: 'POST',
    url: '/atas',
    headers: chave ? { 'x-api-key': chave } : {},
    payload: corpo as object,
  });

beforeAll(async () => {
  app = await buildApp({
    db: await criarBancoDeTeste(),
    apiKey: CHAVE,
    corsOrigins: [],
    limites: { busca: 10_000, verificacao: 10_000, cadastro: 10_000 },
    logger: false,
  });
});
afterAll(() => app.close());

describe('API', () => {
  it('/health responde', async () => {
    expect((await app.inject('/health')).json()).toEqual({ status: 'ok' });
  });

  it('cadastro exige a chave', async () => {
    expect((await cadastrar(ata([concluinte(1)]), null)).statusCode).toBe(401);
    expect((await cadastrar(ata([concluinte(1)]), 'errada')).statusCode).toBe(401);
  });

  it('gera códigos sequenciais só para aprovados e mascara o CPF', async () => {
    const r = await cadastrar(
      ata([
        concluinte(1),
        concluinte(2, { resultado: 'REPROVADO' }),
        concluinte(3, { nome: 'João d’Ávila', cpf: gerarCpf(777001) }),
      ]),
    );
    expect(r.statusCode).toBe(201);
    const corpo = r.json();
    expect(corpo.map((c: any) => c.codigo)).toEqual(['CAAT2025.0001', null, 'CAAT2025.0002']);
    expect(corpo[0].cpf).toMatch(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/);
  });

  it('continua a numeração em outra ata e separa por curso e ano', async () => {
    const r1 = await cadastrar(ata([concluinte(10)]));
    expect(r1.json()[0].codigo).toBe('CAAT2025.0003');

    const formacao = concluinte(11, { notaAd: 8, notaOd: 8, notaAf: 9, mediaFinal: 8.33 });
    const r2 = await cadastrar(ata([formacao], { curso: 'CFAT' }));
    expect(r2.json()[0].codigo).toBe('CFAT2025.0001');
    expect(r2.json()[0].mediaFinal).toBe(8.33);

    const r3 = await cadastrar(
      ata([concluinte(12)], { periodoInicio: '2026-01-05', periodoFim: '2026-01-09' }),
    );
    expect(r3.json()[0].codigo).toBe('CAAT2026.0001');
  });

  it('permite dados opcionais vazios e conserva os marcadores textuais', async () => {
    const r = await cadastrar(
      ata([
        concluinte(20, {
          nome: '',
          cargoFuncao: '',
          frequencia: null,
          notaAd: null,
          notaOd: null,
          notaAf: null,
          mediaFinal: null,
          resultado: null,
          observacoes: '',
        }),
      ], { curso: 'CFATR' }),
    );
    expect(r.statusCode).toBe(201);
    expect(r.json()[0]).toMatchObject({
      nome: 'XXXXXX',
      cargoFuncao: 'XXXXXX',
      frequencia: null,
      notaAd: null,
      resultado: null,
      observacoes: 'XXXXXX',
      codigo: null,
    });
  });

  it('identifica o concluinte com CPF repetido na própria ata', async () => {
    const repetido = concluinte(21);
    const r = await cadastrar(ata([repetido, repetido]));

    expect(r.statusCode).toBe(400);
    expect(r.json().detalhes).toContainEqual(
      expect.objectContaining({
        campo: expect.stringContaining('concluintes.1.cpf'),
        mensagem: 'CPF repetido na mesma ata',
      }),
    );
  });

  it('CPF duplicado no mesmo curso/período dá 409, grava nada e não queima número', async () => {
    const existente = concluinte(30);
    expect((await cadastrar(ata([existente], { periodoFim: '2025-11-30', periodoInicio: '2025-11-01' }))).statusCode).toBe(201);

    const falha = await cadastrar(
      ata([concluinte(31), existente, concluinte(32)], { periodoFim: '2025-11-30', periodoInicio: '2025-11-01' }),
    );
    expect(falha.statusCode).toBe(409);
    expect(falha.json().erro).toContain('Concluinte 2');
    expect(falha.json().erro).toContain('CPF final');

    const busca = await app.inject('/certificacoes?nome=Agente%2031');
    expect(busca.json().total).toBe(0);

    // o próximo código segue sem buraco
    const ok = await cadastrar(ata([concluinte(33)], { periodoFim: '2025-11-30', periodoInicio: '2025-11-01' }));
    expect(ok.json()[0].codigo).toBe('CAAT2025.0005');
  });

  it('pesquisa por nome sem acento e sem caixa', async () => {
    const r = await app.inject('/certificacoes?nome=joao%20d%27avila');
    // a apóstrofe tipográfica não casa com a reta: busca por trecho
    const r2 = await app.inject('/certificacoes?nome=joao');
    expect(r.statusCode).toBe(200);
    expect(r2.json().total).toBe(1);
    expect(r2.json().itens[0].nome).toBe('João d’Ávila');
  });

  it('pesquisa por CPF (com pontuação) e por município', async () => {
    const cpf = gerarCpf(777001);
    const formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    const porCpf = await app.inject(`/certificacoes?cpf=${encodeURIComponent(formatado)}`);
    expect(porCpf.json().total).toBe(1);

    const porMunicipio = await app.inject('/certificacoes?municipio=belem&tamanho=2&pagina=1');
    expect(porMunicipio.json().total).toBeGreaterThan(2);
    expect(porMunicipio.json().itens).toHaveLength(2);
  });

  it('listar todos ignora paginação, tamanho e filtros', async () => {
    const r = await app.inject('/certificacoes?todos=1&nome=nao-existe&tamanho=1&pagina=2');
    const resultado = r.json();

    expect(r.statusCode).toBe(200);
    expect(resultado.total).toBeGreaterThan(1);
    expect(resultado.itens).toHaveLength(resultado.total);
  });

  it('curingas digitados não viram coringa do LIKE', async () => {
    const r = await app.inject('/certificacoes?nome=%25%25');
    expect(r.json().total).toBe(0);
  });

  it('pesquisa sem filtro dá 400', async () => {
    expect((await app.inject('/certificacoes')).statusCode).toBe(400);
  });

  it('verifica pelo código (200, 404 e formato inválido)', async () => {
    const ok = await app.inject('/certificacoes/caat2025.0001');
    expect(ok.statusCode).toBe(200);
    expect(ok.json().codigo).toBe('CAAT2025.0001');
    expect((await app.inject('/certificacoes/CAAT2025.9999')).statusCode).toBe(404);
    expect((await app.inject('/certificacoes/abc')).statusCode).toBe(400);
  });

  it('documentação OpenAPI é gerada', async () => {
    const r = await app.inject('/docs/json');
    expect(r.statusCode).toBe(200);
    expect(Object.keys(r.json().paths)).toEqual(
      expect.arrayContaining(['/atas', '/certificacoes', '/certificacoes/{codigo}']),
    );
  });

  it('20 cadastros simultâneos não repetem número', async () => {
    const respostas = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        cadastrar(ata([concluinte(500 + i)], { curso: 'CAATR', periodoInicio: '2025-12-01', periodoFim: '2025-12-05' })),
      ),
    );
    const codigos = respostas.map((r) => r.json()[0].codigo).sort();
    expect(new Set(codigos).size).toBe(20);
    expect(codigos[0]).toBe('CAATR2025.0001');
    expect(codigos[19]).toBe('CAATR2025.0020');
  });

  it('permite editar um certificado existente e exige autenticação', async () => {
    const cad = await cadastrar(ata([concluinte(600, { resultado: 'REPROVADO' })]));
    expect(cad.statusCode).toBe(201);
    const item = cad.json()[0];
    expect(item.id).toBeDefined();
    expect(item.codigo).toBeNull();

    // Sem chave: 401
    const semChave = await app.inject({
      method: 'PUT',
      url: `/certificacoes/${item.id}`,
      payload: { nome: 'Nome Alterado' },
    });
    expect(semChave.statusCode).toBe(401);

    // Com chave: altera nome e resultado para APROVADO (gera código)
    const comChave = await app.inject({
      method: 'PUT',
      url: `/certificacoes/${item.id}`,
      headers: { 'x-api-key': CHAVE },
      payload: { nome: 'Nome Alterado Com Sucesso', resultado: 'APROVADO' },
    });
    expect(comChave.statusCode).toBe(200);
    expect(comChave.json().nome).toBe('Nome Alterado Com Sucesso');
    expect(comChave.json().codigo).toMatch(/^CAAT2025\.\d{4}$/);

    // ID inexistente: 404
    const naoExiste = await app.inject({
      method: 'PUT',
      url: '/certificacoes/999999',
      headers: { 'x-api-key': CHAVE },
      payload: { nome: 'Outro' },
    });
    expect(naoExiste.statusCode).toBe(404);
  });

  it('permite excluir um certificado existente e exige autenticação', async () => {
    const cad = await cadastrar(ata([concluinte(700)]));
    expect(cad.statusCode).toBe(201);
    const item = cad.json()[0];

    // Sem chave: 401
    const semChave = await app.inject({
      method: 'DELETE',
      url: `/certificacoes/${item.id}`,
    });
    expect(semChave.statusCode).toBe(401);

    // Com chave: 200 e confirma exclusão
    const del = await app.inject({
      method: 'DELETE',
      url: `/certificacoes/${item.id}`,
      headers: { 'x-api-key': CHAVE },
    });
    expect(del.statusCode).toBe(200);
    expect(del.json().ok).toBe(true);

    // Buscar pelo ID ou verificar detalhe dá 404 agora
    const getDepois = await app.inject({
      method: 'GET',
      url: `/certificacoes/detalhes/${item.id}`,
      headers: { 'x-api-key': CHAVE },
    });
    expect(getDepois.statusCode).toBe(404);

    // Excluir novamente: 404
    const delRepetido = await app.inject({
      method: 'DELETE',
      url: `/certificacoes/${item.id}`,
      headers: { 'x-api-key': CHAVE },
    });
    expect(delRepetido.statusCode).toBe(404);
  });
});

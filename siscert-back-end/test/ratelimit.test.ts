import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { criarBancoDeTeste } from './helpers/db.js';

const CHAVE = 'chave-de-teste-com-16+';
const abertos: Array<{ close: () => Promise<unknown> }> = [];

async function criarApp(opcoes: { trustProxy?: boolean | string; busca?: number; cadastro?: number }) {
  const app = await buildApp({
    db: await criarBancoDeTeste(),
    apiKey: CHAVE,
    corsOrigins: [],
    trustProxy: opcoes.trustProxy ?? false,
    limites: { busca: opcoes.busca ?? 3, cadastro: opcoes.cadastro ?? 3, verificacao: 3 },
    logger: false,
  });
  abertos.push(app);
  return app;
}

const buscar = (app: Awaited<ReturnType<typeof criarApp>>, headers: Record<string, string> = {}) =>
  app.inject({ method: 'GET', url: '/certificacoes?nome=maria', headers });

afterEach(async () => {
  await Promise.all(abertos.splice(0).map((a) => a.close()));
});

describe('limite de requisições', () => {
  it('bloqueia a busca depois do limite, com mensagem em português e Retry-After', async () => {
    const app = await criarApp({});
    for (let i = 0; i < 3; i++) expect((await buscar(app)).statusCode).toBe(200);

    const r = await buscar(app);
    expect(r.statusCode).toBe(429);
    expect(r.json().erro).toMatch(/Muitas requisições/);
    expect(r.headers['retry-after']).toBeDefined();
  });

  it('tentativas de cadastro com chave errada também contam (barra força bruta)', async () => {
    const app = await criarApp({});
    const tentar = () =>
      app.inject({ method: 'POST', url: '/atas', headers: { 'x-api-key': 'errada' }, payload: {} });

    for (let i = 0; i < 3; i++) expect((await tentar()).statusCode).toBe(401);
    expect((await tentar()).statusCode).toBe(429);
  });

  it('/health e /docs não sofrem limite', async () => {
    const app = await criarApp({ busca: 1 });
    for (let i = 0; i < 10; i++) expect((await app.inject('/health')).statusCode).toBe(200);
  });

  it('com trustProxy desligado, X-Forwarded-For é ignorado (não dá para burlar o limite trocando o header)', async () => {
    const app = await criarApp({ trustProxy: false });
    for (let i = 0; i < 3; i++) await buscar(app, { 'x-forwarded-for': `10.0.0.${i}` });
    expect((await buscar(app, { 'x-forwarded-for': '10.9.9.9' })).statusCode).toBe(429);
  });

  it('proxy não confiável: cabeçalho vindo de outro endereço é ignorado', async () => {
    const app = await criarApp({ trustProxy: '10.0.0.1' }); // o inject chega de 127.0.0.1
    for (let i = 0; i < 3; i++) await buscar(app, { 'x-forwarded-for': `10.0.0.${i + 10}` });
    expect((await buscar(app, { 'x-forwarded-for': '10.9.9.9' })).statusCode).toBe(429);
  });

  it('com o proxy confiável, cada IP real do cliente tem o seu próprio limite', async () => {
    const app = await criarApp({ trustProxy: '127.0.0.1' });
    for (let i = 0; i < 3; i++) await buscar(app, { 'x-forwarded-for': '203.0.113.1' });

    expect((await buscar(app, { 'x-forwarded-for': '203.0.113.1' })).statusCode).toBe(429);
    expect((await buscar(app, { 'x-forwarded-for': '203.0.113.2' })).statusCode).toBe(200);
  });
});

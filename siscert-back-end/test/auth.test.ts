import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { gerarHashSenha } from '../src/shared/session.js';
import { criarBancoDeTeste } from './helpers/db.js';

let app: FastifyInstance;
const email = 'admin@siscert.local';
const segredo = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

beforeAll(async () => {
  app = await buildApp({
    db: await criarBancoDeTeste(),
    apiKey: 'chave-legada-de-teste-123',
    adminEmail: email,
    adminPasswordHash: gerarHashSenha('SenhaForteDeTeste!2026'),
    sessionSecret: segredo,
    corsOrigins: ['http://localhost:5173'],
    logger: false,
  });
});
afterAll(() => app.close());

describe('autenticação administrativa', () => {
  it('recusa credenciais inválidas', async () => {
    const r = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, senha: 'incorreta' } });
    expect(r.statusCode).toBe(401);
  });

  it('cria sessão, permite acessar rotas administrativas e encerra sessão', async () => {
    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, senha: 'SenhaForteDeTeste!2026' } });
    expect(login.statusCode).toBe(200);
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    expect(cookie).toContain('siscert_session=');

    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().usuario.email).toBe(email);

    const resumo = await app.inject({ method: 'GET', url: '/admin/resumo', headers: { cookie } });
    expect(resumo.statusCode).toBe(200);
    expect(resumo.json().total).toBe(0);

    const semSessao = await app.inject('/admin/resumo');
    expect(semSessao.statusCode).toBe(401);
    const buscaSemSessao = await app.inject('/certificacoes?nome=Agente');
    expect(buscaSemSessao.statusCode).toBe(401);

    const logout = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie } });
    expect(logout.statusCode).toBe(200);
    const aposLogout = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: String(logout.headers['set-cookie']).split(';')[0] } });
    expect(aposLogout.statusCode).toBe(401);
  });
});

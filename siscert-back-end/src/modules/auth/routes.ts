import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { criarSessao, definirCookie, emailDaSessao, limparCookie, verificarSenha } from '../../shared/session.js';

const loginSchema = z.object({ email: z.string().email().max(200), senha: z.string().min(1).max(200) });

type AuthOptions = { email: string; passwordHash: string; sessionSecret: string; cookieSecure: boolean };

export function authRoutes(options: AuthOptions): FastifyPluginAsync {
  return async (app) => {
    app.post('/auth/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ erro: 'Informe um e-mail e uma senha válidos.' });
      const email = parsed.data.email.trim().toLowerCase();
      const okEmail = email === options.email.toLowerCase();
      const okSenha = verificarSenha(parsed.data.senha, options.passwordHash);
      if (!okEmail || !okSenha) return reply.code(401).send({ erro: 'E-mail ou senha incorretos.' });
      definirCookie(reply, criarSessao(email, options.sessionSecret), options.cookieSecure);
      return { autenticado: true, usuario: { email, nome: 'Administrador SISCERT', perfil: 'Administrador' } };
    });

    app.get('/auth/me', async (req, reply) => {
      const email = emailDaSessao(req, options.sessionSecret);
      if (!email) return reply.code(401).send({ erro: 'Não autenticado' });
      return { autenticado: true, usuario: { email, nome: 'Administrador SISCERT', perfil: 'Administrador' } };
    });

    app.post('/auth/logout', async (_req, reply) => {
      limparCookie(reply, options.cookieSecure);
      return { autenticado: false };
    });
  };
}

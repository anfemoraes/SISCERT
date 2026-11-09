import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { certificacoesRoutes } from './modules/certificacoes/routes.js';
import type { Db } from './modules/certificacoes/repository.js';
import { ConflitoError, DadosInvalidosError } from './modules/certificacoes/service.js';
import { criarExigirChave } from './shared/auth.js';
import { criarExigirSessao } from './shared/session.js';
import { authRoutes } from './modules/auth/routes.js';

/** Máximo de requisições por minuto, por IP. */
export interface Limites {
  busca: number;
  verificacao: number;
  cadastro: number;
}

export const LIMITES_PADRAO: Limites = { busca: 30, verificacao: 60, cadastro: 30 };

export interface AppDeps {
  db: Db;
  apiKey?: string;
  adminEmail?: string;
  adminPasswordHash?: string;
  sessionSecret?: string;
  cookieSecure?: boolean;
  corsOrigins: string[];
  /** Proxies confiáveis (IP/CIDR). false = ignora X-Forwarded-For e usa o IP da conexão. */
  trustProxy?: boolean | string;
  limites?: Partial<Limites>;
  logger?: boolean;
}

export async function buildApp({
  db,
  apiKey,
  adminEmail,
  adminPasswordHash,
  sessionSecret,
  cookieSecure,
  corsOrigins,
  trustProxy = false,
  limites,
  logger = true,
}: AppDeps) {
  const app = Fastify({ logger, trustProxy }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: corsOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });

  // global: false -> cada rota declara o seu limite em config.rateLimit
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Muitas requisições. Tente novamente em ${ctx.after}.`,
    }),
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Certificações de Agentes de Trânsito - CETRAN/PA',
        description: 'Cadastro e verificação de certificações (Resolução 004/2025-CETRAN/PA)',
        version: '1.0.0',
      },
      components: {
        securitySchemes: { sessionCookie: { type: 'apiKey', name: 'siscert_session', in: 'cookie' } },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.setErrorHandler((err: any, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        erro: 'Dados inválidos',
        detalhes: err.validation.map((v) => ({
          campo: v.instancePath.replace(/^\//, '').replace(/\//g, '.'),
          mensagem: v.message ?? 'inválido',
        })),
      });
    }
    if (err instanceof DadosInvalidosError) {
      return reply.code(400).send({ erro: err.message });
    }
    if (err instanceof ConflitoError) {
      return reply.code(409).send({ erro: err.message });
    }
    if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ erro: err.message });
    }
    req.log.error(err);
    return reply.code(500).send({ erro: 'Erro interno' });
  });

  app.get('/health', { schema: { hide: true } }, async () => ({ status: 'ok' }));

  const exigirAcesso = sessionSecret ? criarExigirSessao(sessionSecret) : criarExigirChave(apiKey ?? 'chave-legada-de-testes');

  if (adminEmail && adminPasswordHash && sessionSecret) {
    await app.register(authRoutes({ email: adminEmail, passwordHash: adminPasswordHash, sessionSecret, cookieSecure: cookieSecure ?? false }));
  }

  await app.register(certificacoesRoutes({
      db,
      exigirChave: exigirAcesso,
      protegerBusca: Boolean(sessionSecret),
      limites: { ...LIMITES_PADRAO, ...limites },
    }));

  return app;
}

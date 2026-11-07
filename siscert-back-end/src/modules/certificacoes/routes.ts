import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { count, desc, eq } from 'drizzle-orm';
import { certificacoes } from '../../db/schema.js';
import type { Limites } from '../../app.js';
import type { Db } from './repository.js';
import {
  ataSchema,
  buscaSchema,
  certificacaoSchema,
  codigoParamsSchema,
  erroSchema,
  paginaSchema,
} from './schemas.js';
import * as service from './service.js';

type Opcoes = {
  db: Db;
  exigirChave: (req: any, reply: any) => Promise<unknown>;
  limites: Limites;
  protegerBusca?: boolean;
};

const porMinuto = (max: number) => ({ rateLimit: { max, timeWindow: '1 minute' } });

export function certificacoesRoutes({ db, exigirChave, limites, protegerBusca = false }: Opcoes): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/admin/resumo', { preValidation: exigirChave, schema: { tags: ['Administração'], summary: 'Indicadores gerais do painel' } }, async () => {
      const [total] = await db.select({ total: count() }).from(certificacoes);
      const [aprovados] = await db.select({ total: count() }).from(certificacoes).where(eq(certificacoes.resultado, 'APROVADO'));
      const [reprovados] = await db.select({ total: count() }).from(certificacoes).where(eq(certificacoes.resultado, 'REPROVADO'));
      const recentes = await db.select({ codigo: certificacoes.codigo, nome: certificacoes.nome, municipio: certificacoes.municipio, curso: certificacoes.curso, resultado: certificacoes.resultado, criadoEm: certificacoes.criadoEm }).from(certificacoes).orderBy(desc(certificacoes.criadoEm)).limit(5);
      return { total: total?.total ?? 0, aprovados: aprovados?.total ?? 0, reprovados: reprovados?.total ?? 0, recentes };
    });
    app.post(
      '/atas',
      {
        preValidation: exigirChave,
        config: porMinuto(limites.cadastro),
        schema: {
          tags: ['Certificações'],
          summary: 'Cadastra uma ata de conclusão e gera os códigos dos aprovados',
          description:
            'Grava todos os concluintes da ata numa transação única. Só APROVADO recebe código ' +
            '(SIGLA+ANO.SEQUENCIAL, ex.: CAAT2025.0001). Exige sessão administrativa.',
          security: [{ sessionCookie: [] }],
          body: ataSchema,
          response: {
            201: z.array(certificacaoSchema),
            401: erroSchema,
            409: erroSchema,
            429: erroSchema,
          },
        },
      },
      async (req, reply) => {
        const criados = await service.cadastrarAta(db, req.body);
        return reply.code(201).send(criados);
      },
    );

    app.get(
      '/certificacoes',
      {
        ...(protegerBusca ? { preValidation: exigirChave } : {}),
        config: porMinuto(limites.busca),
        schema: {
          tags: ['Certificações'],
          summary: 'Pesquisa por nome, CPF ou município',
          description: 'Área administrativa. Informe ao menos um filtro. Nome e município aceitam trecho, sem acento.',
          querystring: buscaSchema,
          response: { 200: paginaSchema, 400: erroSchema, 429: erroSchema },
        },
      },
      async (req) => service.pesquisar(db, req.query),
    );

    app.get(
      '/certificacoes/:codigo',
      {
        config: porMinuto(limites.verificacao),
        schema: {
          tags: ['Certificações'],
          summary: 'Verifica a autenticidade de um certificado pelo código',
          params: codigoParamsSchema,
          response: { 200: certificacaoSchema, 400: erroSchema, 404: erroSchema, 429: erroSchema },
        },
      },
      async (req, reply) => {
        const cert = await service.verificar(db, req.params.codigo);
        if (!cert) return reply.code(404).send({ erro: 'Certificado não encontrado' });
        return cert;
      },
    );
  };
}

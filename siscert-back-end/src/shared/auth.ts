import { timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Hook que exige o header X-API-Key. Usado apenas nas rotas de escrita. */
export function criarExigirChave(apiKey: string) {
  const esperado = Buffer.from(apiKey);

  return async function exigirChave(req: FastifyRequest, reply: FastifyReply) {
    const recebido = Buffer.from(String(req.headers['x-api-key'] ?? ''));
    const ok = recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
    if (!ok) {
      return reply.code(401).send({ erro: 'Chave de API inválida' });
    }
  };
}

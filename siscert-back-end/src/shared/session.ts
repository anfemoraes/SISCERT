import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const COOKIE_NAME = 'siscert_session';
const SESSION_SECONDS = 60 * 60 * 8;

export function gerarHashSenha(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, armazenada: string): boolean {
  const [salt, hash] = armazenada.split(':');
  if (!salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  const calculado = scryptSync(senha, salt, 64);
  const esperado = Buffer.from(hash, 'hex');
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

function assinar(payload: string, segredo: string) {
  return createHmac('sha256', segredo).update(payload).digest('base64url');
}

export function criarSessao(email: string, segredo: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${assinar(payload, segredo)}`;
}

export function lerSessao(token: string | undefined, segredo: string): { email: string } | null {
  if (!token) return null;
  const [payload, assinatura] = token.split('.');
  if (!payload || !assinatura) return null;
  const assinaturaEsperada = Buffer.from(assinar(payload, segredo));
  const assinaturaRecebida = Buffer.from(assinatura);
  if (assinaturaEsperada.length !== assinaturaRecebida.length || !timingSafeEqual(assinaturaEsperada, assinaturaRecebida)) return null;
  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!dados.email || !dados.exp || dados.exp <= Math.floor(Date.now() / 1000)) return null;
    return { email: dados.email };
  } catch { return null; }
}

function cookie(req: FastifyRequest) {
  const header = req.headers.cookie ?? '';
  const item = header.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : undefined;
}

export function criarExigirSessao(segredo: string) {
  return async function exigirSessao(req: FastifyRequest, reply: FastifyReply) {
    if (!lerSessao(cookie(req), segredo)) return reply.code(401).send({ erro: 'Sessão expirada ou não autenticada' });
  };
}

export function definirCookie(reply: FastifyReply, token: string, secure: boolean) {
  const sameSite = secure ? 'None' : 'Lax';
  reply.header('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`);
}

export function limparCookie(reply: FastifyReply, secure: boolean) {
  const sameSite = secure ? 'None' : 'Lax';
  reply.header('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure ? '; Secure' : ''}`);
}

export function emailDaSessao(req: FastifyRequest, segredo: string) {
  return lerSessao(cookie(req), segredo)?.email ?? null;
}

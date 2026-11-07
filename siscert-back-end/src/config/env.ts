import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  // A chave antiga fica opcional apenas para compatibilidade com testes/integrações legadas.
  API_KEY: z.string().min(16).optional(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET deve ter ao menos 32 caracteres'),
  COOKIE_SECURE: z.string().default('false').transform((v) => v === 'true'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
  PORT: z.coerce.number().default(3000),
  // 'false' (padrão) ignora X-Forwarded-For. Atrás de um proxy, informe os IPs/CIDRs dele
  // (ex.: 'loopback,linklocal,uniquelocal'). Evite 'true': confia em qualquer cabeçalho.
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((v): boolean | string => (v === 'false' ? false : v === 'true' ? true : v)),
});

const resultado = schema.safeParse(process.env);
if (!resultado.success) {
  console.error('Variáveis de ambiente inválidas:', resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
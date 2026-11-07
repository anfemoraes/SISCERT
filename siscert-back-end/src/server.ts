import { buildApp } from './app.js';
import { env } from './config/env.js';
import { db } from './db/client.js';

const app = await buildApp({
  db,
  apiKey: env.API_KEY,
  adminEmail: env.ADMIN_EMAIL,
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,
  sessionSecret: env.SESSION_SECRET,
  cookieSecure: env.COOKIE_SECURE,
  corsOrigins: env.CORS_ORIGINS,
  trustProxy: env.TRUST_PROXY,
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });

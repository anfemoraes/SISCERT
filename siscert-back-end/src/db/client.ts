import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

// prepare: false é necessário no pooler do Supabase em modo transação (porta 6543)
const sql = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(sql, { schema });
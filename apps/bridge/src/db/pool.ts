import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

// Permit Supabase pooler TLS handshake across all environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Clean connection string so node-postgres respects ssl object without parameter override
const cleanConnectionString = config.DATABASE_URL
  .replace('?sslmode=require', '')
  .replace('&sslmode=require', '')
  .replace('sslmode=require', '');

export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error]: Unexpected error on idle database client', err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text, error });
    throw error;
  }
}

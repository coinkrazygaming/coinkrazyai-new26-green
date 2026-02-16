import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Clean DATABASE_URL if it includes the psql command wrapper
    let connectionString = process.env.DATABASE_URL || '';
    if (connectionString.startsWith('psql ')) {
      connectionString = connectionString.replace(/^psql\s+'/, '').replace(/'$/, '');
    }

    console.log('[DB] Creating connection pool with DATABASE_URL:', connectionString ? 'set' : 'NOT SET');

    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }

  return pool;
}

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] ${text.substring(0, 50)}... (${duration}ms)`);
    return res;
  } catch (error) {
    console.error('[DB ERROR]', error);
    throw error;
  }
};

export const getClient = async () => {
  return getPool().connect();
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
  }
};

export default { query, getClient, closePool };

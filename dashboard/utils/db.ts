import { Pool, PoolClient } from 'pg';

// Lazy initialization - pool akan dibuat saat pertama kali dibutuhkan
let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: "warehouse_postgres",
      port: 5432,
      user: "warehouse_user",
      password: "warehouse_password",
      database: "siak_warehouse",
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.log('Database query error:', error);
    throw error;
  }
}                                                                                                                               

export async function getClient(): Promise<PoolClient> {
  try {
    const client = await getPool().connect();
    const query = client.query;
    const release = client.release;
    
    // Modify the release method to log when the client is released
    client.release = () => {
      client.query = query;
      client.release = release;
      return release.call(client);
    };
    return client;
  } catch (error) {
    console.error('Error acquiring client:', error);
    throw error;
  }
}

export default {
  query,
  getClient,
  pool: getPool
};

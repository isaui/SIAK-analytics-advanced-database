import { Pool, PoolClient } from 'pg';



// Environment variables are passed from the docker-compose.yml configuration
const pool = new Pool({
  host: process.env.WAREHOUSE_DB_HOST || 'localhost',
  port: process.env.NODE_ENV === 'production' ? 5432 : 5433,
  user: process.env.WAREHOUSE_DB_USER || 'warehouse_user',
  password: process.env.WAREHOUSE_DB_PASSWORD || 'warehouse_password',
  database: process.env.WAREHOUSE_DB_NAME || 'siak_warehouse',
});

export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  try {
    const client = await pool.connect();
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
  pool,
};

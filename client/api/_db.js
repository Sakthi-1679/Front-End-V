// api/_db.js – MySQL connection pool for Vercel serverless functions.
// Uses the same env vars and SSL logic as the new-Web backend.
import mysql from 'mysql2/promise';

let pool = null;

export function getDB() {
  if (pool) return pool;
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vkm_flower_shop',
    waitForConnections: true,
    connectionLimit: process.env.DB_POOL_LIMIT ? Number(process.env.DB_POOL_LIMIT) : 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  if (
    process.env.DB_SSL === 'true' ||
    (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))
  ) {
    config.ssl = { rejectUnauthorized: false };
  }
  pool = mysql.createPool(config);
  return pool;
}

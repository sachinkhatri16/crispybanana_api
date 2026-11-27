/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/config/db.js
 *
 * @description Configures and exports a PostgreSQL connection pool using
 *              node-postgres (pg) with timeout guards and idle error logging.
 *
 * @references
 * 1. node-postgres Connection Pooling:
 *    Brian Carlson, "node-postgres (pg.Pool) Documentation", https://node-postgres.com/apis/pool
 * 2. PostgreSQL Environment & Pool Sizing:
 *    PostgreSQL Global Development Group, "Database Connection Management", https://www.postgresql.org/docs/current/runtime-config-connection.html
 * 3. Node.js ESM Path Resolution & dotenv:
 *    Node.js Foundation, "URL / Path APIs", https://nodejs.org/api/url.html
 * 4. Generative AI Acknowledgement:
 *    Pool configuration and academic referencing comments were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'banana_game',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;

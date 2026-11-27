/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/config/prisma.js
 *
 * @description Configures and exports a singleton PrismaClient instance with
 *              URI-encoded PostgreSQL credentials loaded via dotenv.
 *
 * @references
 * 1. PrismaClient Singleton Pattern:
 *    Prisma Data, "Best practices for instantiating PrismaClient with Next.js / Node.js", https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
 * 2. PostgreSQL Connection URIs & Environment Configuration:
 *    PostgreSQL Global Development Group, "Connection Strings", https://www.postgresql.org/docs/current/libpq-connect.html
 * 3. Node.js ESM Path Resolution & dotenv:
 *    Node.js Foundation, "URL / Path APIs", https://nodejs.org/api/url.html
 * 4. Generative AI Acknowledgement:
 *    Connection URI credential encoding and academic header documentation were
 *    refined with iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

// Safely encode password with special characters (like @) for PostgreSQL connection URL
const getDatabaseUrl = () => {
  const user = process.env.DB_USER || 'postgres';
  const rawPass = process.env.DB_PASSWORD || '';
  const pass = encodeURIComponent(rawPass);
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME || 'banana_game';
  return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
};

const databaseUrl = getDatabaseUrl();

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

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

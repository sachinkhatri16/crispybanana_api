/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/index.js
 *
 * @description Express application entry point configuring CORS, lightweight
 *              cookie parsing, body parsers, health checks, API routes, and
 *              graceful Prisma shutdown.
 *
 * @references
 * 1. Express Application Architecture:
 *    OpenJS Foundation, "Express 4.x API Reference", https://expressjs.com/
 * 2. JWT & HTTP-Only Cookie Transport:
 *    IETF RFC 7519 (JSON Web Token) & MDN HTTP Cookies
 * 3. Credential Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet",
 *    https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * 4. Generative AI Acknowledgement:
 *    Middleware ordering and cookie parser integration assisted by AI tools.
 * ============================================================================
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Architecture imports
import corsMiddleware from './config/cors.js';
import prisma from './config/prisma.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { cookieParser } from './middleware/auth.middleware.js';
import notFoundHandler from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS middleware
app.use(corsMiddleware);

// Body & cookie parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser);

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      orm: 'prisma',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Health check failed:', err.message);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// Mount application API routes
app.use('/api', routes);

// 404 Not Found Middleware
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Graceful shutdown handling
const shutdown = async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const server = app.listen(PORT, () => {
  logger.info(`🍌 Banana Rush API server running on http://localhost:${PORT}`);
});

export default app;

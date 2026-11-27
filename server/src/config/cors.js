/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/config/cors.js
 *
 * @description Configures Cross-Origin Resource Sharing (CORS) with strict
 *              origin allowlisting and credentials: true for HTTP-Only cookies
 *              and Authorization Bearer headers.
 *
 * @references
 * 1. Fetch / CORS Specification:
 *    MDN Web Docs, "Cross-Origin Resource Sharing (CORS)",
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 * 2. Express cors Middleware:
 *    Expressjs, "cors npm package documentation", https://expressjs.com/en/resources/middleware/cors.html
 * 3. Auth & Cookie Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet" & JWT RFC 7519 /
 *    HTTP-Only Cookies CSRF Mitigation
 * 4. Generative AI Acknowledgement:
 *    Academic header documentation and origin policy review assisted by AI.
 * ============================================================================
 */
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export default cors(corsOptions);


/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/middleware/auth.middleware.js
 *
 * @description Authentication and cookie-parsing middleware verifying user
 *              virtual identity from either an Authorization Bearer header or
 *              an HTTP-Only 'token' cookie.
 *
 * @references
 * 1. JSON Web Token Standard:
 *    Jones, M., Bradley, J., & Sakimura, N. (2015), "JSON Web Token (JWT)",
 *    IETF RFC 7519, https://datatracker.ietf.org/doc/html/rfc7519
 * 2. Bearer Token Authentication:
 *    Jones, M. & Hardt, D. (2012), "The OAuth 2.0 Authorization Framework:
 *    Bearer Token Usage", IETF RFC 6750
 * 3. HTTP State Management & HTTP-Only Cookies:
 *    OWASP Foundation, "Session Management Cheat Sheet" & "Password Storage
 *    Cheat Sheet", https://cheatsheetseries.owasp.org/
 * 4. Generative AI Acknowledgement:
 *    Lightweight cookie parsing and dual-transport token extraction were
 *    developed with iterative assistance from AI coding assistants.
 * ============================================================================
 */
import { verifyToken } from '../utils/jwt.utils.js';
import prisma from '../config/prisma.js';
import { sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';

/**
 * Parse a raw HTTP Cookie header string into a key-value map.
 */
export const parseCookies = (cookieHeader = '') => {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return cookies;
  }

  for (const pair of cookieHeader.split(';')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const rawValue = pair.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawValue);
    } catch {
      cookies[key] = rawValue;
    }
  }

  return cookies;
};

/**
 * Lightweight Express middleware populating req.cookies without external deps.
 */
export const cookieParser = (req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
};

export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from either Bearer Header OR HTTP-Only Cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const cookies = req.cookies || parseCookies(req.headers.cookie);
      if (cookies.token) {
        token = cookies.token;
      }
    }

    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid or expired authentication token', 401);
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
      },
    });

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return sendError(res, 'Authentication failed', 401);
  }
};

export default authenticateToken;

/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/utils/jwt.utils.js
 *
 * @description Stateless virtual identity utility for signing and verifying
 *              JSON Web Tokens (JWT) with configurable expiration.
 *
 * @references
 * 1. JSON Web Token Standard:
 *    IETF RFC 7519, "JSON Web Token (JWT)", https://datatracker.ietf.org/doc/html/rfc7519
 * 2. jsonwebtoken Library Documentation:
 *    Auth0, "jsonwebtoken (npm)", https://github.com/auth0/node-jsonwebtoken
 * 3. Token Security Best Practices:
 *    OWASP Foundation, "JSON Web Token for Java Cheat Sheet" / JWT Security Guidelines
 * 4. Generative AI Acknowledgement:
 *    Utility abstractions and documentation headers were developed with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_banana_rush_secret_jwt_key_2026_secured';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};


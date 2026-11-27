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

const DEFAULT_JWT_SECRET = 'super_banana_rush_secret_jwt_key_2026_secured';
const JWT_EXPIRES_IN = '7d';
const PUZZLE_TOKEN_EXPIRES_IN = '10m';

const getJwtSecret = () => process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};

export const signPuzzleToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: PUZZLE_TOKEN_EXPIRES_IN });
};

export const verifyPuzzleToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};


/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/middleware/validate.middleware.js
 *
 * @description Request validation middleware enforcing structural and format
 *              constraints on user registration and login payloads.
 *
 * @references
 * 1. Express.js Middleware Pattern:
 *    OpenJS Foundation, "Using Middleware", https://expressjs.com/en/guide/using-middleware.html
 * 2. Input Validation Standards:
 *    OWASP Foundation, "Input Validation Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
 * 3. Generative AI Acknowledgement:
 *    Validation regex patterns and header documentation were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { sendError } from '../utils/response.utils.js';

export const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long.');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push('Username can only contain letters, numbers, and underscores.');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return sendError(res, errors[0], 400, errors);
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return sendError(res, 'Email/username and password are required.', 400);
  }
  next();
};


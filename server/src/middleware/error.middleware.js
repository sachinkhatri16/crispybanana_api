/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/middleware/error.middleware.js
 *
 * @description Global Express error-handling middleware that logs internal
 *              stack traces server-side while returning sanitized error responses.
 *
 * @references
 * 1. Express.js Centralized Error Handling:
 *    OpenJS Foundation, "Error Handling in Express", https://expressjs.com/en/guide/error-handling.html
 * 2. Secure Error Responses:
 *    OWASP Foundation, "Error Handling Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
 * 3. Generative AI Acknowledgement:
 *    Middleware structure and academic header formatting were developed with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log error internally with stack trace, never leak stack trace or internal database details to client
  logger.error(`[Unhandled Error] ${err.message || err}`, err.stack ? `\n${err.stack}` : '');

  const statusCode = err.status || err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected server error occurred. Please try again.'
      : err.message;

  return sendError(res, message, statusCode);
};

export default errorHandler;

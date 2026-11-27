/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/middleware/notFound.middleware.js
 *
 * @description Fallback Express middleware handling unmatched HTTP routes with
 *              a standardized 404 JSON error response.
 *
 * @references
 * 1. Express.js Middleware Pipeline:
 *    OpenJS Foundation, "Writing Middleware for use in Express apps", https://expressjs.com/en/guide/writing-middleware.html
 * 2. HTTP Status Code Semantics (404 Not Found):
 *    IETF RFC 9110, "HTTP Semantics", https://www.rfc-editor.org/rfc/rfc9110
 * 3. Generative AI Acknowledgement:
 *    Documentation headers and error envelope formatting were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { sendError } from '../utils/response.utils.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export default notFoundHandler;


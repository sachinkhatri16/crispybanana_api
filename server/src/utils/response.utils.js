/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/utils/response.utils.js
 *
 * @description Standardized JSON response helpers enforcing a uniform API
 *              envelope across success and error endpoints.
 *
 * @references
 * 1. Express.js Response Methods:
 *    OpenJS Foundation, "Express 4.x/5.x API Reference (res.status, res.json)", https://expressjs.com/en/api.html#res.json
 * 2. REST API Envelope Specification:
 *    OmniTI, "JSend JSON Response Format", https://github.com/omniti-labs/jsend
 * 3. Generative AI Acknowledgement:
 *    Response wrapper structure and header documentation were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};


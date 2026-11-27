/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/utils/logger.js
 *
 * @description Lightweight structured console logger outputting ISO-8601
 *              timestamped severity levels (INFO, WARN, ERROR, DEBUG).
 *
 * @references
 * 1. Node.js Console API:
 *    Node.js Foundation, "Console Documentation", https://nodejs.org/api/console.html
 * 2. Timestamp Formatting Standard:
 *    ISO 8601 / ECMAScript Date.prototype.toISOString(), MDN Web Docs
 * 3. Generative AI Acknowledgement:
 *    Logger formatting and academic referencing comments were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, ...args) => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  },
};

export default logger;


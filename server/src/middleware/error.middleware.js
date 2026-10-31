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

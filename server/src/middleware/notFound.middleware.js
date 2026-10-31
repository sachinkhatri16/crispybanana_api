import { sendError } from '../utils/response.utils.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export default notFoundHandler;


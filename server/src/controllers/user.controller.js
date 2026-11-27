/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/controllers/user.controller.js
 *
 * @description Handles authenticated user profile retrieval, avatar updates,
 *              and recent game round history queries via Prisma ORM.
 *
 * @references
 * 1. Prisma Client CRUD & Relational Queries:
 *    Prisma Data, "Prisma Client API Reference", https://www.prisma.io/docs/orm/prisma-client
 * 2. Express.js Middleware & Request Handling:
 *    OpenJS Foundation, "Express Routing & Controllers", https://expressjs.com/en/guide/routing.html
 * 3. Access Control & Scoped User Queries:
 *    OWASP Foundation, "Insecure Direct Object Reference Prevention Cheat Sheet"
 * 4. Generative AI Acknowledgement:
 *    Documentation structure and Prisma query projections were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import prisma from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
        user_metrics: true,
        game_rounds: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            score_awarded: true,
            is_correct: true,
            time_taken_ms: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string') {
      return sendError(res, 'Valid avatar identifier is required', 400);
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { avatar: avatar.trim() },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    return sendSuccess(res, { user: updated }, 'Avatar updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rounds = await prisma.game_rounds.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return sendSuccess(res, { rounds });
  } catch (error) {
    next(error);
  }
};


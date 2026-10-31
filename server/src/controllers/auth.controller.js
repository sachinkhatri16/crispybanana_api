import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.utils.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password, avatar } = req.body;
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const userAvatar = avatar && typeof avatar === 'string' ? avatar.trim() : 'adventurer';

    // Check if user already exists with email or username (case-insensitive)
    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { username: { equals: cleanUsername, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === cleanEmail) {
        return sendError(res, 'An account with this email already exists.', 409);
      }
      return sendError(res, 'This username is already taken. Please choose another.', 409);
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and initialize metrics with 100 FREE registration bonus points!
    const newUser = await prisma.users.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        avatar: userAvatar,
        user_metrics: {
          create: {
            total_games: 0,
            total_wins: 0,
            total_score: 100, // 🎁 100 FREE registration points
            highest_score: 100,
            current_streak: 0,
            best_streak: 0,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
        user_metrics: true,
      },
    });

    const token = generateToken({ userId: newUser.id, username: newUser.username });
    logger.info(`New user registered: ${newUser.username} (id: ${newUser.id}) with 100 free points`);

    return sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          created_at: newUser.created_at,
          metrics: newUser.user_metrics,
        },
        token,
      },
      'Registration successful! You received 100 FREE welcome bonus points! 🎉',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const cleanIdentifier = identifier.trim();

    // Find user by either email or username (case-insensitive)
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        user_metrics: true,
      },
    });

    if (!user) {
      return sendError(res, 'Invalid credentials. Please check your username/email and password.', 401);
    }

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, 'Invalid credentials. Please check your username/email and password.', 401);
    }

    // Strip password_hash from response - NEVER leak password hashes!
    const { password_hash, user_metrics, ...safeUser } = user;

    const token = generateToken({ userId: user.id, username: user.username });
    logger.info(`User logged in: ${user.username} (id: ${user.id})`);

    return sendSuccess(
      res,
      {
        user: {
          ...safeUser,
          metrics: user_metrics || {
            total_games: 0,
            total_wins: 0,
            total_score: 0,
            highest_score: 0,
            current_streak: 0,
            best_streak: 0,
            fastest_solve_ms: null,
          },
        },
        token,
      },
      'Logged in successfully!'
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
        user_metrics: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        created_at: user.created_at,
        metrics: user.user_metrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

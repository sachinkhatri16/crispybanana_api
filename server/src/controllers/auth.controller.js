/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/controllers/auth.controller.js
 *
 * @description Handles virtual identity authentication (register, login,
 *              logout, session profile) using bcrypt password hashing,
 *              stateless JWT tokens, and secure HTTP-Only cookies.
 *
 * @references
 * 1. Password Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet",
 *    https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * 2. JSON Web Token Standard:
 *    Jones, M., Bradley, J., & Sakimura, N. (2015), "JSON Web Token (JWT)",
 *    IETF RFC 7519, https://datatracker.ietf.org/doc/html/rfc7519
 * 3. HTTP-Only Cookies & CSRF Defense:
 *    MDN Web Docs / RFC 6265bis, "Using HTTP cookies (HttpOnly, Secure, SameSite)",
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 * 4. Generative AI Acknowledgement:
 *    Portions of HTTP-Only cookie configuration and refactoring were developed
 *    with iterative assistance from AI coding assistants.
 * ============================================================================
 */
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.utils.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getCookieOptions = () => ({
  httpOnly: true, // Prevents access via document.cookie (immunizes against XSS token theft)
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // Mitigates Cross-Site Request Forgery (CSRF)
});

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    ...getCookieOptions(),
    maxAge: TOKEN_MAX_AGE_MS,
  });
};

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
    setAuthCookie(res, token);
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
    setAuthCookie(res, token);
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

export const logout = async (req, res) => {
  res.clearCookie('token', getCookieOptions());
  return sendSuccess(res, null, 'Logged out successfully!');
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

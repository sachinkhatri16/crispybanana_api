/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/controllers/game.controller.js
 *
 * @description Integrates third-party Marc Conrad Banana API via a resilient
 *              Backend-for-Frontend (BFF) gateway with regex PHP notice
 *              sanitization, circuit breaker / offline cache fallback,
 *              PostgreSQL metrics persistence via Prisma ORM, and asynchronous
 *              EventEmitter dispatching for gameplay events.
 *
 * @references
 * 1. Banana API Documentation & Specification:
 *    Marc Conrad (2023), "The Banana API", https://marcconrad.com/uob/banana/doc.php
 * 2. Enterprise Integration Patterns (BFF Pattern):
 *    Martin Fowler, "Backend for Frontend", https://martinfowler.com/articles/bff.html
 * 3. Node.js Event-Driven Architecture:
 *    Node.js Foundation, "Events Documentation", https://nodejs.org/api/events.html
 * 4. Generative AI Acknowledgement:
 *    Portions of regex response sanitization, circuit breaker fallback logic,
 *    and event-driven dispatching were developed with iterative assistance
 *    from generative AI tools.
 * ============================================================================
 */
import prisma from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';
import gameEvents from '../events/gameEventEmitter.js';

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';
const UPSTREAM_TIMEOUT_MS = 5000;
const MAX_CACHED_PUZZLES = 20;

const FALLBACK_PUZZLES = [
  { question: 'https://www.sanfoh.com/uob/banana/data/t0d68eab90150e15dc98df16392n84.png', solution: 4 },
  { question: 'https://www.sanfoh.com/uob/banana/data/t43a6729c7d812eb12702a46660n27.png', solution: 7 },
  { question: 'https://www.sanfoh.com/uob/banana/data/t521e7aff332c918ee9da692991n59.png', solution: 9 },
];

const cachedPuzzles = [...FALLBACK_PUZZLES];

const circuitBreaker = {
  state: 'CLOSED',
  failures: 0,
  failureThreshold: 3,
  cooldownMs: 30000,
  openedAt: 0,
};

const pickFallbackPuzzle = () => {
  const pool = cachedPuzzles.length > 0 ? cachedPuzzles : FALLBACK_PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)];
};

const cacheValidatedPuzzle = (puzzle) => {
  const exists = cachedPuzzles.some((item) => item.question === puzzle.question);
  if (exists) return;

  if (cachedPuzzles.length >= MAX_CACHED_PUZZLES) {
    cachedPuzzles.shift();
  }
  cachedPuzzles.push(puzzle);
};

export const getPuzzle = async (req, res, next) => {
  if (circuitBreaker.state === 'OPEN') {
    const elapsed = Date.now() - circuitBreaker.openedAt;
    if (elapsed < circuitBreaker.cooldownMs) {
      logger.warn(
        `Banana API circuit breaker OPEN (${Math.ceil((circuitBreaker.cooldownMs - elapsed) / 1000)}s remaining). Serving cached fallback puzzle.`
      );
      return sendSuccess(res, pickFallbackPuzzle(), 'Puzzle loaded');
    }
    circuitBreaker.state = 'HALF_OPEN';
  }

  try {
    const response = await fetch(`${BANANA_API_URL}&t=${Date.now()}`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Upstream Banana API returned HTTP ${response.status}`);
    }

    const text = await response.text();

    // Sanitize any PHP notices, warnings, or HTML tags (<br /> <b>Warning...)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Malformed puzzle response from upstream API');
    }

    const raw = JSON.parse(jsonMatch[0]);
    const parsedSolution = Number(raw?.solution);
    if (
      typeof raw?.question !== 'string' ||
      !raw.question.trim() ||
      raw?.solution === undefined ||
      raw?.solution === null ||
      raw?.solution === '' ||
      !Number.isInteger(parsedSolution)
    ) {
      throw new Error('Puzzle format missing valid question or solution');
    }

    const sanitizedPuzzle = {
      question: raw.question.trim(),
      solution: parsedSolution,
    };

    circuitBreaker.failures = 0;
    circuitBreaker.state = 'CLOSED';
    cacheValidatedPuzzle(sanitizedPuzzle);

    return sendSuccess(res, sanitizedPuzzle, 'Puzzle retrieved successfully');
  } catch (error) {
    circuitBreaker.failures += 1;
    if (
      circuitBreaker.state === 'HALF_OPEN' ||
      circuitBreaker.failures >= circuitBreaker.failureThreshold
    ) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.openedAt = Date.now();
      logger.warn(
        `Banana API circuit breaker tripped OPEN after ${circuitBreaker.failures} failure(s): ${error.message}`
      );
    } else {
      logger.warn(`Upstream Banana API warning: ${error.message}. Serving resilient puzzle.`);
    }

    return sendSuccess(res, pickFallbackPuzzle(), 'Puzzle loaded');
  }
};

export const useHint = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hintLevel } = req.body;
    const costs = { 1: 10, 2: 15, 3: 20 };
    const cost = costs[hintLevel];

    if (!cost) {
      return sendError(res, 'Invalid hint option. Must be 1, 2, or 3.', 400);
    }

    const metrics = await prisma.user_metrics.findUnique({
      where: { user_id: userId },
    });

    if (!metrics) {
      return sendError(res, 'User record not found.', 404);
    }

    if (metrics.total_score < cost) {
      return sendError(
        res,
        `Not enough points! You have ${metrics.total_score} pts, but this hint costs ${cost} pts.`,
        400
      );
    }

    // Deduct immediately in PostgreSQL!
    const updated = await prisma.user_metrics.update({
      where: { user_id: userId },
      data: {
        total_score: { decrement: cost },
        updated_at: new Date(),
      },
    });

    logger.info(
      `User ${userId} unlocked Hint ${hintLevel}: -${cost} pts deducted. New total: ${updated.total_score}`
    );

    gameEvents.emit('hint:unlocked', {
      userId,
      hintLevel,
      cost,
    });

    return sendSuccess(
      res,
      {
        hintLevel,
        costDeducted: cost,
        total_score: updated.total_score,
        metrics: updated,
      },
      `Hint ${hintLevel} unlocked! -${cost} points deducted from your score.`
    );
  } catch (error) {
    next(error);
  }
};

export const recordRound = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      puzzleUrl,
      solution,
      userAnswer,
      isCorrect,
      scoreAwarded,
      timeLimitSeconds = 60,
      timeTakenMs,
      status = 'completed',
    } = req.body;

    const parsedSolution = solution !== undefined && solution !== null ? parseInt(solution, 10) : 0;
    const parsedUserAnswer =
      userAnswer !== undefined && userAnswer !== null && userAnswer !== ''
        ? parseInt(userAnswer, 10)
        : null;
    const awarded = parseInt(scoreAwarded || 0, 10);
    const timeTaken = timeTakenMs ? parseInt(timeTakenMs, 10) : null;
    const roundCorrect = Boolean(isCorrect);

    // Save game round via Prisma
    const round = await prisma.game_rounds.create({
      data: {
        user_id: userId,
        puzzle_url: puzzleUrl || 'https://marcconrad.com/uob/banana/',
        solution: parsedSolution,
        user_answer: parsedUserAnswer,
        is_correct: roundCorrect,
        score_awarded: awarded,
        time_limit_seconds: timeLimitSeconds,
        time_taken_ms: timeTaken,
        status,
        completed_at: new Date(),
      },
    });

    // Fetch existing user metrics or create defaults
    const currentMetrics = await prisma.user_metrics.findUnique({
      where: { user_id: userId },
    });

    const existingTotalGames = currentMetrics?.total_games || 0;
    const existingTotalWins = currentMetrics?.total_wins || 0;
    const existingTotalScore = currentMetrics?.total_score || 0;
    const existingHighest = currentMetrics?.highest_score || 0;
    const existingStreak = currentMetrics?.current_streak || 0;
    const existingBestStreak = currentMetrics?.best_streak || 0;
    const existingFastest = currentMetrics?.fastest_solve_ms;

    const nextTotalGames = existingTotalGames + 1;
    const nextWins = existingTotalWins + (roundCorrect ? 1 : 0);
    const nextTotalScore = existingTotalScore + awarded;
    const nextStreak = roundCorrect ? existingStreak + 1 : 0;
    const nextBestStreak = Math.max(existingBestStreak, nextStreak);
    const nextHighestScore = Math.max(existingHighest, awarded);

    let nextFastest = existingFastest;
    if (roundCorrect && timeTaken && timeTaken > 0) {
      nextFastest = existingFastest ? Math.min(existingFastest, timeTaken) : timeTaken;
    }

    const updatedMetrics = await prisma.user_metrics.upsert({
      where: { user_id: userId },
      update: {
        total_games: nextTotalGames,
        total_wins: nextWins,
        total_score: nextTotalScore,
        highest_score: nextHighestScore,
        current_streak: nextStreak,
        best_streak: nextBestStreak,
        fastest_solve_ms: nextFastest,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        total_games: nextTotalGames,
        total_wins: nextWins,
        total_score: nextTotalScore,
        highest_score: nextHighestScore,
        current_streak: nextStreak,
        best_streak: nextBestStreak,
        fastest_solve_ms: nextFastest,
      },
    });

    logger.debug(`Round recorded for user ${userId}: +${awarded} pts, streak: ${nextStreak}`);

    gameEvents.emit('round:completed', {
      userId,
      scoreAwarded: awarded,
      streak: nextStreak,
      isCorrect: roundCorrect,
    });

    return sendSuccess(
      res,
      {
        roundId: round.id,
        metrics: updatedMetrics,
        pointsAdded: awarded,
        streak: nextStreak,
      },
      'Game round recorded successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    // Query directly from PostgreSQL database via Prisma, ordered by total_score DESC
    const metrics = await prisma.user_metrics.findMany({
      orderBy: [
        { total_score: 'desc' },
        { highest_score: 'desc' },
      ],
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      take: 25,
    });

    const leaderboard = metrics.map((m, index) => ({
      rank: index + 1,
      id: m.users.id,
      username: m.users.username,
      avatar: m.users.avatar || 'adventurer',
      score: m.total_score,
      total_score: m.total_score,
      highest_score: m.highest_score,
      streak: m.best_streak,
      current_streak: m.current_streak,
      total_games: m.total_games,
      total_wins: m.total_wins,
      fastest_solve_ms: m.fastest_solve_ms,
    }));

    return sendSuccess(res, { leaderboard });
  } catch (error) {
    next(error);
  }
};

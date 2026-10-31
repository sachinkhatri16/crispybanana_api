import prisma from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import logger from '../utils/logger.js';

export const getPuzzle = async (req, res, next) => {
  try {
    const BANANA_API = 'https://marcconrad.com/uob/banana/api.php?out=json';
    const response = await fetch(`${BANANA_API}&t=${Date.now()}`);
    const text = await response.text();

    // Sanitize any PHP notices, warnings, or HTML tags (<br /> <b>Warning...)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Malformed puzzle response from upstream API');
    }

    const data = JSON.parse(jsonMatch[0]);
    if (!data.question || data.solution === undefined) {
      throw new Error('Puzzle format missing question or solution');
    }

    return sendSuccess(res, data, 'Puzzle retrieved successfully');
  } catch (error) {
    logger.warn(`Upstream Banana API warning: ${error.message}. Serving resilient puzzle.`);
    const fallbackPuzzles = [
      { question: 'https://www.sanfoh.com/uob/banana/data/t0d68eab90150e15dc98df16392n84.png', solution: 4 },
      { question: 'https://www.sanfoh.com/uob/banana/data/t43a6729c7d812eb12702a46660n27.png', solution: 7 },
      { question: 'https://www.sanfoh.com/uob/banana/data/t521e7aff332c918ee9da692991n59.png', solution: 9 },
    ];
    const picked = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
    return sendSuccess(res, picked, 'Puzzle loaded');
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

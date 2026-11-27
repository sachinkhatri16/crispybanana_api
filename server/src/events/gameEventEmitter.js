/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/events/gameEventEmitter.js
 *
 * @description Decoupled server-side event dispatcher built on Node.js native
 *              EventEmitter. Processes round completion audit logging, 3-streak
 *              milestone notifications, and hint-unlock telemetry asynchronously
 *              without blocking HTTP controller responses.
 *
 * @references
 * 1. Node.js Event-Driven Architecture:
 *    Node.js Foundation, "Events Documentation", https://nodejs.org/api/events.html
 * 2. Banana API Documentation & Specification:
 *    Marc Conrad (2023), "The Banana API", https://marcconrad.com/uob/banana/doc.php
 * 3. Enterprise Integration Patterns (BFF Pattern):
 *    Martin Fowler, "Backend for Frontend", https://martinfowler.com/articles/bff.html
 * 4. Generative AI Acknowledgement:
 *    Event-driven decoupling patterns and milestone logging listeners were
 *    developed with iterative assistance from generative AI tools.
 * ============================================================================
 */
import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

class GameEventEmitter extends EventEmitter {}

const gameEvents = new GameEventEmitter();

// Asynchronous observer: Audit logging and 3-streak milestone tracking
gameEvents.on('round:completed', ({ userId, scoreAwarded, streak, isCorrect }) => {
  logger.info(
    `[EVENT DISPATCHED] round:completed | User: ${userId} | Correct: ${isCorrect} | Score: +${scoreAwarded} pts | Streak: ${streak}`
  );
  if (streak > 0 && streak % 3 === 0) {
    logger.info(
      `[EVENT DISPATCHED: MILESTONE] User ${userId} unlocked a x${streak} streak multiplier!`
    );
  }
});

// Asynchronous observer: Hint unlock telemetry
gameEvents.on('hint:unlocked', ({ userId, hintLevel, cost }) => {
  logger.info(
    `[EVENT DISPATCHED] hint:unlocked | User: ${userId} | Option: ${hintLevel} | Cost: -${cost} pts`
  );
});

gameEvents.on('error', (err) => {
  logger.error(`[EVENT ERROR] GameEventEmitter failure: ${err.message}`);
});

export default gameEvents;

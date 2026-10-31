import { TIMER_TIERS, AVATAR_OPTIONS, HINT_COSTS } from './constants.js';

export const getTimerTier = (seconds) => {
  if (seconds >= TIMER_TIERS.TIER_1.minTime) return TIMER_TIERS.TIER_1;
  if (seconds >= TIMER_TIERS.TIER_2.minTime) return TIMER_TIERS.TIER_2;
  return TIMER_TIERS.TIER_3;
};

export const calculateRoundScore = (timeLeft, streak) => {
  const tier = getTimerTier(timeLeft);
  const basePoints = tier.points; // 15 (Blitz), 10 (Steady), 5 (Clutch)
  const streakBonus = streak * 2;
  const points = basePoints + streakBonus;
  const nextStreak = streak + 1;

  return { points, basePoints, streakBonus, tier, nextStreak };
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const getAvatarIcon = (avatarId) => {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  return found ? found.icon : '🤠';
};

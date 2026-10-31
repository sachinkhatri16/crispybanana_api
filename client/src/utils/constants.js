export const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';
export const ROUND_SECONDS = 60;
export const REGISTER_BONUS_POINTS = 100;

export const TIMER_TIERS = {
  TIER_1: { step: 1, name: '⚡ Blitz Step (60–40s)', points: 15, color: '#10b981', minTime: 40 },
  TIER_2: { step: 2, name: '🔥 Steady Step (39–20s)', points: 10, color: '#f59e0b', minTime: 20 },
  TIER_3: { step: 3, name: '⏱️ Clutch Step (19–0s)', points: 5, color: '#ef4444', minTime: 0 },
};

export const HINT_COSTS = {
  1: 10, // Option 1 (Range): 10 pts
  2: 15, // Option 2 (Parity): 15 pts
  3: 20, // Option 3 (Elimination): 20 pts
};

export const AVATAR_OPTIONS = [
  { id: 'adventurer', icon: '🤠', label: 'Adventurer' },
  { id: 'banana-king', icon: '🍌', label: 'Banana King' },
  { id: 'detective', icon: '🕵️', label: 'Detective' },
  { id: 'speedster', icon: '⚡', label: 'Speedster' },
  { id: 'wizard', icon: '🧙', label: 'Wizard' },
  { id: 'gamer', icon: '🎮', label: 'Gamer' },
];

import api from './axios.js';

export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (username, email, password, avatar) =>
    api.post('/auth/register', { username, email, password, avatar }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const gameService = {
  getPuzzle: () => api.get('/game/puzzle'),
  useHint: (hintLevel, puzzleToken) => api.post('/game/hint', { hintLevel, puzzleToken }),
  recordRound: (roundData) => api.post('/game/round', roundData),
  getLeaderboard: () => api.get('/leaderboard'),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateAvatar: (avatar) => api.patch('/users/avatar', { avatar }),
  getHistory: () => api.get('/users/history'),
};

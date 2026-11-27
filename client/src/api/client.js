const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? '/api' : 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('banana_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('banana_token');
      localStorage.removeItem('banana_user');
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
};

export const gameApi = {
  recordRound: (payload) => apiRequest('/game/round', { method: 'POST', body: JSON.stringify(payload) }),
  getLeaderboard: () => apiRequest('/leaderboard', { method: 'GET' }),
};

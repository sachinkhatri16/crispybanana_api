import { useAuth } from '../hooks/useAuth.js';
import { getAvatarIcon } from '../utils/helpers.js';

export default function Navbar({ activePage, onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();

  const getPageTitle = () => {
    switch (activePage) {
      case 'play':
        return 'Play game';
      case 'demo':
        return 'Interactive Demo (Step-Wise 60s)';
      case 'leaderboard':
        return 'Leaderboard';
      case 'howto':
        return 'How to play';
      case 'dashboard':
        return 'Player Dashboard';
      case 'login':
        return 'Log in';
      case 'register':
        return 'Create Account';
      default:
        return 'Home';
    }
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Home</span>
        <b>/</b>
        <strong>{getPageTitle()}</strong>
      </div>

      <div className="player-controls">
        {isAuthenticated && user ? (
          <div className="user-badge">
            <div className="avatar">{getAvatarIcon(user.avatar)}</div>
            <div className="user-badge-info">
              <span className="user-badge-name">{user.username}</span>
              <span className="user-badge-score">
                {(user.metrics?.total_score || 0).toLocaleString()} pts
              </span>
            </div>
            <button
              className="logout-btn"
              onClick={logout}
              title="Sign out of your account"
            >
              Log out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="register-cta-btn"
              onClick={() => onNavigate('register')}
            >
              Register
            </button>
            <button
              className="login-cta-btn"
              onClick={() => onNavigate('login')}
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


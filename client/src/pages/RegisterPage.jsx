import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import { AVATAR_OPTIONS } from '../utils/constants.js';

export default function RegisterPage({ onNavigate, onSuccess }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('adventurer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password, selectedAvatar);
      if (onSuccess) onSuccess();
      else if (onNavigate) onNavigate('play');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">🍌</div>
          <h2>Join Banana Rush!</h2>
          <p>Create your account to save streaks, climb the ranks, and earn badges.</p>
        </div>

        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            padding: '10px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '18px',
            color: '#065f46',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <span style={{ fontSize: '20px' }}>🎁</span>
          <span>
            <strong>Registration Bonus:</strong> Every new player gets{' '}
            <strong style={{ color: '#047857' }}>+100 FREE points</strong> instantly!
          </span>
        </div>

        {error && (
          <div className="auth-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Choose your Avatar</label>
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  className={`avatar-choice ${selectedAvatar === av.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(av.id)}
                  title={av.label}
                >
                  <span className="choice-icon">{av.icon}</span>
                  <span className="choice-name">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-username">Player Username</label>
            <input
              id="reg-username"
              type="text"
              placeholder="e.g. BananaNinja"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="player@bananarush.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="At least 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-sm" /> Creating Account…
              </>
            ) : (
              <>
                Create Account <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="auth-link-btn" onClick={() => onNavigate('login')}>
              Log in here
            </button>
          </p>
          <button type="button" className="guest-link-btn" onClick={() => onNavigate('play')}>
            Skip & play as guest →
          </button>
        </div>
      </div>
    </div>
  );
}

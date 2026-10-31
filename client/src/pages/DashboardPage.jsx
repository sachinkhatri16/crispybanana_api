import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { userService } from '../api/services.js';
import { AVATAR_OPTIONS } from '../utils/constants.js';
import { getAvatarIcon } from '../utils/helpers.js';

export default function DashboardPage({ onNavigate }) {
  const { user, updateLocalMetrics } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'adventurer');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await userService.getProfile();
        if (res.success && res.data?.user) {
          setProfileData(res.data.user);
          setSelectedAvatar(res.data.user.avatar || 'adventurer');
        }
      } catch (err) {
        console.warn('Could not load profile:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateAvatar = async (newAvatar) => {
    setSelectedAvatar(newAvatar);
    setSavingAvatar(true);
    setMessage('');
    try {
      const res = await userService.updateAvatar(newAvatar);
      if (res.success) {
        setMessage('Avatar updated successfully!');
        if (user) {
          updateLocalMetrics(user.metrics);
        }
      }
    } catch (err) {
      setMessage('Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const metrics = profileData?.user_metrics || user?.metrics || {
    total_games: 0,
    total_wins: 0,
    total_score: 0,
    highest_score: 0,
    current_streak: 0,
    best_streak: 0,
  };

  const winRate =
    metrics.total_games > 0
      ? Math.round((metrics.total_wins / metrics.total_games) * 100)
      : 0;

  return (
    <div className="page-wrap dashboard-page">
      <div className="hero-row">
        <div>
          <p className="eyebrow">PLAYER PROFILE & STATS</p>
          <h1>
            Welcome, <span>{user?.username || 'Player'}</span>!
          </h1>
          <p className="subtitle">Track your career records, streak progression, and badges.</p>
        </div>
        <div className="hero-banana" style={{ fontSize: '50px' }}>
          {getAvatarIcon(selectedAvatar)}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">★</div>
          <div>
            <div className="stat-label">LIFETIME SCORE</div>
            <div className="stat-value">{metrics.total_score.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚡</div>
          <div>
            <div className="stat-label">BEST STREAK</div>
            <div className="stat-value">{metrics.best_streak} solves</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">♛</div>
          <div>
            <div className="stat-label">WIN RATE</div>
            <div className="stat-value">{winRate}%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">◷</div>
          <div>
            <div className="stat-label">TOTAL GAMES</div>
            <div className="stat-value">{metrics.total_games}</div>
          </div>
        </div>
      </div>

      <div className="game-card" style={{ padding: '24px 28px', marginTop: '20px' }}>
        <h2 style={{ font: "700 18px 'Space Grotesk'", margin: '0 0 8px' }}>
          Customize Your Avatar
        </h2>
        <p style={{ color: '#8c8f9d', fontSize: '12px', margin: '0 0 16px' }}>
          Select an avatar to represent your profile on the PostgreSQL leaderboard.
        </p>

        {message && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '14px',
              background: '#ecfdf5',
              color: '#065f46',
            }}
          >
            {message}
          </div>
        )}

        <div className="avatar-picker" style={{ maxWidth: '480px' }}>
          {AVATAR_OPTIONS.map((av) => (
            <button
              type="button"
              key={av.id}
              className={`avatar-choice ${selectedAvatar === av.id ? 'selected' : ''}`}
              onClick={() => handleUpdateAvatar(av.id)}
              disabled={savingAvatar}
            >
              <span className="choice-icon">{av.icon}</span>
              <span className="choice-name">{av.label}</span>
            </button>
          ))}
        </div>
      </div>

      {profileData?.game_rounds && profileData.game_rounds.length > 0 && (
        <div className="table-card" style={{ marginTop: '24px' }}>
          <div className="table-head" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <span>ROUND</span>
            <span>RESULT</span>
            <span>TIME TAKEN</span>
            <span>POINTS</span>
          </div>
          {profileData.game_rounds.map((round, idx) => (
            <div
              key={round.id || idx}
              className="table-row"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
            >
              <b>#{idx + 1}</b>
              <span>{round.is_correct ? '✅ Solved' : '❌ Missed'}</span>
              <span>{round.time_taken_ms ? `${(round.time_taken_ms / 1000).toFixed(1)}s` : 'N/A'}</span>
              <strong>+{round.score_awarded} pts</strong>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '28px' }}>
        <button className="primary-cta" onClick={() => onNavigate('play')}>
          Jump Back into the Game <span>→</span>
        </button>
      </div>
    </div>
  );
}


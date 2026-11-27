/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        client/src/App.jsx
 *
 * @description Root React application orchestrating virtual identity state,
 *              event-driven gameplay (SyntheticEvents & keyboard listeners),
 *              drift-resistant 60s countdown scoring, step-wise hints, and
 *              resilient Banana API puzzle loading.
 *
 * @references
 * 1. React Hooks & SyntheticEvent Delegation:
 *    Meta Platforms, "React Reference Overview & Responding to Events", https://react.dev/reference/react
 * 2. Banana API Specification:
 *    Marc Conrad (2023), "The Banana API", https://marcconrad.com/uob/banana/doc.php
 * 3. Web APIs (Fetch API, Window Timers & High-Resolution Timeouts):
 *    MDN Web Docs, "Using the Fetch API" & "setInterval()", https://developer.mozilla.org/
 * 4. Generative AI Acknowledgement:
 *    Portions of React state orchestration, regex sanitization fallback, and
 *    documentation headers were refined with assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useAuth from './hooks/useAuth.js';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InteractiveDemo from './components/InteractiveDemo.jsx';
import { gameService } from './api/services.js';
import { BANANA_API_URL, ROUND_SECONDS } from './utils/constants.js';
import {
  getTimerTier,
  calculateRoundScore,
  formatTime,
  getAvatarIcon,
} from './utils/helpers.js';

function App() {
  const { user, isAuthenticated, logout, updateLocalMetrics } = useAuth();
  const [activePage, setActivePage] = useState('play');
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [roundStartTime, setRoundStartTime] = useState(() => Date.now());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [message, setMessage] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  // Step-wise hint state
  const [hintLevel, setHintLevel] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState([]);
  const [hintNotice, setHintNotice] = useState(null);

  // Leaderboard data ONLY from PostgreSQL
  const [rankings, setRankings] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef(null);

  const playerName = user ? user.username : 'Guest Player';

  // Sync user metrics from PostgreSQL whenever user object updates
  useEffect(() => {
    if (user?.metrics) {
      setScore(user.metrics.total_score || 0);
      setStreak(user.metrics.current_streak || 0);
      setRounds(user.metrics.total_games || 0);
    }
  }, [user]);

  // Fetch PostgreSQL leaderboard strictly from DB
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await gameService.getLeaderboard();
      if (res.success && Array.isArray(res.data?.leaderboard)) {
        setRankings(res.data.leaderboard);
      } else {
        setRankings([]);
      }
    } catch {
      setRankings([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const loadPuzzle = useCallback(async () => {
    // Only load if user is logged in
    if (!isAuthenticated) return;

    setLoading(true);
    setError('');
    setMessage(null);
    setAnswer('');
    setHintLevel(0);
    setUnlockedHints([]);
    setHintNotice(null);
    setIsShaking(false);
    setTimeLeft(ROUND_SECONDS);
    setRoundStartTime(Date.now());
    setPuzzle(null); // Clear previous puzzle to avoid overlapping with errors

    try {
      let data = null;

      // 1. Try our server proxy first (clean & resilient against upstream PHP warnings)
      try {
        const serverRes = await gameService.getPuzzle();
        if (serverRes.success && serverRes.data?.question) {
          data = serverRes.data;
        }
      } catch {
        // Fallback below
      }

      // 2. If proxy didn't return, fetch from Banana API and sanitize JSON
      if (!data) {
        const response = await fetch(`${BANANA_API_URL}&t=${Date.now()}`);
        const text = await response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid puzzle format from server');
        data = JSON.parse(jsonMatch[0]);
      }

      if (!data || !data.question || data.solution === undefined) {
        throw new Error('Puzzle format missing question or solution.');
      }

      setPuzzle(data);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (requestError) {
      console.warn('Puzzle load error:', requestError.message);
      setError('Could not load puzzle. Please click try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPuzzle();
    }
  }, [isAuthenticated, loadPuzzle]);

  // 60-Second countdown timer
  useEffect(() => {
    if (activePage !== 'play' || !isAuthenticated || loading || message || !puzzle) return undefined;
    if (timeLeft <= 0) {
      handleTimeout();
      return undefined;
    }
    const timer = setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [activePage, isAuthenticated, loading, message, puzzle, timeLeft]);

  // Step-wise tier computation: Blitz (15 pts), Steady (10 pts), Clutch (5 pts)
  const timerTier = useMemo(() => getTimerTier(timeLeft), [timeLeft]);
  const progress = (timeLeft / ROUND_SECONDS) * 100;

  const handleTimeout = async () => {
    setMessage({
      type: 'timeout',
      title: 'Time is up!',
      body: `The missing digit was ${puzzle?.solution}. Keep trying!`,
    });
    setStreak(0);

    if (isAuthenticated && puzzle) {
      try {
        const timeTakenMs = Date.now() - roundStartTime;
        const res = await gameService.recordRound({
          puzzleUrl: puzzle.question,
          solution: puzzle.solution,
          userAnswer: null,
          isCorrect: false,
          scoreAwarded: 0,
          timeLimitSeconds: 60,
          timeTakenMs,
          status: 'timeout',
        });
        if (res.success && res.data?.metrics) {
          updateLocalMetrics(res.data.metrics);
          setScore(res.data.metrics.total_score);
          fetchLeaderboard();
        }
      } catch (err) {
        console.warn('Could not record timeout round:', err.message);
      }
    }
  };

  const submitAnswer = async (digitToSubmit) => {
    const finalAnswer = digitToSubmit !== undefined ? String(digitToSubmit) : answer;
    if (!puzzle || message || !/^\d$/.test(finalAnswer)) return;

    const isCorrect = Number(finalAnswer) === Number(puzzle.solution);
    const timeTakenMs = Date.now() - roundStartTime;

    if (isCorrect) {
      // Award 15, 10, or 5 points based on the 60s step timer + streak bonus
      const { points, basePoints, streakBonus, nextStreak } = calculateRoundScore(timeLeft, streak);
      const nextScore = score + points;

      setScore(nextScore);
      setStreak(nextStreak);
      setRounds((value) => value + 1);

      setMessage({
        type: 'success',
        title: '🎉 Great solve!',
        body: `+${points} points awarded! (Speed tier: +${basePoints} pts, Streak bonus: +${streakBonus} pts)`,
      });

      // Save to PostgreSQL via Prisma backend
      if (isAuthenticated) {
        try {
          const res = await gameService.recordRound({
            puzzleUrl: puzzle.question,
            solution: puzzle.solution,
            userAnswer: Number(finalAnswer),
            isCorrect: true,
            scoreAwarded: points,
            timeLimitSeconds: 60,
            timeTakenMs,
            status: 'completed',
          });
          if (res.success && res.data?.metrics) {
            updateLocalMetrics(res.data.metrics);
            setScore(res.data.metrics.total_score);
            fetchLeaderboard();
          }
        } catch (err) {
          console.warn('Failed to record round:', err.message);
        }
      }
    } else {
      setStreak(0);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      setMessage({
        type: 'wrong',
        title: '❌ Not quite!',
        body: 'Streak reset! Take another look at the symbols and try the next puzzle.',
      });

      if (isAuthenticated) {
        try {
          const res = await gameService.recordRound({
            puzzleUrl: puzzle.question,
            solution: puzzle.solution,
            userAnswer: Number(finalAnswer),
            isCorrect: false,
            scoreAwarded: 0,
            timeLimitSeconds: 60,
            timeTakenMs,
            status: 'failed',
          });
          if (res.success && res.data?.metrics) {
            updateLocalMetrics(res.data.metrics);
            setScore(res.data.metrics.total_score);
            fetchLeaderboard();
          }
        } catch (err) {
          console.warn('Failed to record round:', err.message);
        }
      }
    }
  };

  // Keyboard shortcut listener: Enter to continue or submit
  useEffect(() => {
    if (activePage !== 'play' || !isAuthenticated) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (message) {
          loadPuzzle();
        } else if (/^\d$/.test(answer)) {
          submitAnswer();
        }
      } else if (!message && /^[0-9]$/.test(e.key)) {
        setAnswer(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, isAuthenticated, message, answer, loadPuzzle]);

  // Step-wise hint unlocking with IMMEDIATE SCORE DEDUCTION in PostgreSQL (10, 15, 20 pts)
  const unlockNextHint = async () => {
    if (!puzzle || hintLevel >= 3 || message) return;
    const nextLevel = hintLevel + 1;
    const costs = { 1: 10, 2: 15, 3: 20 };
    const cost = costs[nextLevel];

    if (!isAuthenticated) {
      setHintNotice({
        type: 'error',
        text: '🔒 You must be logged in to unlock hints and play with bonus points.',
      });
      return;
    }

    // Check if player has enough points to buy this hint
    if (score < cost) {
      setHintNotice({
        type: 'error',
        text: `⚠️ Not enough points! Option ${nextLevel} hint costs ${cost} pts, but you currently have ${score} pts.`,
      });
      return;
    }

    const sol = Number(puzzle.solution);
    let hintText = '';
    if (nextLevel === 1) {
      hintText = sol <= 4 ? 'Range: The digit is LOW (0 to 4).' : 'Range: The digit is HIGH (5 to 9).';
    } else if (nextLevel === 2) {
      hintText = sol % 2 === 0 ? 'Parity: The missing digit is EVEN.' : 'Parity: The missing digit is ODD.';
    } else if (nextLevel === 3) {
      const alt = (sol + 2) % 10;
      hintText = `Elimination: It is either ${Math.min(sol, alt)} or ${Math.max(sol, alt)}.`;
    }

    try {
      // Immediately deduct from PostgreSQL user_metrics!
      const res = await gameService.useHint(nextLevel);
      if (res.success && res.data) {
        setScore(res.data.total_score);
        updateLocalMetrics(res.data.metrics);
        fetchLeaderboard();
      }

      setHintLevel(nextLevel);
      setUnlockedHints((prev) => [...prev, { level: nextLevel, text: hintText, cost }]);
      setHintNotice({
        type: 'success',
        text: `💡 Option ${nextLevel} Hint Unlocked! -${cost} pts deducted immediately from your total score.`,
        cost,
      });
    } catch (err) {
      setHintNotice({
        type: 'error',
        text: err.message || 'Could not deduct points for hint.',
      });
    }
  };

  const continueRound = () => {
    loadPuzzle();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => setActivePage('play')} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">🍌</span>
          <span>
            banana<span className="brand-accent">rush</span>
          </span>
        </div>

        <div className="side-label">GAME MENU</div>
        <nav>
          <NavItem
            icon="◈"
            label="Play game"
            active={activePage === 'play'}
            onClick={() => setActivePage('play')}
          />
          <NavItem
            icon="🎮"
            label="Interactive Demo"
            active={activePage === 'demo'}
            onClick={() => setActivePage('demo')}
          />
          <NavItem
            icon="♛"
            label="Leaderboard"
            active={activePage === 'leaderboard'}
            onClick={() => {
              setActivePage('leaderboard');
              fetchLeaderboard();
            }}
          />
          <NavItem
            icon="?"
            label="How to play"
            active={activePage === 'howto'}
            onClick={() => setActivePage('howto')}
          />

          <div style={{ margin: '14px 0 6px', borderTop: '1px solid #f0f1f5' }} />
          <div className="side-label" style={{ padding: '8px 16px' }}>ACCOUNT</div>

          {isAuthenticated ? (
            <>
              <NavItem
                icon="👤"
                label="My Profile"
                active={activePage === 'dashboard'}
                onClick={() => setActivePage('dashboard')}
              />
              <button className="nav-item" onClick={logout} title="Sign out">
                <span className="nav-icon">⎋</span>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavItem
                icon="➔"
                label="Log in"
                active={activePage === 'login'}
                onClick={() => setActivePage('login')}
              />
              <NavItem
                icon="✦"
                label="Register"
                active={activePage === 'register'}
                onClick={() => setActivePage('register')}
              />
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-help">
            <span>🎁</span>
            <div>
              <strong>100 Free Points!</strong>
              <p style={{ margin: '2px 0 0', color: '#888' }}>Every new account gets +100 bonus pts.</p>
            </div>
          </div>
          <div className="version">PERN Edition · PostgreSQL Live</div>
        </div>
      </aside>

      <main className="main-content">
        <Navbar activePage={activePage} onNavigate={(page) => setActivePage(page)} />

        {activePage === 'play' && (
          <>
            {!isAuthenticated ? (
              <LoginRequiredScreen
                onLogin={() => setActivePage('login')}
                onRegister={() => setActivePage('register')}
              />
            ) : (
              <PlayPage
                loading={loading}
                error={error}
                puzzle={puzzle}
                answer={answer}
                setAnswer={setAnswer}
                timeLeft={timeLeft}
                timerTier={timerTier}
                progress={progress}
                score={score}
                streak={streak}
                rounds={rounds}
                message={message}
                isShaking={isShaking}
                hintLevel={hintLevel}
                unlockedHints={unlockedHints}
                hintNotice={hintNotice}
                unlockNextHint={unlockNextHint}
                inputRef={inputRef}
                submitAnswer={submitAnswer}
                continueRound={continueRound}
                loadPuzzle={loadPuzzle}
                playerName={playerName}
                rankings={rankings}
                onOpenDemo={() => setActivePage('demo')}
              />
            )}
          </>
        )}

        {activePage === 'demo' && (
          <InteractiveDemo onStartPlaying={() => setActivePage('play')} />
        )}

        {activePage === 'leaderboard' && (
          <Leaderboard
            rankings={rankings}
            playerName={playerName}
            loading={leaderboardLoading}
            onRefresh={fetchLeaderboard}
            onPlay={() => setActivePage('play')}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage onNavigate={(page) => setActivePage(page)} />
        )}

        {activePage === 'howto' && (
          <HowTo
            onPlay={() => setActivePage('play')}
            onDemo={() => setActivePage('demo')}
          />
        )}

        {activePage === 'login' && (
          <LoginPage
            onNavigate={(page) => setActivePage(page)}
            onSuccess={() => {
              setActivePage('play');
              fetchLeaderboard();
            }}
          />
        )}

        {activePage === 'register' && (
          <RegisterPage
            onNavigate={(page) => setActivePage(page)}
            onSuccess={() => {
              setActivePage('play');
              fetchLeaderboard();
            }}
          />
        )}
      </main>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      {label}
      {active && <span className="nav-arrow">›</span>}
    </button>
  );
}

function LoginRequiredScreen({ onLogin, onRegister }) {
  return (
    <div className="page-wrap" style={{ maxWidth: '520px', padding: '60px 20px', textAlign: 'center' }}>
      <div className="auth-card" style={{ margin: '0 auto' }}>
        <div style={{ fontSize: '50px', marginBottom: '12px' }}>🔒</div>
        <h1 style={{ font: "700 24px 'Space Grotesk'", margin: '0 0 10px', color: '#2e3039' }}>
          Please Log In to Play
        </h1>
        <p style={{ color: '#7a7e8e', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px' }}>
          To play Banana Rush, submit answers, and rank on the live PostgreSQL leaderboard, you must be logged into your account.
        </p>

        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            padding: '12px 16px',
            borderRadius: '10px',
            color: '#065f46',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🎁</span>
          <span>
            <strong>New Player Offer:</strong> Create an account today and receive{' '}
            <strong style={{ color: '#047857' }}>+100 FREE points</strong> instantly!
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="primary-cta" style={{ width: '100%', height: '44px' }} onClick={onLogin}>
            Log In to Play <span>→</span>
          </button>
          <button
            onClick={onRegister}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '8px',
              border: '1.5px solid #e1e3ec',
              background: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              color: '#4e5262',
            }}
          >
            Create Free Account (+100 Pts)
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayPage({
  loading,
  error,
  puzzle,
  answer,
  setAnswer,
  timeLeft,
  timerTier,
  progress,
  score,
  streak,
  rounds,
  message,
  isShaking,
  hintLevel,
  unlockedHints,
  hintNotice,
  unlockNextHint,
  inputRef,
  submitAnswer,
  continueRound,
  loadPuzzle,
  playerName,
  rankings,
  onOpenDemo,
}) {
  const currentRank =
    rankings.length > 0
      ? Math.max(1, rankings.findIndex((entry) => entry.username === playerName) + 1)
      : '-';

  return (
    <div className="page-wrap">
      <section className="hero-row">
        <div>
          <p className="eyebrow">MISSING DIGIT CHALLENGE · 60S STEP-WISE</p>
          <h1>
            Ready to make a <span>smash?</span>
          </h1>
          <p className="subtitle">
            Solve visual equations in 60 seconds, build streaks, and rank on PostgreSQL.
          </p>
        </div>
        <div className="hero-banana" aria-hidden="true">
          🍌<span>✦</span>
        </div>
      </section>

      <div className="stats-grid">
        <Stat
          icon="★"
          label="TOTAL SCORE"
          value={score.toLocaleString()}
          deductionBadge={hintNotice?.cost}
          accent="purple"
        />
        <Stat
          icon="⚡"
          label="CURRENT STREAK"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {streak} {streak === 1 ? 'solve' : 'solves'}
              {streak >= 2 && <span className="streak-active-badge">🔥 {streak}x Active</span>}
            </span>
          }
          accent="orange"
        />
        <Stat icon="♛" label="YOUR RANK" value={currentRank !== '-' ? `#${currentRank}` : 'Unranked'} accent="green" />
        <Stat icon="◷" label="ROUNDS PLAYED" value={rounds} accent="blue" />
      </div>

      <section className={`game-card ${isShaking ? 'shake-anim' : ''}`}>
        <div className="game-card-head">
          <div>
            <span className="live-dot" /> LIVE 60-SEC PUZZLE
          </div>
          <div className="round-label">
            Round {rounds + 1} <span>·</span> 60s Step-Wise
          </div>
        </div>

        {/* Step-wise Tier Bar: Correct answer 15, 10, 5 */}
        <div className="step-timer-wrapper">
          <div className="step-tiers-strip">
            <span className={`step-tier-pill tier-1 ${timerTier.step === 1 ? 'active' : ''}`}>
              ⚡ Blitz (60–40s) <span className="tier-mult-tag">+15 pts</span>
            </span>
            <span className={`step-tier-pill tier-2 ${timerTier.step === 2 ? 'active' : ''}`}>
              🔥 Steady (39–20s) <span className="tier-mult-tag">+10 pts</span>
            </span>
            <span className={`step-tier-pill tier-3 ${timerTier.step === 3 ? 'active' : ''}`}>
              ⏱️ Clutch (19–0s) <span className="tier-mult-tag">+5 pts</span>
            </span>
          </div>
        </div>

        <div className="timer-track">
          <div
            className="timer-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: timerTier.color,
            }}
          />
        </div>

        <div className="puzzle-area">
          <div className="puzzle-copy">
            <h2>What is the missing digit?</h2>
            <p>Study the image carefully, then tap or type the missing digit (0–9).</p>
          </div>

          <div className="puzzle-image-wrap">
            {loading && (
              <div className="image-loading">
                <span className="spinner" /> Loading fresh banana puzzle…
              </div>
            )}
            {error && !loading && (
              <div className="image-error">
                <strong>Oops!</strong>
                <span>{error}</span>
                <button onClick={loadPuzzle}>Try again</button>
              </div>
            )}
            {!error && !loading && puzzle && (
              <img
                src={puzzle.question}
                alt="Banana missing digit puzzle"
                className="puzzle-image"
              />
            )}
          </div>

          <div className="timer-display" style={{ color: timerTier.color }}>
            <span>◷</span> {formatTime(timeLeft)}{' '}
            <small style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>
              ({timerTier.name} · {timerTier.points} pts)
            </small>
          </div>

          {/* Answer Display */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAnswer();
            }}
            className="answer-form"
          >
            <div className="answer-input-wrap">
              <input
                ref={inputRef}
                inputMode="numeric"
                pattern="[0-9]"
                maxLength="1"
                value={answer}
                onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))}
                placeholder="?"
                aria-label="Your answer"
                disabled={Boolean(message) || loading}
              />
              <span>/ 1 digit</span>
            </div>
          </form>

          {/* INTERACTIVE ON-SCREEN NUMBER PAD (0-9) */}
          <div className="interactive-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
              <button
                key={digit}
                type="button"
                className={`keypad-number-btn ${answer === String(digit) ? 'active' : ''}`}
                onClick={() => {
                  setAnswer(String(digit));
                }}
                disabled={Boolean(message) || loading}
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Keypad Actions: Clear & Submit */}
          <div className="keypad-actions-row">
            <button
              type="button"
              className="keypad-action-btn clear"
              onClick={() => setAnswer('')}
              disabled={!answer || Boolean(message) || loading}
            >
              ⌫ Clear
            </button>
            <button
              type="button"
              className="keypad-action-btn submit"
              onClick={() => submitAnswer()}
              disabled={!answer || Boolean(message) || loading}
            >
              Submit Answer <span>→</span>
            </button>
          </div>

          {/* Step-wise Hint System: 3 Options (10, 15, 20 pts deducted immediately) */}
          <div className="step-hints-panel">
            <div className="step-hints-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡 Step-Wise Hints ({hintLevel}/3 used)</span>
              </div>
              {hintLevel < 3 && !message && (
                <button
                  type="button"
                  className="step-hint-trigger"
                  onClick={unlockNextHint}
                  disabled={Boolean(message) || score < (hintLevel === 0 ? 10 : hintLevel === 1 ? 15 : 20)}
                >
                  Unlock Option {hintLevel + 1} Hint (−{hintLevel === 0 ? 10 : hintLevel === 1 ? 15 : 20} pts from total score)
                </button>
              )}
            </div>

            {hintNotice && (
              <div className={`hint-notice-banner ${hintNotice.type}`}>
                {hintNotice.text}
              </div>
            )}

            {unlockedHints.length > 0 && (
              <div className="step-hints-list">
                {unlockedHints.map((h) => (
                  <div key={h.level} className="hint-item unlocked">
                    <strong>Option {h.level} Clue (−{h.cost} pts deducted):</strong> {h.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`result-banner ${message.type} celebrate-bounce`}>
            <span className="result-symbol">
              {message.type === 'success' ? '✓' : message.type === 'hint' ? '💡' : '!'}
            </span>
            <div>
              <strong>{message.title}</strong>
              <p>{message.body}</p>
            </div>
            <button onClick={continueRound}>
              {message.type === 'success' ? 'Next puzzle → (or press Enter)' : 'Try another puzzle →'}
            </button>
          </div>
        )}
      </section>

      <div className="under-game">
        <div className="streak-note">
          <span>🔥</span>
          <div>
            <strong>{streak ? `${streak} in a row!` : 'Start a streak'}</strong>
            <p>
              {streak
                ? 'Keep solving to stack multiplier bonuses in PostgreSQL!'
                : 'Correct answers within 60s trigger speed tier points.'}
            </p>
          </div>
        </div>
        <div>
          <button className="reset-button" onClick={onOpenDemo}>
            🎮 View Interactive Demo
          </button>
        </div>
      </div>

      <p className="api-credit">
        Puzzles powered by{' '}
        <a href="https://marcconrad.com/uob/banana/" target="_blank" rel="noreferrer">
          Marc Conrad’s Banana API
        </a>{' '}
        · One fresh challenge per round
      </p>
    </div>
  );
}

function Stat({ icon, label, value, accent, deductionBadge }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${accent}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value}
          {deductionBadge && (
            <span className="deduction-badge">
              -{deductionBadge} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ rankings, playerName, loading, onRefresh, onPlay }) {
  return (
    <div className="page-wrap leaderboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">POSTGRESQL LIVE LEADERBOARD</p>
          <h1>
            Climb the <span>leaderboard.</span>
          </h1>
          <p className="subtitle">Real-time rankings stored in PostgreSQL database.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: '#f2f3f7',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#555',
          }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <span className="spinner" />
          <p style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>
            Loading rankings from PostgreSQL...
          </p>
        </div>
      )}

      {!loading && rankings.length === 0 && (
        <div className="leaderboard-empty">
          <div className="leaderboard-empty-icon">🏆</div>
          <h3>No leaderboard entries yet!</h3>
          <p>Be the very first player to solve a 60-second puzzle and take the #1 spot.</p>
          <button className="primary-cta" onClick={onPlay} style={{ marginTop: '16px' }}>
            Play First Round Now <span>→</span>
          </button>
        </div>
      )}

      {!loading && rankings.length > 0 && (
        <>
          <div className="podium">
            {rankings.slice(0, 3).map((entry, index) => (
              <div className={`podium-card place-${index + 1}`} key={entry.username || index}>
                <div className="medal">{['🥇', '🥈', '🥉'][index]}</div>
                <div className="podium-name">{entry.username}</div>
                <strong>{(entry.total_score || entry.score || 0).toLocaleString()}</strong>
                <small>{entry.streak || entry.best_streak || 0} streak</small>
              </div>
            ))}
          </div>

          <div className="table-card">
            <div className="table-head">
              <span>RANK</span>
              <span>PLAYER</span>
              <span>BEST STREAK</span>
              <span>SCORE</span>
            </div>
            {rankings.map((entry, index) => (
              <div
                className={`table-row ${entry.username === playerName ? 'you-row' : ''}`}
                key={`${entry.username}-${index}`}
              >
                <b>#{entry.rank || index + 1}</b>
                <span>
                  <i className="table-avatar">{getAvatarIcon(entry.avatar)}</i>
                  {entry.username}
                  {entry.username === playerName && <em>YOU</em>}
                </span>
                <span>{entry.streak || entry.best_streak || 0} solves</span>
                <strong>{(entry.total_score || entry.score || 0).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button className="primary-cta" onClick={onPlay}>
          Play a round to rank up <span>→</span>
        </button>
      </div>
    </div>
  );
}

function HowTo({ onPlay, onDemo }) {
  return (
    <div className="page-wrap howto-page">
      <p className="eyebrow">QUICK START</p>
      <h1>
        Play smart. <span>Score big.</span>
      </h1>
      <p className="subtitle">Everything you need to become a Banana Rush master.</p>

      <div className="howto-grid">
        <GuideStep
          number="01"
          title="🎁 100 Free Points"
          text="Every player gets 100 bonus points immediately upon registering their account in PostgreSQL."
          icon="🎉"
        />
        <GuideStep
          number="02"
          title="Speed Scoring (15, 10, 5)"
          text="Blitz Step (60–40s) awards 15 pts, Steady Step (39–20s) awards 10 pts, Clutch Step (19–0s) awards 5 pts."
          icon="⚡"
        />
        <GuideStep
          number="03"
          title="3-Option Hints (10, 15, 20)"
          text="Option 1 Range costs 10 pts, Option 2 Parity costs 15 pts, Option 3 Elimination costs 20 pts (deducted immediately)."
          icon="💡"
        />
      </div>

      <div className="scoring-card">
        <div>
          <p className="eyebrow">HOW SCORING WORKS</p>
          <h2>Speed + Strategy.</h2>
          <p>
            Correct answers yield 15 pts (Blitz), 10 pts (Steady), or 5 pts (Clutch) + streak bonus. Option hints cost 10, 15, and 20 pts deducted directly from total score.
          </p>
        </div>
        <div className="scoring-example">
          <span>Speed (15 / 10 / 5)</span>
          <b>−</b>
          <span>Hints (10 / 15 / 20)</span>
          <b>+</b>
          <span>Streak Bonus</span>
          <strong>= ROUND SCORE</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button className="primary-cta" onClick={onPlay}>
          Play your first round <span>→</span>
        </button>
        <button
          onClick={onDemo}
          style={{
            background: '#fff',
            border: '1.5px solid #e2e4ea',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '12px',
            padding: '0 20px',
            color: '#4e5262',
            height: '42px',
          }}
        >
          🎮 Try Interactive Demo
        </button>
      </div>
    </div>
  );
}

function GuideStep({ number, title, text, icon }) {
  return (
    <div className="guide-step">
      <div className="guide-icon">{icon}</div>
      <span className="step-number">{number}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function GuideModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="guide-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="modal-banana">🍌</div>
        <p className="eyebrow">BEGINNER'S GUIDE</p>
        <h2>Welcome to Banana Rush!</h2>
        <p>
          Each round shows a visual equation puzzle with one missing digit (0-9). Answer before the 60-second timer
          runs out. The Blitz step awards 15 speed points!
        </p>
        <div className="modal-tip">
          <span>💡</span>
          <strong>Pro tip:</strong> 3-option hints help you narrow down the answer (costs 10, 15, and 20 points).
        </div>
        <button className="primary-cta" onClick={onClose}>
          Got it, let’s play <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default App;

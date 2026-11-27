import { useState, useEffect } from 'react';

export default function InteractiveDemo({ onStartPlaying }) {
  const [activeStep, setActiveStep] = useState(1);
  const [demoTimer, setDemoTimer] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedDigit, setSelectedDigit] = useState('');
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [hintStage, setHintStage] = useState(0);

  // Simulated 60s timer for Step 2
  useEffect(() => {
    let interval = null;
    if (timerRunning && demoTimer > 0) {
      interval = setInterval(() => {
        setDemoTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (demoTimer === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, demoTimer]);

  const getTimerStep = (seconds) => {
    if (seconds >= 40) return { step: 1, name: 'Lightning Blitz (Tier 1)', points: 15, bonus: '+15 pts', mult: 'Fast', color: '#10b981' };
    if (seconds >= 20) return { step: 2, name: 'Steady Pace (Tier 2)', points: 10, bonus: '+10 pts', mult: 'Steady', color: '#f59e0b' };
    return { step: 3, name: 'Clutch Finish (Tier 3)', points: 5, bonus: '+5 pts', mult: 'Clutch', color: '#ef4444' };
  };

  const currentTier = getTimerStep(demoTimer);

  const handleTestAnswer = (digit) => {
    setSelectedDigit(digit);
    if (digit === 2) {
      const earned = currentTier.points;
      setDemoFeedback({
        correct: true,
        title: '🎉 Correct! Missing digit is 2!',
        message: `Calculated: 🐵 (7) - 🍌 (5) = 2. You scored +${earned} points for this ${currentTier.name}!`,
      });
    } else {
      setDemoFeedback({
        correct: false,
        title: '❌ Not quite!',
        message: '🐵 is 7 and 🍌 is 5. What is 7 - 5? Try again!',
      });
    }
  };

  const handleNextHint = () => {
    setHintStage((prev) => Math.min(prev + 1, 3));
  };

  return (
    <div className="page-wrap demo-page">
      <div className="demo-header">
        <p className="eyebrow">INTERACTIVE GAME TUTORIAL</p>
        <h1>How To Play <span>Banana Rush</span></h1>
        <p className="subtitle">Master the 60-second missing digit puzzle in 4 easy step-by-step stages.</p>
      </div>

      {/* Step navigation tabs */}
      <div className="demo-tabs">
        <button
          className={`demo-tab ${activeStep === 1 ? 'active' : ''}`}
          onClick={() => setActiveStep(1)}
        >
          <span className="tab-num">01</span> Visual Equation
        </button>
        <button
          className={`demo-tab ${activeStep === 2 ? 'active' : ''}`}
          onClick={() => setActiveStep(2)}
        >
          <span className="tab-num">02</span> 60s Step-Wise Timer
        </button>
        <button
          className={`demo-tab ${activeStep === 3 ? 'active' : ''}`}
          onClick={() => setActiveStep(3)}
        >
          <span className="tab-num">03</span> Step-Wise Hints
        </button>
        <button
          className={`demo-tab ${activeStep === 4 ? 'active' : ''}`}
          onClick={() => setActiveStep(4)}
        >
          <span className="tab-num">04</span> Interactive Practice
        </button>
      </div>

      {/* Step 1: Visual Equation */}
      {activeStep === 1 && (
        <div className="demo-card">
          <div className="demo-card-badge">STEP 1 OF 4</div>
          <h2>Understanding the Visual Equations</h2>
          <p className="demo-intro">
            Every puzzle uses emojis representing hidden numbers. Work your way down equation by equation:
          </p>

          <div className="equation-showcase">
            <div className="eq-row">
              <span className="eq-expr">🍌 + 🍌 + 🍌 = 15</span>
              <span className="eq-arrow">➔</span>
              <span className="eq-deduction">3 bananas = 15, so <strong>🍌 = 5</strong></span>
            </div>
            <div className="eq-row">
              <span className="eq-expr">🍌 (5) + 🐵 = 12</span>
              <span className="eq-arrow">➔</span>
              <span className="eq-deduction">12 − 5 = 7, so <strong>🐵 = 7</strong></span>
            </div>
            <div className="eq-row highlight">
              <span className="eq-expr">🐵 (7) − 🍌 (5) = ?</span>
              <span className="eq-arrow">➔</span>
              <span className="eq-deduction">7 − 5 = <strong>2</strong> (Your 1-digit answer!)</span>
            </div>
          </div>

          <div className="demo-tip-box">
            <span>💡</span>
            <div>
              <strong>Key rule:</strong> The missing solution is <em>always</em> a single digit between <strong>0 and 9</strong>.
            </div>
          </div>

          <div className="demo-card-actions">
            <button className="primary-cta" onClick={() => setActiveStep(2)}>
              Next: 60s Step-Wise Timer <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 60s Step-Wise Timer */}
      {activeStep === 2 && (
        <div className="demo-card">
          <div className="demo-card-badge">STEP 2 OF 4</div>
          <h2>The 60-Second Step-Wise Timer</h2>
          <p className="demo-intro">
            You have exactly <strong>60 seconds</strong> per round. The timer is broken down into 3 speed tiers.
            The faster you solve, the higher your score multiplier!
          </p>

          <div className="timer-tiers-grid">
            <div className={`tier-card ${currentTier.step === 1 ? 'current' : ''}`}>
              <div className="tier-header" style={{ color: '#10b981' }}>
                <span className="tier-icon">⚡</span> Tier 1: Blitz Step
              </div>
              <div className="tier-range">60s – 40s</div>
              <div className="tier-mult" style={{ color: '#10b981' }}>+15 Points</div>
              <p className="tier-desc">Awarded for fast solves between 60s and 40s.</p>
            </div>

            <div className={`tier-card ${currentTier.step === 2 ? 'current' : ''}`}>
              <div className="tier-header" style={{ color: '#f59e0b' }}>
                <span className="tier-icon">🔥</span> Tier 2: Steady Step
              </div>
              <div className="tier-range">39s – 20s</div>
              <div className="tier-mult" style={{ color: '#f59e0b' }}>+10 Points</div>
              <p className="tier-desc">Awarded for steady solves between 39s and 20s.</p>
            </div>

            <div className={`tier-card ${currentTier.step === 3 ? 'current' : ''}`}>
              <div className="tier-header" style={{ color: '#ef4444' }}>
                <span className="tier-icon">⏱️</span> Tier 3: Clutch Step
              </div>
              <div className="tier-range">19s – 0s</div>
              <div className="tier-mult" style={{ color: '#ef4444' }}>+5 Points</div>
              <p className="tier-desc">Awarded for solves between 19s and 0s before the buzzer.</p>
            </div>
          </div>

          {/* Interactive timer simulator */}
          <div className="timer-simulator">
            <div className="sim-head">
              <span>Interactive Timer Simulator:</span>
              <strong style={{ color: currentTier.color }}>
                {demoTimer}s ({currentTier.name})
              </strong>
            </div>

            <div className="sim-bar-track">
              <div
                className="sim-bar-fill"
                style={{
                  width: `${(demoTimer / 60) * 100}%`,
                  backgroundColor: currentTier.color,
                }}
              />
            </div>

            <div className="sim-controls">
              <button
                className="sim-btn"
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? '⏸️ Pause Timer' : '▶️ Run Timer Simulation'}
              </button>
              <button
                className="sim-btn-outline"
                onClick={() => { setDemoTimer(60); setTimerRunning(false); }}
              >
                ↺ Reset to 60s
              </button>
              <button
                className="sim-btn-outline"
                onClick={() => setDemoTimer(45)}
              >
                Set 45s (Tier 1)
              </button>
              <button
                className="sim-btn-outline"
                onClick={() => setDemoTimer(30)}
              >
                Set 30s (Tier 2)
              </button>
              <button
                className="sim-btn-outline"
                onClick={() => setDemoTimer(10)}
              >
                Set 10s (Tier 3)
              </button>
            </div>
          </div>

          <div className="demo-card-actions">
            <button className="secondary-btn" onClick={() => setActiveStep(1)}>
              ← Back
            </button>
            <button className="primary-cta" onClick={() => setActiveStep(3)}>
              Next: Step-Wise Hints <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Step-Wise Hints (3 Options: 10, 15, 20 pts) */}
      {activeStep === 3 && (
        <div className="demo-card">
          <div className="demo-card-badge">STEP 3 OF 4</div>
          <h2>Step-Wise Hint System (3 Options)</h2>
          <p className="demo-intro">
            Need help? Choose from 3 progressive hint options. Each option reveals a key clue:
          </p>

          <div className="hints-stepper">
            <div className={`hint-step-card ${hintStage >= 1 ? 'unlocked' : ''}`}>
              <div className="hstep-num">Option 1 Hint (−10 pts)</div>
              <h3>Range Filter</h3>
              <p>
                {hintStage >= 1
                  ? '🎯 Clue: The missing digit is in the LOWER half: between 0 and 4.'
                  : '🔒 Click below to unlock Option 1 (−10 pts)'}
              </p>
            </div>

            <div className={`hint-step-card ${hintStage >= 2 ? 'unlocked' : ''}`}>
              <div className="hstep-num">Option 2 Hint (−15 pts)</div>
              <h3>Parity Filter</h3>
              <p>
                {hintStage >= 2
                  ? '🎯 Clue: The missing digit is an EVEN number (0, 2, or 4).'
                  : '🔒 Click below to unlock Option 2 (−15 pts)'}
              </p>
            </div>

            <div className={`hint-step-card ${hintStage >= 3 ? 'unlocked' : ''}`}>
              <div className="hstep-num">Option 3 Hint (−20 pts)</div>
              <h3>Final Elimination</h3>
              <p>
                {hintStage >= 3
                  ? '🎯 Clue: It is NOT 0 or 4. The only answer left is 2!'
                  : '🔒 Click below to unlock Option 3 (−20 pts)'}
              </p>
            </div>
          </div>

          <div className="hint-unlock-cta">
            {hintStage < 3 ? (
              <button className="unlock-hint-btn" onClick={handleNextHint}>
                💡 Unlock Option {hintStage + 1} Hint (−{hintStage === 0 ? 10 : hintStage === 1 ? 15 : 20} pts)
              </button>
            ) : (
              <div className="hints-all-unlocked">✨ All 3 hint options unlocked!</div>
            )}
          </div>

          <div className="demo-card-actions">
            <button className="secondary-btn" onClick={() => setActiveStep(2)}>
              ← Back
            </button>
            <button className="primary-cta" onClick={() => setActiveStep(4)}>
              Next: Try Interactive Practice! <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Interactive Practice Round */}
      {activeStep === 4 && (
        <div className="demo-card practice-card">
          <div className="demo-card-badge">STEP 4 OF 4 · TRY IT NOW!</div>
          <h2>Interactive Practice Puzzle</h2>
          <p className="demo-intro">
            Test what you learned! Solve this demo puzzle by tapping the correct digit below:
          </p>

          <div className="practice-box">
            <div className="practice-puzzle-display">
              <div className="mini-eq">🍌 + 🍌 + 🍌 = 15</div>
              <div className="mini-eq">🍌 + 🐵 = 12</div>
              <div className="mini-eq highlight-eq">🐵 − 🍌 = ❓</div>
            </div>

            <div className="keypad-label">Tap your answer (0–9):</div>
            <div className="demo-keypad">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  className={`keypad-btn ${selectedDigit === digit ? 'selected' : ''}`}
                  onClick={() => handleTestAnswer(digit)}
                >
                  {digit}
                </button>
              ))}
            </div>

            {demoFeedback && (
              <div className={`demo-feedback-banner ${demoFeedback.correct ? 'success' : 'error'}`}>
                <strong>{demoFeedback.title}</strong>
                <p>{demoFeedback.message}</p>
              </div>
            )}
          </div>

          <div className="demo-finish-section">
            <p>You're all set to climb the leaderboard!</p>
            <button className="play-real-btn" onClick={onStartPlaying}>
              🚀 Launch Real Game Now! <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


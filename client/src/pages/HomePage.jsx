export default function HomePage({ onStartGame, onOpenDemo }) {
  return (
    <div className="page-wrap home-page">
      <section className="hero-row">
        <div>
          <p className="eyebrow">WELCOME TO BANANA RUSH · PERN</p>
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

      <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
        <button className="primary-cta" onClick={onStartGame}>
          Play Game Now <span>→</span>
        </button>
        <button
          onClick={onOpenDemo}
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


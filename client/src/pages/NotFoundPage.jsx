export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="page-wrap" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍌</div>
      <h1 style={{ font: "700 32px 'Space Grotesk'", margin: '0 0 10px' }}>404 - Page Not Found</h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        The banana slipped away! The page you are looking for does not exist.
      </p>
      <button className="primary-cta" onClick={() => onNavigate('play')}>
        Return to Game <span>→</span>
      </button>
    </div>
  );
}


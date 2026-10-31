import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute({ children, fallback = null, onRedirect }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '300px' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (onRedirect) onRedirect();
    return fallback;
  }

  return children;
}


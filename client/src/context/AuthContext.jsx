/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        client/src/context/AuthContext.jsx
 *
 * @description React authentication context managing virtual identity state,
 *              session revalidation (/auth/me), login, registration, and
 *              logout (clearing both client state and HTTP-Only cookie).
 *
 * @references
 * 1. React Context & Hooks Documentation:
 *    Meta Open Source, "React Reference: createContext & useCallback",
 *    https://react.dev/reference/react/createContext
 * 2. Password & Session Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet" & "Session Management
 *    Cheat Sheet", https://cheatsheetseries.owasp.org/
 * 3. JSON Web Token & HTTP-Only Cookies:
 *    IETF RFC 7519 (JWT) & MDN Web Docs HTTP Cookies
 * 4. Generative AI Acknowledgement:
 *    Async logout cookie-clearing flow and documentation header assisted by AI.
 * ============================================================================
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/services.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('banana_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('banana_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authService.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('banana_user', JSON.stringify(response.data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    if (res.success && res.data) {
      const { user: loggedInUser, token: authToken } = res.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('banana_token', authToken);
      localStorage.setItem('banana_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const register = useCallback(async (username, email, password, avatar) => {
    const res = await authService.register(username, email, password, avatar);
    if (res.success && res.data) {
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('banana_token', authToken);
      localStorage.setItem('banana_user', JSON.stringify(registeredUser));
      return registeredUser;
    }
    throw new Error(res.message || 'Registration failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Always clear local session state even if the network logout request fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('banana_token');
      localStorage.removeItem('banana_user');
    }
  }, []);

  const updateLocalMetrics = useCallback((metrics) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, metrics };
      localStorage.setItem('banana_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    updateLocalMetrics,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

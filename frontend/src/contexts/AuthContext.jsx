import { createContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'smartbiz_auth_session';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  handleCallback: () => {},
});

/**
 * Constructs the WorkOS login URL from environment variables
 * @param {string} clientId - WorkOS client ID
 * @param {string} redirectUri - OAuth redirect URI
 * @returns {string} The constructed WorkOS login URL
 */
export function buildWorkOSLoginUrl(clientId, redirectUri) {
  const baseUrl = 'https://api.workos.com/user_management/authorize';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    provider: 'authkit',
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extracts authorization code from URL query parameters
 * @param {string} search - URL search string (e.g., "?code=abc123")
 * @returns {{ code: string | null, error: string | null }}
 */
export function extractCallbackParams(search) {
  const params = new URLSearchParams(search);
  return {
    code: params.get('code'),
    error: params.get('error'),
  };
}

/**
 * Reads session data from LocalStorage
 * @returns {{ code: string, timestamp: number } | null}
 */
export function readSessionFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (session && typeof session.code === 'string') {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Writes session data to LocalStorage
 * @param {{ code: string, timestamp: number }} session
 */
export function writeSessionToStorage(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clears session data from LocalStorage
 */
export function clearSessionFromStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Initialize auth state from LocalStorage on mount
  useEffect(() => {
    const session = readSessionFromStorage();
    if (session) {
      setUser({ code: session.code });
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(() => {
    const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_WORKOS_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.warn('WorkOS environment variables not configured');
      return;
    }
    
    const loginUrl = buildWorkOSLoginUrl(clientId, redirectUri);
    window.location.href = loginUrl;
  }, []);

  const logout = useCallback(() => {
    clearSessionFromStorage();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const handleCallback = useCallback((code) => {
    if (!code) return;
    
    const session = {
      code,
      timestamp: Date.now(),
    };
    
    writeSessionToStorage(session);
    setUser({ code });
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

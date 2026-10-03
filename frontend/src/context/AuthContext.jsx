import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'landtrace_auth_token';
const USER_KEY = 'landtrace_auth_user';

export const PUBLIC_GUEST_USER = {
  id: 'usr-guest-001',
  email: 'public@landtrace.in',
  name: 'Public Explorer',
  full_name: 'Public Explorer / Guest',
  role: 'investigator'
};
export const PUBLIC_GUEST_TOKEN = 'cf_jwt_public_open_access_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(PUBLIC_GUEST_USER);
  const [token, setToken] = useState(PUBLIC_GUEST_TOKEN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

        if (!storedToken) {
          // Open Access to All: Default to Public Explorer
          setUser(PUBLIC_GUEST_USER);
          setToken(PUBLIC_GUEST_TOKEN);
          setLoading(false);
          return;
        }

        setToken(storedToken);

        // Pre-populate user from storage for instantaneous UI response
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser(PUBLIC_GUEST_USER);
          }
        }

        // Validate token with backend /api/auth/me
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            // Sync storage
            if (localStorage.getItem(TOKEN_KEY)) {
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            } else {
              sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } catch (err) {
        console.warn('Backend offline or auth check error, retaining offline cached session if available:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(PUBLIC_GUEST_USER);
    setToken(PUBLIC_GUEST_TOKEN);
  };

  const enterAsPublicGuest = () => {
    setUser(PUBLIC_GUEST_USER);
    setToken(PUBLIC_GUEST_TOKEN);
    localStorage.setItem(TOKEN_KEY, PUBLIC_GUEST_TOKEN);
    localStorage.setItem(USER_KEY, JSON.stringify(PUBLIC_GUEST_USER));
    return { success: true, user: PUBLIC_GUEST_USER };
  };

  const login = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember_me: rememberMe
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const receivedToken = data.token;
      const receivedUser = data.user;

      setToken(receivedToken);
      setUser(receivedUser);

      // Persist based on rememberMe preference
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      } else {
        sessionStorage.setItem(TOKEN_KEY, receivedToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      }

      return { success: true, user: receivedUser };
    } catch (err) {
      console.error(`Login request failed [${API_BASE}]:`, err);
      let errMsg = err.message;
      if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
        errMsg = `Unable to connect to backend at ${API_BASE}. Please verify that the FastAPI backend server is running at ${API_BASE}.`;
      }
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (fullName, email, password, role = 'buyer') => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please check inputs.');
      }

      const receivedToken = data.token;
      const receivedUser = data.user;

      setToken(receivedToken);
      setUser(receivedUser);

      // Default to localStorage for registered users
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

      return { success: true, user: receivedUser };
    } catch (err) {
      console.error(`Register request failed [${API_BASE}]:`, err);
      let errMsg = err.message;
      if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
        errMsg = `Unable to connect to backend at ${API_BASE}. Please verify that the FastAPI backend server is running at ${API_BASE}.`;
      }
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearSession();
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    isOwner: user?.role === 'owner',
    isBuyer: user?.role === 'buyer',
    isInvestigator: user?.role === 'investigator',
    login,
    register,
    logout,
    enterAsPublicGuest,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

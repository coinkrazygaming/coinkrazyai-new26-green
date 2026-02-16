import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerProfile } from '@shared/api';

interface AuthState {
  player: PlayerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>({
    player: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Check if user is already logged in (on mount)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setAuth(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Verify token by fetching profile
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAuth({
              player: data.data,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          }
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const register = async (username: string, name: string, email: string, password: string) => {
    try {
      setAuth(prev => ({ ...prev, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, email, password })
      });

      const data = await response.json();

      if (!data.success) {
        setAuth(prev => ({ ...prev, error: data.error || 'Registration failed' }));
        return false;
      }

      // Store token and update auth state
      localStorage.setItem('auth_token', data.token);
      setAuth({
        player: data.player,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      navigate('/');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setAuth(prev => ({ ...prev, error: message }));
      return false;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setAuth(prev => ({ ...prev, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!data.success) {
        setAuth(prev => ({ ...prev, error: data.error || 'Login failed' }));
        return false;
      }

      // Store token and update auth state
      localStorage.setItem('auth_token', data.token);
      setAuth({
        player: data.player,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      navigate('/');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setAuth(prev => ({ ...prev, error: message }));
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setAuth({
        player: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      navigate('/');
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return {
    ...auth,
    register,
    login,
    logout,
    getAuthHeaders
  };
}

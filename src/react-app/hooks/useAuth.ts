import { useState, useEffect, useCallback } from 'react';
import { useAuth as useMochaAuth } from '@getmocha/users-service/react';

interface LocalUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: LocalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const mochaAuth = useMochaAuth();
  const [localAuth, setLocalAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Helper to safely read response bodies that might not be JSON
  const readResponseSafely = useCallback(async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    const textBody = await response.text();
    let jsonBody: any = null;
    if (contentType.includes('application/json')) {
      try {
        jsonBody = JSON.parse(textBody);
      } catch {
        // fall through to text handling
      }
    } else {
      // Some backends still send JSON without proper header
      try {
        jsonBody = JSON.parse(textBody);
      } catch {
        // keep jsonBody as null
      }
    }
    return { jsonBody, textBody } as const;
  }, []);

  // Check for local authentication on mount
  useEffect(() => {
    const checkLocalAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Verify token is still valid by calling /api/auth/me
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            setLocalAuth({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token is invalid, clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setLocalAuth({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setLocalAuth({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Authentication verification failed',
          });
        }
      } else {
        setLocalAuth({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkLocalAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const { jsonBody, textBody } = await readResponseSafely(response);
      if (!response.ok) {
        const message = (jsonBody && (jsonBody.error || jsonBody.message)) || textBody || 'Login failed';
        throw new Error(message);
      }

      const data = jsonBody || {};

      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setLocalAuth({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLocalAuth(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      const normalized = {
        ...userData,
        email: (userData.email || '').trim().toLowerCase(),
      };
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalized),
      });

      const { jsonBody, textBody } = await readResponseSafely(response);
      if (!response.ok) {
        const message = (jsonBody && (jsonBody.error || jsonBody.message)) || textBody || 'Registration failed';
        throw new Error(message);
      }

      const data = jsonBody || {};

      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setLocalAuth({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setLocalAuth(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Call logout endpoint to invalidate token
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setLocalAuth({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const { jsonBody, textBody } = await readResponseSafely(response);
      if (!response.ok) {
        const message = (jsonBody && (jsonBody.error || jsonBody.message)) || textBody || 'Profile update failed';
        throw new Error(message);
      }

      const data = jsonBody || {};

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(data.user));
      setLocalAuth(prev => ({ ...prev, user: data.user }));

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setLocalAuth(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Determine which authentication method is active
  const isGoogleAuth = mochaAuth.user && !localAuth.isAuthenticated;
  const isLocalAuth = localAuth.isAuthenticated && !mochaAuth.user;
  const isAuthenticated = isGoogleAuth || isLocalAuth;
  const user = isGoogleAuth ? mochaAuth.user : localAuth.user;
  const isLoading = mochaAuth.isPending || localAuth.isLoading;

  return {
    // Combined state
    user,
    isAuthenticated,
    isLoading,
    error: localAuth.error || mochaAuth.error,
    
    // Local auth methods
    login,
    register,
    logout,
    updateProfile,
    
    // Google auth methods (pass through)
    redirectToLogin: mochaAuth.redirectToLogin,
    
    // Auth type detection
    isGoogleAuth,
    isLocalAuth,
  };
}

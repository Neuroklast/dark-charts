import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserProfile } from '@/types';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (provider: 'spotify' | 'apple' | 'mock') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = async () => {
    try {
      const token = await window.spark.kv.get('auth-token');
      if (!token) {
        setUser(null);
        return;
      }

      // Fetch user data from backend
      // Replace with actual API call
      // const response = await fetch('/api/auth/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const userData = await response.json();

      const storedUser = await window.spark.kv.get<AuthUser>('auth-user');
      setUser(storedUser || null);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh user');
      logger.error('Failed to refresh user', { error });
      setUser(null);
      setError(error);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (provider: 'spotify' | 'apple' | 'mock') => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real implementation this would redirect to an OAuth flow
      // or call an API that handles the authentication and returns a token

      // For Spark Bypass we call a specific route if in spark mode
      let endpoint = '/api/auth/login';

      const isSpark = import.meta.env.VITE_IS_SPARK === 'true' || window.location.hostname.includes('spark');
      if (isSpark && provider === 'spotify') {
        endpoint = '/api/auth/spark-bypass';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (data.token) {
        await window.spark.kv.set('auth-token', data.token);
      }

      if (data.user) {
        await window.spark.kv.set('auth-user', data.user);
        setUser(data.user);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      logger.error('Login failed', { error });
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.spark.kv.delete('auth-token');
      await window.spark.kv.delete('auth-user');
      setUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      logger.error('Logout failed', { error });
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      // Replace with actual API call to update profile
      // const response = await fetch('/api/user/profile', { ... })

      const updatedProfile = { ...user.profile, ...updates } as UserProfile;
      const updatedUser = { ...user, profile: updatedProfile };

      await window.spark.kv.set('auth-user', updatedUser);
      setUser(updatedUser);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile update failed');
      logger.error('Profile update failed', { error });
      setError(error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    return window.spark.kv.get<string>('auth-token');
  };

  const getToken = getAuthToken;

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateProfile, refreshUser, getAuthToken, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

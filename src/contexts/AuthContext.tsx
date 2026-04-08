import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserProfile } from '@/types';
import { logger } from '@/lib/logger';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (provider: 'spotify' | 'apple' | 'email', credentials?: LoginCredentials) => Promise<void>;
  loginDemo: (role: 'FAN' | 'DJ' | 'BAND' | 'LABEL') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map a raw server user response to the AuthUser shape the UI expects. */
function buildAuthUser(data: any, provider: AuthUser['provider'] = 'email'): AuthUser {
  return {
    id: data.user?.id ?? data.id,
    email: data.user?.email ?? data.email,
    provider,
    isAuthenticated: true,
    isDemo: data.user?.isDemo ?? data.isDemo ?? false,
    role: data.user?.role ?? data.role,
    profile: data.user?.fanProfile
      ? {
          userType: 'fan',
          id: data.user.fanProfile.id,
          username: data.user.fanProfile.nickname,
          biography: '',
          externalLinks: [],
          displayedBadges: [],
          allBadges: [],
          isPublicProfile: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          votingCredits: data.user.fanProfile.remainingCredits ?? 150,
          votingHistory: [],
          favoritesList: [],
          personalCharts: [],
        } as any
      : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = async () => {
    try {
      const token = await window.spark.kv.get<string>('auth-token');
      if (!token) {
        setUser(null);
        return;
      }

      // Validate the token server-side and fetch fresh user data
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Token is invalid or expired – clear stored credentials
        await window.spark.kv.delete('auth-token');
        await window.spark.kv.delete('auth-user');
        setUser(null);
        return;
      }

      const data = await response.json();
      const authUser = buildAuthUser(data);
      await window.spark.kv.set('auth-user', authUser);
      setUser(authUser);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh user');
      logger.error('Failed to refresh user', { error });
      setError(error);
      // Do not clear user on network errors – keep last known state
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (
    provider: 'spotify' | 'apple' | 'email',
    credentials?: LoginCredentials
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (provider === 'email') {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Authentication failed');
        }

        const data = await response.json();
        if (data.token) {
          await window.spark.kv.set('auth-token', data.token);
        }
        const authUser = buildAuthUser(data);
        await window.spark.kv.set('auth-user', authUser);
        setUser(authUser);
        return;
      }

      // OAuth providers (Spotify / Apple) – redirect handled externally
      if (provider === 'spotify' || provider === 'apple') {
        throw new Error(`OAuth for ${provider} is initiated via the OAuth buttons`);
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

  const loginDemo = async (role: 'FAN' | 'DJ' | 'BAND' | 'LABEL') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Demo login failed');
      }

      const data = await response.json();
      if (data.token) {
        await window.spark.kv.set('auth-token', data.token);
      }
      const authUser = buildAuthUser(data, 'demo');
      await window.spark.kv.set('auth-user', authUser);
      setUser(authUser);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Demo login failed');
      logger.error('Demo login failed', { error });
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
    <AuthContext.Provider
      value={{ user, isLoading, error, login, loginDemo, logout, updateProfile, refreshUser, getAuthToken, getToken }}
    >
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


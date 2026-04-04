import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserProfile } from '@/types';
import { MockAuthService } from '@/services/mockAuthService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (provider: 'spotify' | 'apple' | 'mock') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let authService: MockAuthService | null = null;

try {
  authService = new MockAuthService();
} catch (error) {
  console.error('Failed to initialize AuthService:', error);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = async () => {
    if (!authService) {
      setError(new Error('AuthService not initialized'));
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh user');
      console.error('Failed to refresh user:', error);
      setUser(null);
      setError(error);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (provider: 'spotify' | 'apple' | 'mock') => {
    if (!authService) {
      throw new Error('AuthService not initialized');
    }

    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.login(provider);
      setUser(newUser);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      console.error('Login failed:', error);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authService) {
      throw new Error('AuthService not initialized');
    }

    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      console.error('Logout failed:', error);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authService) {
      throw new Error('AuthService not initialized');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid profile updates');
    }

    try {
      const updatedProfile = await authService.updateProfile(updates);
      if (user) {
        setUser({
          ...user,
          profile: updatedProfile
        });
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile update failed');
      console.error('Profile update failed:', error);
      setError(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateProfile, refreshUser }}>
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

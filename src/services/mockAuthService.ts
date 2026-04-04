import { IAuthService, AuthUser, UserProfile, FanProfile } from '@/types';
import { useKV } from '@github/spark/hooks';

export class MockAuthService implements IAuthService {
  private currentUser: AuthUser | null = null;

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.currentUser) {
      const stored = localStorage.getItem('dark-charts-auth');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  async login(provider: 'spotify' | 'apple' | 'mock'): Promise<AuthUser> {
    const userId = this.generateUserId();
    
    const defaultProfile: FanProfile = {
      id: userId,
      userType: 'fan',
      username: `user_${userId.slice(0, 8)}`,
      biography: '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      votingCredits: 150,
      votingHistory: [],
      favoritesList: [],
      personalCharts: [],
      curatedCharts: [],
      followingIds: [],
      followerIds: []
    };

    this.currentUser = {
      id: userId,
      email: provider === 'mock' ? `user_${userId.slice(0, 8)}@darkcharts.local` : undefined,
      provider,
      isAuthenticated: true,
      profile: defaultProfile
    };

    localStorage.setItem('dark-charts-auth', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('dark-charts-auth');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser?.profile) {
      throw new Error('No authenticated user');
    }

    this.currentUser.profile = {
      ...this.currentUser.profile,
      ...updates,
      updatedAt: Date.now()
    } as UserProfile;

    localStorage.setItem('dark-charts-auth', JSON.stringify(this.currentUser));
    return this.currentUser.profile;
  }

  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

import { IAuthService } from '@/types';

export class MockAuthService implements IAuthService {
  private sessionId: string | null = null;

  async getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null> {
    if (!this.sessionId) {
      return null;
    }
    
    return {
      id: this.sessionId,
      isAnonymous: true
    };
  }

  async ensureSession(): Promise<void> {
    if (!this.sessionId) {
      this.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

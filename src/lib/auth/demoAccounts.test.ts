import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  DEMO_ACCOUNTS,
  DEMO_AUTH_COOKIE,
  DEMO_ROLES,
  isDemoLoginAllowed,
  isDemoRole,
  payloadGrantsDemoAdmin,
  verifyHs256Jwt,
} from './demoAccounts';

describe('demo accounts', () => {
  it('includes an ADMIN preview account', () => {
    expect(DEMO_ROLES).toContain('ADMIN');
    expect(DEMO_ACCOUNTS.some((account) => account.role === 'ADMIN')).toBe(true);
    expect(DEMO_ACCOUNTS.find((account) => account.role === 'ADMIN')?.email).toBe(
      'demo-admin@darkcharts.demo'
    );
  });

  it('accepts ADMIN as a demo role', () => {
    expect(isDemoRole('ADMIN')).toBe(true);
    expect(isDemoRole('FAN')).toBe(true);
    expect(isDemoRole('editor')).toBe(false);
  });
});

describe('isDemoLoginAllowed', () => {
  it('is disabled in development too', () => {
    expect(isDemoLoginAllowed({ NODE_ENV: 'development' })).toBe(false);
  });

  it('cannot be enabled in production via environment', () => {
    expect(isDemoLoginAllowed({ NODE_ENV: 'production' })).toBe(false);
    expect(isDemoLoginAllowed({ NODE_ENV: 'production', ALLOW_DEMO_LOGIN: '1' })).toBe(false);
  });
});

describe('demo admin cookie access', () => {
  it('rejects existing demo ADMIN tokens', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'demo-admin@darkcharts.demo', role: 'ADMIN', isDemo: true },
      'test-secret',
      { expiresIn: '2h' }
    );
    const payload = await verifyHs256Jwt(token, 'test-secret');
    expect(payloadGrantsDemoAdmin(payload)).toBe(false);
  });

  it('rejects a demo FAN token for admin', async () => {
    const token = jwt.sign(
      { userId: 'u2', email: 'demo-fan@darkcharts.demo', role: 'FAN', isDemo: true },
      'test-secret',
      { expiresIn: '2h' }
    );
    const payload = await verifyHs256Jwt(token, 'test-secret');
    expect(payloadGrantsDemoAdmin(payload)).toBe(false);
  });

  it('rejects a tampered token', async () => {
    const token = jwt.sign({ role: 'ADMIN', isDemo: true }, 'test-secret', { expiresIn: '2h' });
    const payload = await verifyHs256Jwt(`${token}x`, 'test-secret');
    expect(payload).toBeNull();
  });

  it('uses a dedicated cookie name', () => {
    expect(DEMO_AUTH_COOKIE).toBe('dc-demo-token');
  });
});

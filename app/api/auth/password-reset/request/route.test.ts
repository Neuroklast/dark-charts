import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { generateLink, sendEmail } = vi.hoisted(() => ({
  generateLink: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleSupabaseClient: () => ({ auth: { admin: { generateLink } } }),
}));
vi.mock('@/lib/email', () => ({ sendEmail }));
vi.mock('@/lib/api-middleware', () => ({ applyRateLimit: () => null }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { POST } from './route';

const request = (email: string, origin = 'https://www.darkcharts.de') =>
  new NextRequest('https://www.darkcharts.de/api/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email }),
  });

describe('password recovery request', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test_mock_key');
    vi.stubEnv('EMAIL_FROM', 'Dark Charts <noreply@darkcharts.de>');
    generateLink.mockReset();
    sendEmail.mockReset();
    sendEmail.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('delivers a one-time link without returning the token to the client', async () => {
    generateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'test-hashed-token' } }, error: null,
    });
    const res = await POST(request('fan@example.com'));
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('test-hashed-token');
    expect(generateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'fan@example.com' });
    expect(sendEmail).toHaveBeenCalledOnce();
    const mail = sendEmail.mock.calls[0][0];
    expect(mail.to).toBe('fan@example.com');
    expect(mail.html).toContain('/auth/confirm?token_hash=test-hashed-token');
  });

  it('does not reveal whether an account exists', async () => {
    generateLink.mockResolvedValue({ data: null, error: { code: 'user_not_found' } });
    const res = await POST(request('unknown@example.com'));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('fails closed when the email provider is unavailable', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request('fan@example.com'));
    expect(res.status).toBe(503);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it('blocks cross-origin requests and malformed email addresses', async () => {
    expect((await POST(request('fan@example.com', 'https://evil.example'))).status).toBe(403);
    expect((await POST(request('invalid-address'))).status).toBe(400);
    expect(generateLink).not.toHaveBeenCalled();
  });
});

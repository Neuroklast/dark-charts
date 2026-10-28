import { describe, expect, it } from 'vitest';
import { isPublicAddress, isPublicStreamUrl } from './publicEndpoint';

describe('radio endpoint safety', () => {
  it('rejects local, metadata and private URLs', () => {
    for (const url of [
      'http://127.0.0.1:8000', 'http://localhost/stream',
      'http://169.254.169.254/latest/meta-data', 'http://10.1.1.1',
      'https://192.168.1.1:8080', 'file:///etc/passwd',
      'http://radio.local/stream', 'https://user:pass@radio.example.org/stream',
    ]) expect(isPublicStreamUrl(url)).toBe(false);
  });
  it('allows public radio HTTPS and IPs', () => {
    expect(isPublicStreamUrl('https://public.radio.co/stations/s123/status')).toBe(true);
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('::1')).toBe(false);
    expect(isPublicAddress('172.19.0.1')).toBe(false);
  });
});

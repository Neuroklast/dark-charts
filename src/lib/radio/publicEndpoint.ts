import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** Reject local, private and non-web targets before the worker contacts a stream. */
export function isPublicAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(ip) === 4) {
    const p = ip.split('.').map(Number);
    if (p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224) return false;
    if (p[0] === 169 && p[1] === 254) return false;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false;
    if (p[0] === 192 && (p[1] === 168 || p[1] === 0 || p[1] === 88)) return false;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return false;
    if (p[0] === 198 && (p[1] === 18 || p[1] === 19 || p[1] === 51 && p[2] === 100)) return false;
    if (p[0] === 192 && p[1] === 0 && p[2] === 2) return false;
    if (p[0] === 203 && p[1] === 0 && p[2] === 113) return false;
    return true;
  }
  if (isIP(ip) === 6) {
    if (ip.startsWith('::ffff:')) return isPublicAddress(ip.slice(7));
    return !(/^(::|::1|fc|fd|fe[89ab]|2001:db8)/.test(ip));
  }
  return false;
}

export function isPublicStreamUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') ||
        host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') ||
        host.endsWith('.invalid') || host.endsWith('.example') ||
        host.endsWith('.home.arpa')) return false;
    return isIP(host) === 0 || isPublicAddress(host);
  } catch {
    return false;
  }
}

export async function assertPublicEndpoint(url: string): Promise<void> {
  if (!isPublicStreamUrl(url)) throw new Error('Private or invalid radio endpoint');
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname)) return;
  const resolved = await lookup(hostname, { all: true });
  if (!resolved.length || resolved.some((entry) => !isPublicAddress(entry.address))) {
    throw new Error('Radio endpoint resolves to a non-public address');
  }
}

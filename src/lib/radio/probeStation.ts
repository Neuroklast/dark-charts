import type { AirplayDetectionMethod, RadioMetadataMode, RadioStationHealthStatus } from './constants';
import { extractIcyStreamTitle } from './icyParser';

export interface ProbeStationInput {
  streamUrl: string | null;
  nowPlayingUrl: string | null;
  metadataMode: RadioMetadataMode | string;
}

export type ProbeSuccess = {
  ok: true;
  streamTitle: string;
  method: AirplayDetectionMethod;
  streamHost: string;
};

export type ProbeFailure = {
  ok: false;
  health: RadioStationHealthStatus;
  error: string;
};

export type ProbeResult = ProbeSuccess | ProbeFailure;

export interface ProbeOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_ICY_META_INTERVAL = 1024 * 1024;

export async function probeStation(
  input: ProbeStationInput,
  options: ProbeOptions
): Promise<ProbeResult> {
  const streamUrl = input.streamUrl?.trim() || null;
  const nowPlayingUrl = input.nowPlayingUrl?.trim() || null;
  if (!streamUrl && !nowPlayingUrl) {
    return { ok: false, health: 'dead', error: 'Missing stream URL' };
  }

  const host = hostOf(streamUrl ?? nowPlayingUrl ?? '');
  const mode = input.metadataMode;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const attempts: Array<() => Promise<ProbeResult | null>> = [];

  if (mode === 'nowplaying_url' || (mode === 'auto' && nowPlayingUrl)) {
    attempts.push(() => tryNowPlaying(nowPlayingUrl, host, options.userAgent, fetchImpl, timeoutMs));
  }
  if (mode === 'shoutcast_stats' || mode === 'auto') {
    attempts.push(() => tryShoutcastStats(streamUrl, host, options.userAgent, fetchImpl, timeoutMs));
  }
  if (mode === 'icecast_json' || mode === 'auto') {
    attempts.push(() => tryIcecastJson(streamUrl, host, options.userAgent, fetchImpl, timeoutMs));
  }
  if (mode === 'icy' || mode === 'auto') {
    attempts.push(() => tryIcy(streamUrl, host, options.userAgent, fetchImpl, timeoutMs));
  }

  let lastFailure: ProbeFailure | null = null;
  for (const attempt of attempts) {
    let result: ProbeResult | null;
    try {
      result = await attempt();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Metadata request failed';
      lastFailure = { ok: false, health: 'no_metadata', error: message.slice(0, 200) };
      continue;
    }
    if (!result) continue;
    if (result.ok) return result;
    lastFailure = result;
    if (result.health === 'blocked' || result.health === 'geo_blocked') return result;
  }

  return lastFailure ?? { ok: false, health: 'no_metadata', error: 'No now-playing metadata' };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function timedFetch(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

function statusFailure(status: number): ProbeFailure {
  if (status === 403 || status === 401) {
    return { ok: false, health: 'blocked', error: `HTTP ${status}` };
  }
  if (status === 404 || status === 410) {
    return { ok: false, health: 'dead', error: `HTTP ${status}` };
  }
  if (status === 451) {
    return { ok: false, health: 'geo_blocked', error: `HTTP ${status}` };
  }
  return { ok: false, health: 'dead', error: `HTTP ${status}` };
}

async function tryNowPlaying(
  url: string | null,
  host: string,
  userAgent: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<ProbeResult | null> {
  if (!url) return null;
  const res = await timedFetch(fetchImpl, url, { headers: { 'User-Agent': userAgent } }, timeoutMs);
  if (!res.ok) return statusFailure(res.status);
  const data: unknown = await res.json();
  const title = titleFromUnknownJson(data);
  if (!title) return { ok: false, health: 'no_metadata', error: 'nowPlaying JSON missing title' };
  return { ok: true, streamTitle: title, method: 'nowplaying_url', streamHost: host };
}

async function tryShoutcastStats(
  streamUrl: string | null,
  host: string,
  userAgent: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<ProbeResult | null> {
  if (!streamUrl) return null;
  const origin = originOf(streamUrl);
  if (!origin) return null;
  const url = `${origin}/7.html`;
  const res = await timedFetch(
    fetchImpl,
    url,
    { headers: { 'User-Agent': userAgent, Accept: 'text/html' } },
    timeoutMs
  );
  if (res.status === 404) return null;
  if (!res.ok) return statusFailure(res.status);
  const html = await res.text();
  const title = parseShoutcast7(html);
  if (!title) return null;
  return { ok: true, streamTitle: title, method: 'shoutcast_stats', streamHost: host };
}

async function tryIcecastJson(
  streamUrl: string | null,
  host: string,
  userAgent: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<ProbeResult | null> {
  if (!streamUrl) return null;
  const origin = originOf(streamUrl);
  if (!origin) return null;
  const url = `${origin}/status-json.xsl`;
  const res = await timedFetch(
    fetchImpl,
    url,
    { headers: { 'User-Agent': userAgent, Accept: 'application/json' } },
    timeoutMs
  );
  if (res.status === 404) return null;
  if (!res.ok) return statusFailure(res.status);
  const data: unknown = await res.json();
  const title = titleFromIcecast(data);
  if (!title) return null;
  return { ok: true, streamTitle: title, method: 'icecast_json', streamHost: host };
}

async function tryIcy(
  streamUrl: string | null,
  host: string,
  userAgent: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<ProbeResult | null> {
  if (!streamUrl) return null;
  // ICY responses may never end. Never call arrayBuffer() on an audio stream.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const res = await fetchImpl(streamUrl, {
      headers: {
        'User-Agent': userAgent,
        'Icy-MetaData': '1',
        Connection: 'close',
      },
      signal: controller.signal,
      redirect: 'manual',
      cache: 'no-store',
    });
    if (!res.ok) return statusFailure(res.status);
    const metaint = Number.parseInt(res.headers.get('icy-metaint') ?? '', 10);
    if (!Number.isFinite(metaint) || metaint <= 0 || metaint > MAX_ICY_META_INTERVAL) {
      return { ok: false, health: 'no_metadata', error: 'Missing or invalid icy-metaint' };
    }
    if (!res.body) return { ok: false, health: 'no_metadata', error: 'Empty audio stream' };
    reader = res.body.getReader();
    let bytes = new Uint8Array(0);
    let needed = metaint + 1;
    // Read only the first metadata block: at most metaint + 1 + 255*16 bytes.
    while (bytes.length < needed) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;
      const next = new Uint8Array(Math.min(metaint + 1 + 255 * 16, bytes.length + value.length));
      next.set(bytes);
      next.set(value.subarray(0, next.length - bytes.length), bytes.length);
      bytes = next;
      if (bytes.length === metaint + 1) needed = metaint + 1 + bytes[metaint] * 16;
    }
    const title = extractIcyStreamTitle(bytes, metaint);
    if (!title) return { ok: false, health: 'no_metadata', error: 'Empty ICY StreamTitle' };
    return { ok: true, streamTitle: title, method: 'icy', streamHost: host };
  } finally {
    clearTimeout(timer);
    if (reader) void reader.cancel().catch(() => undefined);
    controller.abort();
  }
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function parseShoutcast7(html: string): string | null {
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
  const parts = body.split(',');
  if (parts.length < 7) return null;
  const title = parts.slice(6).join(',').trim();
  return title || null;
}

function titleFromUnknownJson(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  // AzuraCast: now_playing.song.artist/title, radio.co: current_track.
  const nested = [record.now_playing, record.current_track, record.track, record.song];
  for (const item of nested) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const object = item as Record<string, unknown>;
    const song = object.song && typeof object.song === 'object' && !Array.isArray(object.song)
      ? object.song as Record<string, unknown> : object;
    const artist = typeof song.artist === 'string' ? song.artist.trim() : '';
    const title = typeof song.title === 'string' ? song.title.trim() : '';
    if (artist && title) return `${artist} - ${title}`;
    if (title) return title;
  }
  const artist = typeof record.artist === 'string' ? record.artist.trim() : '';
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  if (artist && title) return `${artist} - ${title}`;
  if (typeof record.song === 'string' && record.song.trim()) return record.song.trim();
  return title || null;
}

function titleFromIcecast(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const stats = (data as Record<string, unknown>).icestats;
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const source = (stats as Record<string, unknown>).source;
  const sources = Array.isArray(source) ? source : [source];
  for (const item of sources) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const title = (item as Record<string, unknown>).title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }
  return null;
}

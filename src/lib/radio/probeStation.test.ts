import { describe, expect, it, vi } from 'vitest';
import { probeStation } from './probeStation';

const station = {
  streamUrl: 'http://radio.example:8000/stream',
  nowPlayingUrl: null as string | null,
  metadataMode: 'auto' as const,
};

describe('probeStation', () => {
  it('treats HTTP 403 as blocked', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 }));
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({
      ok: false,
      health: 'blocked',
      error: 'HTTP 403',
    });
  });

  it('treats HTTP 404 as dead', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.health).toBe('dead');
  });

  it('reads a SHOUTcast 7.html song title', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/7.html')) {
        return new Response('<HTML><body>1,1,1,50,1,128,NEUROKLAST - GODSLAYER</body></HTML>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return new Response('', { status: 404 });
    });
    const result = await probeStation(station, {
      userAgent: 'test-agent',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'NEUROKLAST - GODSLAYER',
      method: 'shoutcast_stats',
      streamHost: 'radio.example',
    });
  });

  it('reads Icecast status-json title', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('status-json.xsl')) {
        return new Response(
          JSON.stringify({
            icestats: { source: { title: 'Artist - Song' } },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('', { status: 404 });
    });
    const result = await probeStation(
      { ...station, metadataMode: 'icecast_json' },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'Artist - Song',
      method: 'icecast_json',
    });
  });

  it('reads nowPlayingUrl JSON artist and title', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ artist: 'NEUROKLAST', title: 'GODSLAYER' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    const result = await probeStation(
      {
        streamUrl: 'http://radio.example:8000/stream',
        nowPlayingUrl: 'http://radio.example/now.json',
        metadataMode: 'nowplaying_url',
      },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({
      ok: true,
      streamTitle: 'NEUROKLAST - GODSLAYER',
      method: 'nowplaying_url',
    });
  });

  it('fails when no stream URL is configured', async () => {
    const result = await probeStation(
      { streamUrl: null, nowPlayingUrl: null, metadataMode: 'auto' },
      { userAgent: 'test-agent', fetchImpl: vi.fn() as unknown as typeof fetch }
    );
    expect(result).toEqual({ ok: false, health: 'dead', error: 'Missing stream URL' });
  });
  it('reads a bounded ICY metadata frame without waiting for a stream to end', async () => {
    const label = "StreamTitle='NEUROKLAST - GODSLAYER';";
    const paddedLength = Math.ceil(label.length / 16) * 16;
    const bytes = new Uint8Array(16 + 1 + paddedLength);
    bytes[16] = paddedLength / 16;
    new TextEncoder().encodeInto(label, bytes.subarray(17));
    const fetchImpl = vi.fn(async () => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 20));
        controller.enqueue(bytes.subarray(20));
        controller.close();
      },
    }), { headers: { 'icy-metaint': '16' } }));
    const result = await probeStation(
      { ...station, metadataMode: 'icy' },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({ ok: true, streamTitle: 'NEUROKLAST - GODSLAYER', method: 'icy' });
  });

  it('parses an AzuraCast nested now-playing response', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      now_playing: { song: { artist: 'NEUROKLAST', title: 'HELLFIRE' } },
    })));
    const result = await probeStation(
      { ...station, nowPlayingUrl: 'https://radio.example/azuracast', metadataMode: 'nowplaying_url' },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({ ok: true, streamTitle: 'NEUROKLAST - HELLFIRE' });
  });

  it('parses a Radio.co current track object', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      current_track: { artist: 'NEUROKLAST', title: 'MAYHEM' },
    })));
    const result = await probeStation(
      { ...station, nowPlayingUrl: 'https://public.radio.co/api/v2/s000/track/current', metadataMode: 'nowplaying_url' },
      { userAgent: 'test-agent', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    expect(result).toMatchObject({ ok: true, streamTitle: 'NEUROKLAST - MAYHEM' });
  });

});

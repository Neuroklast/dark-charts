/**
 * Normalizes YouTube channel engagement to a 0–100 score for streaming charts.
 * Uses YouTube Data API v3 when YOUTUBE_API_KEY is set; otherwise returns 0.
 */

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

function extractChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9._-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function normalizeSubscriberScore(subscriberCount: number): number {
  if (subscriberCount <= 0) return 0;
  return Math.min(100, Math.round(Math.log10(subscriberCount + 1) * 20));
}

export async function fetchYoutubePopularity(youtubeUrl?: string | null): Promise<number> {
  if (!youtubeUrl) return 0;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return 0;

  const channelRef = extractChannelId(youtubeUrl);
  if (!channelRef) return 0;

  const param = channelRef.startsWith('UC')
    ? `id=${encodeURIComponent(channelRef)}`
    : `forHandle=${encodeURIComponent(channelRef)}`;

  const response = await fetch(`${YOUTUBE_API}/channels?part=statistics&${param}&key=${apiKey}`);
  if (!response.ok) return 0;

  const data = await response.json();
  const stats = data?.items?.[0]?.statistics;
  if (!stats) return 0;

  const subscribers = parseInt(stats.subscriberCount ?? '0', 10);
  return normalizeSubscriberScore(subscribers);
}

export function blendStreamingPopularity(
  spotifyPopularity: number,
  youtubePopularity: number
): number {
  if (youtubePopularity <= 0) return spotifyPopularity;
  if (spotifyPopularity <= 0) return youtubePopularity;
  return Math.round(spotifyPopularity * 0.85 + youtubePopularity * 0.15);
}
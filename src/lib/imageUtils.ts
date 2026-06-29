const WSRV_BASE = 'https://wsrv.nl/'

function buildWsrvUrl(params: Record<string, string | number>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  return `${WSRV_BASE}?${search.toString()}`
}

export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 85
): string {
  if (!url) {
    return ''
  }

  return buildWsrvUrl({
    url,
    w: width,
    q: quality,
    output: 'webp',
  })
}

export function getSquareThumbnail(
  url: string | null | undefined,
  size: number,
  quality = 85
): string {
  if (!url) {
    return ''
  }

  return buildWsrvUrl({
    url,
    w: size,
    h: size,
    fit: 'cover',
    q: quality,
    output: 'webp',
  })
}
import { createHash } from 'crypto'
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { isR2Configured, getServerEnv, serverEnv } from './env.server'

let cachedClient: S3Client | null | undefined

export function createR2Client(): S3Client | null {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  if (!isR2Configured()) {
    cachedClient = null
    return null
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID!,
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY!,
    },
  })

  return cachedClient
}

export function buildR2PublicUrl(key: string): string {
  const base = serverEnv.R2_PUBLIC_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('R2_PUBLIC_URL is not configured')
  }
  return `${base}/${key.replace(/^\//, '')}`
}

export async function objectExistsInR2(key: string): Promise<boolean> {
  const client = createR2Client()
  if (!client || !serverEnv.R2_BUCKET_NAME) {
    return false
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: serverEnv.R2_BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

export async function uploadUrlToR2(
  sourceUrl: string,
  key: string,
  contentType?: string
): Promise<string> {
  const client = createR2Client()
  if (!client || !serverEnv.R2_BUCKET_NAME) {
    throw new Error('R2 is not configured')
  }

  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to download image from ${sourceUrl}: ${response.status} ${response.statusText}`
    )
  }

  const body = Buffer.from(await response.arrayBuffer())
  const resolvedContentType =
    contentType ?? response.headers.get('content-type') ?? 'application/octet-stream'

  await client.send(
    new PutObjectCommand({
      Bucket: serverEnv.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: resolvedContentType,
    })
  )

  return buildR2PublicUrl(key)
}

export function createSyncUploadFn(prefix: string) {
  return async (sourceUrl: string, filename: string): Promise<string | null> => {
    const key = `${prefix.replace(/\/$/, '')}/${filename}`

    try {
      if (await objectExistsInR2(key)) {
        return buildR2PublicUrl(key)
      }
      return await uploadUrlToR2(sourceUrl, key)
    } catch (error) {
      console.error('R2 upload failed, falling back to external URL:', error)
      return null
    }
  }
}

/**
 * Content-addressed upload: cover-art/{sha256}.{ext}
 * Skips re-upload when the hash already exists in R2.
 */
export async function uploadImageUrlToR2Cached(
  imageUrl: string,
  keyPrefix = 'cover-art',
  fetchFn: typeof fetch = globalThis.fetch
): Promise<string> {
  const client = createR2Client()
  const env = getServerEnv()
  if (!client || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) {
    throw new Error('R2 is not configured')
  }

  const resp = await fetchFn(imageUrl)
  if (!resp.ok) {
    throw new Error(`Failed to download image (${resp.status}): ${imageUrl}`)
  }

  const contentType = resp.headers.get('content-type') ?? 'image/jpeg'
  const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
  const buffer = Buffer.from(await resp.arrayBuffer())
  const hash = createHash('sha256').update(buffer).digest('hex')
  const key = `${keyPrefix.replace(/\/$/, '')}/${hash}.${ext}`

  if (await objectExistsInR2(key)) {
    return buildR2PublicUrl(key)
  }

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  return buildR2PublicUrl(key)
}

export function createHashUploadFn(keyPrefix = 'cover-art') {
  return (imageUrl: string) => uploadImageUrlToR2Cached(imageUrl, keyPrefix)
}
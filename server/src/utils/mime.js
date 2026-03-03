import { AppError } from './errors.js'

export const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

export const ensureImageMimeType = (mimeType) => {
  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    throw new AppError('Unsupported image type. Use PNG, JPEG, or WEBP.', 400)
  }
}

export const inferExtensionFromMime = (mimeType) => {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

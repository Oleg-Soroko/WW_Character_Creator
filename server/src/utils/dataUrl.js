import { AppError } from './errors.js'

export const imageBufferToDataUrl = (buffer, mimeType = 'image/png') =>
  `data:${mimeType};base64,${buffer.toString('base64')}`

export const parseImageDataUrl = (value) => {
  if (!value || typeof value !== 'string') {
    throw new AppError('Image data URL is required.', 400)
  }

  const match = value.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)

  if (!match) {
    throw new AppError('Invalid image data URL.', 400)
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

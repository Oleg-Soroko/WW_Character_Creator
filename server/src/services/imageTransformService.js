import sharp from 'sharp'

const GEMINI_CANVAS_SIZE = 1024

export const normalizeForGemini = async (buffer) =>
  sharp(buffer)
    .rotate()
    .resize(GEMINI_CANVAS_SIZE, GEMINI_CANVAS_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

export const normalizeReferenceForGemini = async (buffer) =>
  sharp(buffer)
    .rotate()
    .resize(GEMINI_CANVAS_SIZE, GEMINI_CANVAS_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({
      background: {
        r: 242,
        g: 242,
        b: 242,
      },
    })
    .jpeg({
      quality: 82,
      mozjpeg: true,
    })
    .toBuffer()

const parseAspectRatio = (value) => {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/)

  if (!match) {
    return { width: 1, height: 1 }
  }

  const width = Number(match[1])
  const height = Number(match[2])

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1, height: 1 }
  }

  return { width, height }
}

export const normalizePortraitToAspectRatio = async (buffer, aspectRatio = '1:1') => {
  const image = sharp(buffer).rotate()
  const metadata = await image.metadata()
  const sourceWidth = metadata.width || 0
  const sourceHeight = metadata.height || 0
  const { width: ratioWidth, height: ratioHeight } = parseAspectRatio(aspectRatio)

  if (!sourceWidth || !sourceHeight) {
    return image.png().toBuffer()
  }

  const targetRatio = ratioWidth / ratioHeight
  const sourceRatio = sourceWidth / sourceHeight

  const targetWidth =
    sourceRatio > targetRatio ? sourceWidth : Math.round(sourceHeight * targetRatio)
  const targetHeight =
    sourceRatio > targetRatio ? Math.round(sourceWidth / targetRatio) : sourceHeight

  return image
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: {
        r: 242,
        g: 242,
        b: 242,
        alpha: 1,
      },
    })
    .png()
    .toBuffer()
}

export const normalizeGeminiOutputSquare = async (buffer) =>
  sharp(buffer)
    .rotate()
    .resize(GEMINI_CANVAS_SIZE, GEMINI_CANVAS_SIZE, {
      fit: 'contain',
      position: 'center',
      background: {
        r: 242,
        g: 242,
        b: 242,
        alpha: 1,
      },
    })
    .png()
    .toBuffer()

export const normalizeForTripo = async (buffer) =>
  sharp(buffer)
    .rotate()
    .jpeg({ quality: 92 })
    .toBuffer()

export const normalizeForSprite = async (buffer, spriteSize = 64) =>
  sharp(buffer)
    .rotate()
    .resize(spriteSize, spriteSize, {
      fit: 'contain',
      position: 'center',
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .png()
    .toBuffer()

export const mirrorHorizontally = async (buffer) =>
  sharp(buffer)
    .flop()
    .png()
    .toBuffer()

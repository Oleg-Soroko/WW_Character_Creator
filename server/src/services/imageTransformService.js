import sharp from 'sharp'

export const normalizeForGemini = async (buffer) =>
  sharp(buffer)
    .rotate()
    .png()
    .toBuffer()

export const normalizeForTripo = async (buffer) =>
  sharp(buffer)
    .rotate()
    .jpeg({ quality: 92 })
    .toBuffer()

export const mirrorHorizontally = async (buffer) =>
  sharp(buffer)
    .flop()
    .png()
    .toBuffer()

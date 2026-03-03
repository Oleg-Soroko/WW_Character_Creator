import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env')

dotenv.config({
  path: envPath,
  override: true,
  quiet: true,
})

const parseBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback
  }

  return String(value).toLowerCase() === 'true'
}

export const loadEnv = (source = process.env) => {
  const env = {
    port: Number(source.PORT || 5000),
    clientOrigin: source.CLIENT_ORIGIN || 'http://localhost:5173',
    geminiApiKey: source.GEMINI_API_KEY,
    geminiImageModel: source.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview',
    tripoApiKey: source.TRIPO_API_KEY,
    tripoBaseUrl: source.TRIPO_BASE_URL || 'https://api.tripo3d.ai/v2/openapi',
    tripoModelVersion: source.TRIPO_MODEL_VERSION || 'v3.1-20260211',
    tripoTexture: parseBoolean(source.TRIPO_TEXTURE, true),
    tripoPbr: parseBoolean(source.TRIPO_PBR, true),
    tripoTextureQuality: source.TRIPO_TEXTURE_QUALITY || 'standard',
    tripoTextureAlignment: source.TRIPO_TEXTURE_ALIGNMENT || 'original_image',
    tripoOrientation: source.TRIPO_ORIENTATION || 'default',
  }

  const missingKeys = []

  if (!env.geminiApiKey) {
    missingKeys.push('GEMINI_API_KEY')
  }

  if (!env.tripoApiKey) {
    missingKeys.push('TRIPO_API_KEY')
  }

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`)
  }

  return env
}

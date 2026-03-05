import { GoogleGenAI } from '@google/genai'
import { AppError, normalizeExternalError } from '../utils/errors.js'

const GEMINI_REQUEST_TIMEOUT_MS = 120000
const GEMINI_MAX_ATTEMPTS = 3
const GEMINI_RETRY_DELAYS_MS = [1200, 2600]

const withTimeout = (promise, timeoutMs, timeoutMessage) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new AppError(timeoutMessage, 504))
      }, timeoutMs)

      promise.finally(() => clearTimeout(timer)).catch(() => {})
    }),
  ])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeModelCandidates = (primaryModel, fallbackModels = []) => {
  const rawCandidates = [primaryModel, ...(Array.isArray(fallbackModels) ? fallbackModels : [])]
  const normalized = []

  for (const candidate of rawCandidates) {
    const modelName = String(candidate || '').trim()

    if (!modelName || normalized.includes(modelName)) {
      continue
    }

    normalized.push(modelName)
  }

  return normalized
}

const tryParseJson = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const readApiPayload = (error) => {
  if (error?.error && typeof error.error === 'object') {
    return error.error
  }

  const fromMessage = tryParseJson(error?.message)
  if (fromMessage?.error) {
    return fromMessage.error
  }

  const fromString = typeof error === 'string' ? tryParseJson(error) : null
  if (fromString?.error) {
    return fromString.error
  }

  return null
}

const isRetryableGeminiError = (error) => {
  const payload = readApiPayload(error)
  const statusCodeCandidates = [
    error?.status,
    error?.statusCode,
    error?.code,
    payload?.code,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))

  if (statusCodeCandidates.some((value) => [429, 500, 502, 503, 504].includes(value))) {
    return true
  }

  const status = String(payload?.status || '').toUpperCase()
  if (['INTERNAL', 'UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED'].includes(status)) {
    return true
  }

  const message = String(error?.message || error || '').toLowerCase()
  return (
    /internal error encountered|internal server error/.test(message) ||
    /temporarily unavailable|service unavailable|high demand/.test(message) ||
    /rate limit|quota exceeded|resource exhausted/.test(message) ||
    /timed out|timeout|deadline exceeded/.test(message)
  )
}

const collectParts = (response) => {
  if (Array.isArray(response?.parts)) {
    return response.parts
  }

  const candidates = response?.candidates || []
  const parts = []

  for (const candidate of candidates) {
    parts.push(...(candidate?.content?.parts || []))
  }

  return parts
}

const extractInlineImage = (response, modelUsed = '') => {
  const parts = collectParts(response)

  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data
    if (inlineData?.data) {
      return {
        buffer: Buffer.from(inlineData.data, 'base64'),
        mimeType: inlineData.mimeType || inlineData.mime_type || 'image/png',
        modelUsed,
      }
    }
  }

  const textParts = parts
    .map((part) => part?.text?.trim())
    .filter(Boolean)

  if (textParts.length > 0) {
    throw new AppError(
      `Gemini returned text instead of an image. ${textParts[0]}`,
      502,
    )
  }

  throw new AppError('Gemini did not return image data. Try again with a more explicit image prompt.', 502)
}

export const createGeminiClient = ({ apiKey }) => {
  const client = new GoogleGenAI({ apiKey })

  return {
    async generateImageFromParts({ parts, model, timeoutMs, fallbackModels = [] }) {
      let lastError = null
      const modelCandidates = normalizeModelCandidates(model, fallbackModels)
      const effectiveTimeoutMs =
        Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : GEMINI_REQUEST_TIMEOUT_MS

      for (const modelName of modelCandidates) {
        for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
          try {
            const response = await withTimeout(
              client.models.generateContent({
                model: modelName,
                contents: [
                  {
                    role: 'user',
                    parts,
                  },
                ],
                config: {
                  responseModalities: ['IMAGE'],
                },
              }),
              effectiveTimeoutMs,
              `Gemini image generation timed out after ${Math.round(
                effectiveTimeoutMs / 1000,
              )} seconds. Try again or reduce the request complexity.`,
            )

            return extractInlineImage(response, modelName)
          } catch (error) {
            lastError = error

            if (!isRetryableGeminiError(error) || attempt === GEMINI_MAX_ATTEMPTS) {
              break
            }

            const retryDelay = GEMINI_RETRY_DELAYS_MS[attempt - 1] || GEMINI_RETRY_DELAYS_MS.at(-1)
            await sleep(retryDelay)
          }
        }
      }

      throw normalizeExternalError(lastError, 'Gemini image generation failed.')
    },
  }
}

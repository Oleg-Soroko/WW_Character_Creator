import { GoogleGenAI } from '@google/genai'
import { AppError, normalizeExternalError } from '../utils/errors.js'

const GEMINI_REQUEST_TIMEOUT_MS = 120000

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

const extractInlineImage = (response) => {
  const parts = collectParts(response)

  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data
    if (inlineData?.data) {
      return {
        buffer: Buffer.from(inlineData.data, 'base64'),
        mimeType: inlineData.mimeType || inlineData.mime_type || 'image/png',
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
    async generateImageFromParts({ parts, model }) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: parts,
            config: {
              responseModalities: ['IMAGE'],
            },
          }),
          GEMINI_REQUEST_TIMEOUT_MS,
          'Gemini image generation timed out after 120 seconds. Try again or reduce the request complexity.',
        )

        return extractInlineImage(response)
      } catch (error) {
        throw normalizeExternalError(error, 'Gemini image generation failed.')
      }
    },
  }
}

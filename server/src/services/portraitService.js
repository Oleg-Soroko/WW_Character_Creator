import { buildPortraitPrompt } from './promptBuilder.js'
import { imageBufferToDataUrl } from '../utils/dataUrl.js'
import {
  normalizeGeminiOutputSquare,
  normalizeReferenceForGemini,
  normalizePortraitToAspectRatio,
} from './imageTransformService.js'

const imagePart = (buffer, mimeType = 'image/png') => ({
  inlineData: {
    mimeType,
    data: buffer.toString('base64'),
  },
})

export const createPortraitService = ({ geminiClient, geminiModel, geminiFallbackModels = [] }) => ({
  async generatePortrait({
    prompt,
    referenceImageBuffer,
    portraitPromptPreset,
    portraitAspectRatio,
  }) {
    const trimmedPrompt = prompt?.trim() || ''
    const normalizedReference = referenceImageBuffer
      ? await normalizeReferenceForGemini(referenceImageBuffer)
      : null
    const hasReference = Boolean(normalizedReference)

    const promptUsed = buildPortraitPrompt({
      prompt: trimmedPrompt,
      hasReferenceImage: hasReference,
      portraitPromptPreset,
      portraitAspectRatio,
    })

    const parts = []

    if (hasReference) {
      parts.push(imagePart(normalizedReference, 'image/jpeg'))
    }
    parts.push({ text: promptUsed })

    const generated = await geminiClient.generateImageFromParts({
      parts,
      model: geminiModel,
      fallbackModels: geminiFallbackModels,
    })

    const aspectNormalizedPortraitBuffer = await normalizePortraitToAspectRatio(
      generated.buffer,
      portraitAspectRatio || '1:1',
    )
    const normalizedPortraitBuffer = await normalizeGeminiOutputSquare(aspectNormalizedPortraitBuffer)

    return {
      imageBuffer: normalizedPortraitBuffer,
      imageDataUrl: imageBufferToDataUrl(normalizedPortraitBuffer, 'image/png'),
      modelUsed: generated.modelUsed || '',
      promptUsed,
      inputMode:
        prompt?.trim() && referenceImageBuffer
          ? 'prompt+image'
          : prompt?.trim()
            ? 'prompt'
            : 'image',
      normalizedReferenceImageDataUrl: normalizedReference
        ? imageBufferToDataUrl(normalizedReference, 'image/jpeg')
        : null,
    }
  },
})

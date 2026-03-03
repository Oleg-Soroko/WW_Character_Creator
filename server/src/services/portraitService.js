import { buildPortraitPrompt } from './promptBuilder.js'
import { imageBufferToDataUrl } from '../utils/dataUrl.js'
import { normalizeForGemini } from './imageTransformService.js'

const imagePart = (buffer, mimeType = 'image/png') => ({
  inlineData: {
    mimeType,
    data: buffer.toString('base64'),
  },
})

export const createPortraitService = ({ geminiClient, geminiModel }) => ({
  async generatePortrait({ prompt, referenceImageBuffer }) {
    const normalizedReference = referenceImageBuffer
      ? await normalizeForGemini(referenceImageBuffer)
      : null
    const promptUsed = buildPortraitPrompt({
      prompt,
      hasReferenceImage: Boolean(referenceImageBuffer),
    })
    const parts = [{ text: promptUsed }]

    if (normalizedReference) {
      parts.push(imagePart(normalizedReference))
    }

    const generated = await geminiClient.generateImageFromParts({
      parts,
      model: geminiModel,
    })

    return {
      imageBuffer: generated.buffer,
      imageDataUrl: imageBufferToDataUrl(generated.buffer, generated.mimeType),
      promptUsed,
      inputMode:
        prompt?.trim() && referenceImageBuffer
          ? 'prompt+image'
          : prompt?.trim()
            ? 'prompt'
            : 'image',
      normalizedReferenceImageDataUrl: normalizedReference
        ? imageBufferToDataUrl(normalizedReference, 'image/png')
        : null,
    }
  },
})

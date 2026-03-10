import { buildViewPrompt, normalizeMultiviewPrompt } from './promptBuilder.js'
import { imageBufferToDataUrl } from '../utils/dataUrl.js'
import { AppError, isAppError, normalizeErrorMessage } from '../utils/errors.js'
import {
  normalizeForGemini,
  normalizeGeminiOutputSquare,
  mirrorHorizontally,
} from './imageTransformService.js'

const imagePart = (buffer) => ({
  inlineData: {
    mimeType: 'image/png',
    data: buffer.toString('base64'),
  },
})

const FULL_VIEW_ORDER = ['front', 'back', 'left']

const buildPromptMetadata = ({ characterPrompt, multiviewPromptBase }) => ({
  frontPrompt: buildViewPrompt({ view: 'front', characterPrompt, multiviewPrompt: multiviewPromptBase }),
  backPrompt: buildViewPrompt({ view: 'back', characterPrompt, multiviewPrompt: multiviewPromptBase }),
  leftPrompt: buildViewPrompt({ view: 'left', characterPrompt, multiviewPrompt: multiviewPromptBase }),
  rightPrompt: buildViewPrompt({ view: 'right', characterPrompt, multiviewPrompt: multiviewPromptBase }),
  multiviewPromptBase,
})

const wrapViewGenerationError = (view, error) => {
  const viewLabel = `${view.charAt(0).toUpperCase()}${view.slice(1)}`
  const statusCode = isAppError(error) ? error.statusCode : 502
  const details = isAppError(error) ? error.details : undefined
  const reason = normalizeErrorMessage(error, 'Unexpected view generation failure.')

  return new AppError(`${viewLabel} view generation failed. ${reason}`, statusCode, details)
}

export const createMultiviewService = ({
  geminiClient,
  geminiModel,
  geminiFallbackModels = [],
}) => ({
  async generateMultiview({
    portraitBuffer,
    characterPrompt,
    multiviewPrompt,
    mode = 'full',
  }) {
    const normalizedPortrait = await normalizeForGemini(portraitBuffer)
    const multiviewPromptBase = normalizeMultiviewPrompt(multiviewPrompt)
    const promptMetadata = buildPromptMetadata({
      characterPrompt,
      multiviewPromptBase,
    })
    const portraitPart = imagePart(normalizedPortrait)

    const generateView = async (view) => {
      const promptKey = `${view}Prompt`

      try {
        const generated = await geminiClient.generateImageFromParts({
          parts: [{ text: promptMetadata[promptKey] }, portraitPart],
          model: geminiModel,
          fallbackModels: geminiFallbackModels,
        })
        const normalizedBuffer = await normalizeGeminiOutputSquare(generated.buffer)

        return {
          imageBuffer: normalizedBuffer,
          imageDataUrl: imageBufferToDataUrl(normalizedBuffer, 'image/png'),
          source: 'gemini',
          modelUsed: generated.modelUsed || '',
        }
      } catch (error) {
        throw wrapViewGenerationError(view, error)
      }
    }

    if (mode === 'front-only') {
      const front = await generateView('front')

      return {
        mode,
        modelUsage: {
          front: front.modelUsed,
          back: '',
          left: '',
          right: '',
        },
        views: {
          front: {
            imageBuffer: front.imageBuffer,
            imageDataUrl: front.imageDataUrl,
            source: front.source,
          },
          back: {
            imageBuffer: null,
            imageDataUrl: '',
            source: 'front-test',
          },
          left: {
            imageBuffer: null,
            imageDataUrl: '',
            source: 'front-test',
          },
          right: {
            imageBuffer: null,
            imageDataUrl: '',
            source: 'front-test',
          },
        },
        promptMetadata,
      }
    }

    const settledViews = await Promise.allSettled(
      FULL_VIEW_ORDER.map(async (view) => [view, await generateView(view)]),
    )
    const failures = settledViews.filter((result) => result.status === 'rejected')

    if (failures.length > 0) {
      if (failures.length === 1) {
        throw failures[0].reason
      }

      throw new AppError(
        failures.map((result) => result.reason.message).join(' | '),
        failures[0].reason.statusCode || 502,
        failures.map((result) => result.reason.details).filter(Boolean),
      )
    }

    const viewMap = Object.fromEntries(settledViews.map((result) => result.value))
    const rightBuffer = await mirrorHorizontally(viewMap.left.imageBuffer)

    return {
      mode,
      modelUsage: {
        front: viewMap.front.modelUsed,
        back: viewMap.back.modelUsed,
        left: viewMap.left.modelUsed,
        right: viewMap.left.modelUsed ? `${viewMap.left.modelUsed} (mirrored-left)` : '',
      },
      views: {
        front: {
          imageBuffer: viewMap.front.imageBuffer,
          imageDataUrl: viewMap.front.imageDataUrl,
          source: viewMap.front.source,
        },
        back: {
          imageBuffer: viewMap.back.imageBuffer,
          imageDataUrl: viewMap.back.imageDataUrl,
          source: viewMap.back.source,
        },
        left: {
          imageBuffer: viewMap.left.imageBuffer,
          imageDataUrl: viewMap.left.imageDataUrl,
          source: viewMap.left.source,
        },
        right: {
          imageBuffer: rightBuffer,
          imageDataUrl: imageBufferToDataUrl(rightBuffer, 'image/png'),
          source: 'mirrored-left',
        },
      },
      promptMetadata,
    }
  },
})

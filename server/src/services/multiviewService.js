import { buildViewPrompt, normalizeMultiviewPrompt } from './promptBuilder.js'
import { imageBufferToDataUrl } from '../utils/dataUrl.js'
import { normalizeForGemini, mirrorHorizontally } from './imageTransformService.js'

const imagePart = (buffer) => ({
  inlineData: {
    mimeType: 'image/png',
    data: buffer.toString('base64'),
  },
})

export const createMultiviewService = ({ geminiClient, geminiModel }) => ({
  async generateMultiview({
    portraitBuffer,
    characterPrompt,
    multiviewPrompt,
    mode = 'full',
  }) {
    const normalizedPortrait = await normalizeForGemini(portraitBuffer)
    const multiviewPromptBase = normalizeMultiviewPrompt(multiviewPrompt)

    const generateView = async (view) => {
      const parts = [
        { text: buildViewPrompt({ view, characterPrompt, multiviewPrompt: multiviewPromptBase }) },
        imagePart(normalizedPortrait),
      ]

      return geminiClient.generateImageFromParts({
        parts,
        model: geminiModel,
      })
    }

    const front = await generateView('front')

    if (mode === 'front-only') {
      return {
        mode,
        views: {
          front: {
            imageBuffer: front.buffer,
            imageDataUrl: imageBufferToDataUrl(front.buffer, front.mimeType),
            source: 'gemini',
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
        promptMetadata: {
          frontPrompt: buildViewPrompt({ view: 'front', characterPrompt, multiviewPrompt: multiviewPromptBase }),
          backPrompt: buildViewPrompt({ view: 'back', characterPrompt, multiviewPrompt: multiviewPromptBase }),
          leftPrompt: buildViewPrompt({ view: 'left', characterPrompt, multiviewPrompt: multiviewPromptBase }),
          multiviewPromptBase,
        },
      }
    }

    const back = await generateView('back')
    const left = await generateView('left')
    const rightBuffer = await mirrorHorizontally(left.buffer)

    return {
      mode,
      views: {
        front: {
          imageBuffer: front.buffer,
          imageDataUrl: imageBufferToDataUrl(front.buffer, front.mimeType),
          source: 'gemini',
        },
        back: {
          imageBuffer: back.buffer,
          imageDataUrl: imageBufferToDataUrl(back.buffer, back.mimeType),
          source: 'gemini',
        },
        left: {
          imageBuffer: left.buffer,
          imageDataUrl: imageBufferToDataUrl(left.buffer, left.mimeType),
          source: 'gemini',
        },
        right: {
          imageBuffer: rightBuffer,
          imageDataUrl: imageBufferToDataUrl(rightBuffer, 'image/png'),
          source: 'mirrored-left',
        },
      },
      promptMetadata: {
        frontPrompt: buildViewPrompt({ view: 'front', characterPrompt, multiviewPrompt: multiviewPromptBase }),
        backPrompt: buildViewPrompt({ view: 'back', characterPrompt, multiviewPrompt: multiviewPromptBase }),
        leftPrompt: buildViewPrompt({ view: 'left', characterPrompt, multiviewPrompt: multiviewPromptBase }),
        multiviewPromptBase,
      },
    }
  },
})

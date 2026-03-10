import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_MULTIVIEW_PROMPT } from '../services/promptBuilder.js'
import { createMultiviewService } from '../services/multiviewService.js'

const createImageBuffer = (background = { r: 255, g: 255, b: 255, alpha: 1 }) =>
  sharp({
    create: {
      width: 8,
      height: 8,
      channels: 4,
      background,
    },
  })
    .png()
    .toBuffer()

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return {
    promise,
    resolve,
    reject,
  }
}

const detectView = (parts) => {
  const prompt = parts.find((part) => part?.text)?.text || ''

  if (prompt.includes('FRONT VIEW ONLY')) {
    return 'front'
  }

  if (prompt.includes('BACK VIEW ONLY')) {
    return 'back'
  }

  if (prompt.includes('LEFT VIEW ONLY')) {
    return 'left'
  }

  return 'unknown'
}

describe('multiviewService', () => {
  it('starts front, back, and left generation without waiting for prior views to finish', async () => {
    const portraitBuffer = await createImageBuffer()
    const generatedBuffer = await createImageBuffer({ r: 200, g: 200, b: 200, alpha: 1 })
    const deferredByView = {
      front: createDeferred(),
      back: createDeferred(),
      left: createDeferred(),
    }
    const geminiClient = {
      generateImageFromParts: vi.fn(({ parts }) => {
        const view = detectView(parts)
        return deferredByView[view].promise
      }),
    }
    const service = createMultiviewService({
      geminiClient,
      geminiModel: 'gemini-test-model',
    })

    const resultPromise = service.generateMultiview({
      portraitBuffer,
      characterPrompt: 'pilot',
      multiviewPrompt: DEFAULT_MULTIVIEW_PROMPT,
      mode: 'full',
    })

    await vi.waitFor(() => {
      expect(geminiClient.generateImageFromParts).toHaveBeenCalledTimes(3)
    })

    deferredByView.front.resolve({ buffer: generatedBuffer, modelUsed: 'model-front' })
    deferredByView.back.resolve({ buffer: generatedBuffer, modelUsed: 'model-back' })
    deferredByView.left.resolve({ buffer: generatedBuffer, modelUsed: 'model-left' })

    const result = await resultPromise

    expect(result.modelUsage).toEqual({
      front: 'model-front',
      back: 'model-back',
      left: 'model-left',
      right: 'model-left (mirrored-left)',
    })
    expect(result.views.front.source).toBe('gemini')
    expect(result.views.back.source).toBe('gemini')
    expect(result.views.left.source).toBe('gemini')
    expect(result.views.right.source).toBe('mirrored-left')
  })

  it('surfaces the failing view when one parallel generation rejects', async () => {
    const portraitBuffer = await createImageBuffer()
    const generatedBuffer = await createImageBuffer({ r: 200, g: 200, b: 200, alpha: 1 })
    const geminiClient = {
      generateImageFromParts: vi.fn(({ parts }) => {
        const view = detectView(parts)

        if (view === 'back') {
          return Promise.reject(new Error('quota exceeded'))
        }

        return Promise.resolve({ buffer: generatedBuffer, modelUsed: `model-${view}` })
      }),
    }
    const service = createMultiviewService({
      geminiClient,
      geminiModel: 'gemini-test-model',
    })

    await expect(
      service.generateMultiview({
        portraitBuffer,
        characterPrompt: 'pilot',
        multiviewPrompt: DEFAULT_MULTIVIEW_PROMPT,
        mode: 'full',
      }),
    ).rejects.toThrow('Back view generation failed. quota exceeded')
  })
})

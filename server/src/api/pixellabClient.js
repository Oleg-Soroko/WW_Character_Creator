import { AppError, normalizeExternalError } from '../utils/errors.js'
import { parseImageDataUrl } from '../utils/dataUrl.js'

const parseJson = async (response) => {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new AppError(`Unexpected PixelLab response: ${text.slice(0, 200)}`, 502)
  }
}

const toBase64ImagePayload = (imageDataUrl) => {
  const { buffer } = parseImageDataUrl(imageDataUrl)
  return {
    type: 'base64',
    base64: buffer.toString('base64'),
  }
}

const formatDetail = (detail) => {
  if (Array.isArray(detail)) {
    const parts = detail
      .slice(0, 4)
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item?.msg) {
          const location = Array.isArray(item?.loc) ? item.loc.join('.') : ''
          return location ? `${location}: ${item.msg}` : item.msg
        }

        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      .filter(Boolean)

    return parts.join(' | ')
  }

  if (typeof detail === 'object' && detail !== null) {
    if (typeof detail.message === 'string') {
      return detail.message
    }

    try {
      return JSON.stringify(detail)
    } catch {
      return String(detail)
    }
  }

  if (typeof detail === 'string') {
    return detail
  }

  return ''
}

export const createPixellabClient = ({ apiKey, baseUrl }) => {
  const request = async (path, payload, fallbackMessage) => {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await parseJson(response).catch(() => null)
        const formattedDetail = formatDetail(errorPayload?.detail)
        const message =
          formattedDetail ||
          errorPayload?.message ||
          errorPayload?.error?.message ||
          `${response.status} ${response.statusText}`
        throw new AppError(`PixelLab request failed: ${message}`, response.status || 502)
      }

      return parseJson(response)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      throw normalizeExternalError(error, fallbackMessage)
    }
  }

  return {
    async estimateSkeleton(imageDataUrl, options = {}) {
      const payload = await request(
        '/estimate-skeleton',
        {
          image: toBase64ImagePayload(imageDataUrl),
          ...options,
        },
        'PixelLab skeleton estimate failed.',
      )

      if (!Array.isArray(payload?.keypoints) || payload.keypoints.length === 0) {
        throw new AppError('PixelLab skeleton estimate returned no keypoints.', 502)
      }

      return payload
    },

    async animateWithSkeleton(imageDataUrl, skeletonKeyframes, options = {}) {
      const payload = await request(
        '/animate-with-skeleton',
        {
          image_size: {
            width: options.width,
            height: options.height,
          },
          reference_image: toBase64ImagePayload(imageDataUrl),
          skeleton_keypoints: skeletonKeyframes,
          direction: options.direction || 'east',
          view: options.view || 'low top-down',
        },
        'PixelLab skeleton animation failed.',
      )

      if (!Array.isArray(payload?.images) || payload.images.length === 0) {
        throw new AppError('PixelLab animation returned no preview frames.', 502)
      }

      return payload
    },
  }
}

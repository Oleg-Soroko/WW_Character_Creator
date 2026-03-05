export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.details = details
  }
}

export const isAppError = (error) => error instanceof AppError

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

const readRetryDelay = (details = []) => {
  const retryInfo = details.find((detail) => detail?.['@type']?.includes('RetryInfo'))
  const delay = retryInfo?.retryDelay || ''
  const match = String(delay).match(/(\d+)/)

  return match ? Number(match[1]) : null
}

const normalizeApiPayloadMessage = (payload) => {
  const apiError = payload?.error || payload
  const rawMessage = String(apiError?.message || '').trim()

  if (!rawMessage) {
    return null
  }

  if (apiError?.status === 'RESOURCE_EXHAUSTED' || /quota exceeded/i.test(rawMessage)) {
    const retryDelay = readRetryDelay(apiError?.details)

    if (retryDelay) {
      return `Gemini quota exceeded for image generation. Check billing or quota for your Google project, or retry in about ${retryDelay} seconds.`
    }

    return 'Gemini quota exceeded for image generation. Check billing or quota for your Google project.'
  }

  if (apiError?.status === 'INTERNAL' || /internal error encountered|internal server error/i.test(rawMessage)) {
    return 'Gemini internal error encountered. This is usually temporary. Retry generation.'
  }

  return rawMessage
}

export const normalizeErrorMessage = (error, fallbackMessage = 'Unexpected server error.') => {
  if (!error) {
    return fallbackMessage
  }

  const parsedFromMessage = tryParseJson(error?.message)
  const parsedDirect = typeof error === 'string' ? tryParseJson(error) : null
  const parsedPayload = parsedFromMessage || parsedDirect

  if (parsedPayload) {
    return normalizeApiPayloadMessage(parsedPayload) || fallbackMessage
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    if (/internal error encountered|internal server error/i.test(error.message)) {
      return 'Gemini internal error encountered. This is usually temporary. Retry generation.'
    }
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return fallbackMessage
}

const readStatusCode = (error) => {
  if (Number.isInteger(error?.status)) {
    return error.status
  }

  if (Number.isInteger(error?.code)) {
    return error.code
  }

  return 502
}

export const normalizeExternalError = (error, fallbackMessage = 'Unexpected server error.') =>
  new AppError(normalizeErrorMessage(error, fallbackMessage), readStatusCode(error))

export const toErrorResponse = (error) => {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message },
    }
  }

  return {
    statusCode: 500,
    body: { error: normalizeErrorMessage(error) },
  }
}

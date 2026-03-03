export const DEFAULT_MULTIVIEW_PROMPT = `full-length one full body character, Side VIEW ONLY, head-to-toe in frame
orthographic, neutral A-pose, light grey seamless background, sharp focus, No weapon, No cape`

const PORTRAIT_FALLBACK =
  'Create a stylized game-character portrait preserving the identity, costume, colors, and overall design of this reference.'

const PORTRAIT_PREFIX =
  'Create a stylized game-character identity portrait with torso and head in frame, clean studio background, sharp focus, and strong costume readability.'

export const buildPortraitPrompt = ({ prompt, hasReferenceImage }) => {
  const trimmedPrompt = prompt?.trim()

  if (trimmedPrompt && hasReferenceImage) {
    return `${PORTRAIT_PREFIX} Use this direction: ${trimmedPrompt}`
  }

  if (trimmedPrompt) {
    return `${PORTRAIT_PREFIX} ${trimmedPrompt}`
  }

  if (hasReferenceImage) {
    return `${PORTRAIT_PREFIX} ${PORTRAIT_FALLBACK}`
  }

  return `${PORTRAIT_PREFIX} Design a distinctive stylized character portrait.`
}

export const normalizeMultiviewPrompt = (prompt) => {
  const trimmedPrompt = prompt?.trim()
  return trimmedPrompt || DEFAULT_MULTIVIEW_PROMPT
}

export const buildViewPrompt = ({ view, characterPrompt, multiviewPrompt }) => {
  const basePrompt = normalizeMultiviewPrompt(multiviewPrompt)
  const specificViewLabel =
    view === 'front' ? 'FRONT VIEW ONLY' : view === 'back' ? 'BACK VIEW ONLY' : 'Side VIEW ONLY'
  const viewSpecificPrompt = basePrompt.replace(
    /FRONT VIEW ONLY|BACK VIEW ONLY|Side VIEW ONLY/gi,
    specificViewLabel,
  )

  return viewSpecificPrompt.trim()
}

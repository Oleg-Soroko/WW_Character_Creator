const summarizePrompt = (prompt) => {
  const trimmed = prompt.trim()
  if (!trimmed) {
    return 'Reference-driven character'
  }

  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed
}

export const createRunId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const createHistoryEntry = ({ id, prompt, inputMode, portraitUrl }) => ({
  id,
  createdAt: new Date().toISOString(),
  promptSummary: summarizePrompt(prompt),
  inputMode,
  portraitUrl,
  multiview: null,
  tripoTaskId: '',
  tripoStatus: 'idle',
  modelUrl: '',
})

export const updateHistoryEntry = (history, id, updates) =>
  history.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))

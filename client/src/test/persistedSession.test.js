import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_MULTIVIEW_PROMPT } from '../constants/prompts'
import { loadPersistedSession } from '../lib/persistedSession'

describe('loadPersistedSession', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('upgrades the legacy multiview default prompt to the current preset', () => {
    window.localStorage.setItem(
      'ww-character-session-v1',
      JSON.stringify({
        multiviewPrompt: `full-length one full body character, Side VIEW ONLY, head-to-toe in frame
orthographic, neutral A-pose, light grey seamless background, sharp focus, No weapon, No cape`,
      }),
    )

    const session = loadPersistedSession()

    expect(session?.multiviewPrompt).toBe(DEFAULT_MULTIVIEW_PROMPT)
  })
})

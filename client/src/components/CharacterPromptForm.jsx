import { ReferenceUpload } from './ReferenceUpload'

export function CharacterPromptForm({
  prompt,
  onPromptChange,
  referenceImage,
  onReferenceImageChange,
  onGeneratePortrait,
  onReset,
  isGeneratingPortrait,
}) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <p className="step-label">Step 01</p>
        <h2>Identity Portrait</h2>
      </div>
      <label className="field-label" htmlFor="character-prompt">
        Character prompt
      </label>
      <textarea
        id="character-prompt"
        className="prompt-textarea"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Stylized sci-fi ranger with ceramic shoulder plates, bright copper trims, soft freckles, calm expression..."
        rows={7}
        disabled={isGeneratingPortrait}
      />

      <ReferenceUpload
        value={referenceImage}
        disabled={isGeneratingPortrait}
        onChange={onReferenceImageChange}
      />

      <div className="action-row">
        <button
          type="button"
          className="primary-button"
          onClick={onGeneratePortrait}
          disabled={isGeneratingPortrait}
        >
          {isGeneratingPortrait ? 'Generating Portrait...' : 'Generate Portrait'}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onReset}
          disabled={isGeneratingPortrait}
        >
          Reset Session
        </button>
      </div>
    </section>
  )
}

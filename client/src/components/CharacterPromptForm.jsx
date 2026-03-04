import { ReferenceUpload } from './ReferenceUpload'

export function CharacterPromptForm({
  prompt,
  onPromptChange,
  referenceImage,
  onReferenceImageChange,
  onGeneratePortrait,
  isGeneratingPortrait,
  title = 'Identity Portrait',
  stepLabel = 'Step 01',
}) {
  return (
    <section className="panel-card">
      <div className="panel-heading-shell">
        <div className="section-heading">
          <p className="step-label">{stepLabel}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <label className="visually-hidden" htmlFor="character-prompt">
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

      <div className="action-row action-row--portrait">
        <ReferenceUpload
          compact
          value={referenceImage}
          disabled={isGeneratingPortrait}
          onChange={onReferenceImageChange}
        />
        <button
          type="button"
          className="primary-button"
          onClick={onGeneratePortrait}
          disabled={isGeneratingPortrait}
        >
          {isGeneratingPortrait ? 'Generating...' : 'Generate'}
        </button>
        <div className="action-row__spacer" aria-hidden="true" />
      </div>
    </section>
  )
}

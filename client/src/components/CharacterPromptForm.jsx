import { ReferenceUpload } from './ReferenceUpload'

export function CharacterPromptForm({
  prompt,
  onPromptChange,
  referenceImage,
  onReferenceImageChange,
  onGeneratePortrait,
  isGeneratingPortrait,
  embedded = false,
  title = 'Identity Portrait',
  stepLabel = 'Step 01',
  promptLabel = 'Character prompt',
  promptPlaceholder = 'Stylized sci-fi ranger with ceramic shoulder plates, bright copper trims, soft freckles, calm expression...',
  generateButtonLabel = 'Generate 2D',
  generatingButtonLabel = 'Generating 2D...',
  generateButtonAriaLabel = 'Generate 2D',
}) {
  const formBody = (
    <>
      <label className="visually-hidden" htmlFor="character-prompt">
        {promptLabel}
      </label>
      <div className="prompt-textarea-shell">
        <textarea
          id="character-prompt"
          className="prompt-textarea"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder={promptPlaceholder}
          rows={7}
          disabled={isGeneratingPortrait}
        />
        <ReferenceUpload
          compact
          value={referenceImage}
          disabled={isGeneratingPortrait}
          onChange={onReferenceImageChange}
        />
      </div>

      <div className="action-row action-row--portrait">
        <button
          type="button"
          className="primary-button"
          onClick={onGeneratePortrait}
          disabled={isGeneratingPortrait}
          aria-label={generateButtonAriaLabel}
        >
          {isGeneratingPortrait ? generatingButtonLabel : generateButtonLabel}
        </button>
      </div>
    </>
  )

  if (embedded) {
    return <div className="character-prompt character-prompt--embedded">{formBody}</div>
  }

  return (
    <section className="panel-card">
      <div className="panel-heading-shell">
        <div className="section-heading">
          <p className="step-label">{stepLabel}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {formBody}
    </section>
  )
}

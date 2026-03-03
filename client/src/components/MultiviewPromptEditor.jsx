export function MultiviewPromptEditor({
  value,
  onChange,
  onGenerateFrontTest,
  onGenerateTurnaround,
  disabled,
  generationMode,
}) {
  const isGenerating = generationMode !== ''

  return (
    <section className="panel-card">
      <div className="section-heading">
        <p className="step-label">Step 02</p>
        <h2>Turnaround Prompt</h2>
      </div>
      <p className="support-copy">
        This advanced prompt stays editable for testing. The server still injects the specific
        front, back, and side-view labels behind the scenes.
      </p>
      <textarea
        className="prompt-textarea prompt-textarea--compact"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        disabled={disabled}
      />
      <div className="action-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onGenerateFrontTest}
          disabled={disabled}
        >
          {generationMode === 'front-only'
            ? 'Generating Only Front View...'
            : 'Generate Only Front View'}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onGenerateTurnaround}
          disabled={disabled}
        >
          {generationMode === 'full' ? 'Generating Turnaround...' : 'Generate Turnaround'}
        </button>
      </div>
      {isGenerating ? (
        <p className="support-copy">
          {generationMode === 'front-only'
            ? 'Running a single front-view generation.'
            : 'Running the full front, back, and left turnaround batch.'}
        </p>
      ) : null}
    </section>
  )
}

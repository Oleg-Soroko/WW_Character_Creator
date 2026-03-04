const VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
}

export function MultiviewGrid({ views, mode = 'full', embedded = false }) {
  if (embedded) {
    return (
      <div className="multiview-grid">
        {Object.entries(VIEW_LABELS).map(([key, label]) => (
          <article className="view-card" key={key}>
            <span className="view-card__label">{label}</span>
            {views?.[key]?.imageDataUrl ? (
              <img src={views[key].imageDataUrl} alt={`${label} character view`} />
            ) : (
              <div className="empty-state empty-state--compact">
                <p>
                  {mode === 'front-only' && key !== 'front'
                    ? `${label} skipped in front test.`
                    : `${label} will appear here.`}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    )
  }

  return (
    <section className="panel-card panel-card--wide">
      <div className="section-heading">
        <p className="step-label">Turnaround</p>
        <h2>Orthographic Set</h2>
      </div>
      {mode === 'front-only' ? (
        <p className="visually-hidden">
          Front test generated. Run the full turnaround to create back, left, and mirrored right.
        </p>
      ) : null}
      <div className="multiview-grid">
        {Object.entries(VIEW_LABELS).map(([key, label]) => (
          <article className="view-card" key={key}>
            <header>
              <span>{label}</span>
              <small>{views?.[key]?.source || 'pending'}</small>
            </header>
            {views?.[key]?.imageDataUrl ? (
              <img src={views[key].imageDataUrl} alt={`${label} character view`} />
            ) : (
              <div className="empty-state empty-state--compact">
                <p>{mode === 'front-only' && key !== 'front' ? `${label} skipped in front test.` : `${label} will appear here.`}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

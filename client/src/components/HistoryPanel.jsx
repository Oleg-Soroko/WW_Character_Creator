export function HistoryPanel({ history }) {
  return (
    <section className="panel-card panel-card--wide">
      <div className="section-heading">
        <p className="step-label">Session</p>
        <h2>Recent Runs</h2>
      </div>
      {history.length ? (
        <div className="history-list">
          {history.map((entry) => (
            <article className="history-card" key={entry.id}>
              {entry.portraitUrl ? (
                <img src={entry.portraitUrl} alt={entry.promptSummary} />
              ) : (
                <div className="history-thumb-placeholder" aria-hidden="true">
                  {entry.promptSummary.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p>{entry.promptSummary}</p>
                <small>{entry.inputMode}</small>
                <small>{entry.tripoStatus || 'idle'}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--compact">
          <p>This browser tab keeps a lightweight history of portrait, turnaround, and Tripo runs.</p>
        </div>
      )}
    </section>
  )
}

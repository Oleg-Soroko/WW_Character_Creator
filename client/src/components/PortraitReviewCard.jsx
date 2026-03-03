export function PortraitReviewCard({ portraitResult }) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <p className="step-label">Portrait</p>
        <h2>Review Identity</h2>
      </div>
      {portraitResult ? (
        <div className="portrait-card">
          <img src={portraitResult.imageDataUrl} alt="Generated character portrait" />
          <div className="meta-stack">
            <span className="status-pill">{portraitResult.inputMode}</span>
            <p>{portraitResult.promptUsed}</p>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>The first generated portrait becomes the identity anchor for the turnaround stage.</p>
        </div>
      )}
    </section>
  )
}

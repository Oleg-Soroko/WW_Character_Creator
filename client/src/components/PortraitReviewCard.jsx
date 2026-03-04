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
        </div>
      ) : (
        <div className="portrait-card portrait-card--empty">
          <div className="empty-state empty-state--portrait">
            <p>The first generated portrait becomes the identity anchor for the turnaround stage.</p>
          </div>
        </div>
      )}
    </section>
  )
}

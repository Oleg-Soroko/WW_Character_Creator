import { useEffect, useMemo, useState } from 'react'

const VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
}

const getFrames = (direction) => {
  if (Array.isArray(direction?.frameDataUrls) && direction.frameDataUrls.length > 0) {
    return direction.frameDataUrls
  }

  if (direction?.previewDataUrl) {
    return [direction.previewDataUrl]
  }

  return []
}

const AnimatedSpriteTile = ({ direction, label }) => {
  const frames = useMemo(() => getFrames(direction), [direction])
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
  }, [frames.length, direction?.previewDataUrl])

  useEffect(() => {
    if (frames.length <= 1) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % frames.length)
    }, 110)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [frames])

  if (frames.length === 0) {
    return (
      <div className="empty-state empty-state--compact">
        <p>{label} run preview will appear here.</p>
      </div>
    )
  }

  return <img src={frames[frameIndex]} alt={`${label} run sprite preview`} />
}

export function SpriteGrid({ directions, embedded = false }) {
  if (embedded) {
    return (
      <div className="multiview-grid">
        {Object.entries(VIEW_LABELS).map(([key, label]) => (
          <article className="view-card" key={key}>
            <span className="view-card__label">{label}</span>
            <AnimatedSpriteTile direction={directions?.[key]} label={label} />
          </article>
        ))}
      </div>
    )
  }

  return (
    <section className="panel-card panel-card--wide">
      <div className="section-heading">
        <p className="step-label">Step 04</p>
        <h2>Sprite</h2>
      </div>
      <div className="multiview-grid">
        {Object.entries(VIEW_LABELS).map(([key, label]) => (
          <article className="view-card" key={key}>
            <span className="view-card__label">{label}</span>
            <AnimatedSpriteTile direction={directions?.[key]} label={label} />
          </article>
        ))}
      </div>
    </section>
  )
}

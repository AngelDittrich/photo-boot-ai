import { useEffect, useState } from 'react'

export function CaptureOverlay({ phase, countdown, captured, total }) {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!captured) return undefined
    setFlash(true)
    const timeout = setTimeout(() => setFlash(false), 90)
    return () => clearTimeout(timeout)
  }, [captured])

  const progress = total > 0 ? Math.min(1, captured / total) : 0

  return (
    <div className="capture-overlay">
      <div className={`flash ${flash ? 'flash--on' : ''}`} aria-hidden="true" />

      {phase === 'countdown' && (
        <div className="countdown" role="status" aria-live="assertive">
          <span key={countdown} className="countdown__number">
            {countdown}
          </span>
          <p>Prepárate para girar el objeto</p>
        </div>
      )}

      {phase === 'preparing' && (
        <div className="countdown countdown--small" role="status">
          <span className="spinner" />
          <p>Creando carpeta de sesión…</p>
        </div>
      )}

      {(phase === 'capturing' || phase === 'finishing') && (
        <div className="capture-overlay__footer">
          <div className="capture-overlay__row">
            <span className="rec">
              <i />
              {phase === 'capturing' ? 'Grabando' : 'Guardando'}
            </span>
            <strong>
              {captured} / {total}
            </strong>
          </div>
          <div className="bar">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

import { formatDuration } from '../lib/image'

function RotationGuide({ progress }) {
  const clamped = Math.max(0, Math.min(1, progress))
  const degrees = Math.round(clamped * 360)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const marks = Array.from({ length: 10 }, (_, index) => index * 36)

  return (
    <div className="rotation">
      <svg
        viewBox="0 0 140 140"
        className="rotation__svg"
        role="img"
        aria-label={`Rotación sugerida: ${degrees} de 360 grados`}
      >
        <defs>
          <linearGradient id="rotationGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5b8cff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        <circle cx="70" cy="70" r={radius} className="rotation__track" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="rotation__progress"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform="rotate(-90 70 70)"
        />

        {marks.map((angle, index) => {
          const radians = ((angle - 90) * Math.PI) / 180
          return (
            <line
              key={index}
              x1={70 + Math.cos(radians) * 61}
              y1={70 + Math.sin(radians) * 61}
              x2={70 + Math.cos(radians) * 67}
              y2={70 + Math.sin(radians) * 67}
              className="rotation__tick"
            />
          )
        })}

        <text x="70" y="66" className="rotation__value">
          {degrees}°
        </text>
        <text x="70" y="83" className="rotation__label">
          DE 360°
        </text>
      </svg>
      <p className="rotation__hint">Gira el plato lento y constante</p>
    </div>
  )
}

export function CapturePanel({ phase, captured, total, elapsedMs, durationMs, settings, onStop }) {
  const preparing = phase === 'preparing'
  const finishing = phase === 'finishing'
  const progress = total > 0 ? Math.min(1, captured / total) : 0
  const rotation = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0

  return (
    <section className="panel">
      <header className="panel__head">
        <div>
          <p className="eyebrow">{finishing ? 'Finalizando' : preparing ? 'Preparando' : 'Capturando'}</p>
          <h2>{finishing ? 'Guardando sesión' : preparing ? 'Creando sesión' : 'Gira el objeto'}</h2>
        </div>
        <span className={`pill ${finishing ? '' : 'pill--live'}`}>
          {!finishing && <i className="dot" />}
          {captured}/{total || settings.count}
        </span>
      </header>

      {preparing ? (
        <div className="preparing">
          <span className="spinner" />
          <p>Creando la carpeta y la metadata de la sesión…</p>
        </div>
      ) : (
        <>
          <div className="progress">
            <div className="progress__bar">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="progress__labels">
              <span>{Math.round(progress * 100)}%</span>
              <span>
                {formatDuration(elapsedMs)} / {formatDuration(durationMs)}
              </span>
            </div>
          </div>

          <RotationGuide progress={rotation} />

          <div className="stats">
            <div>
              <strong>{captured}</strong>
              <span>capturadas</span>
            </div>
            <div>
              <strong>{Math.max(0, total - captured)}</strong>
              <span>restantes</span>
            </div>
            <div>
              <strong>{settings.size}px</strong>
              <span>{settings.grayscale ? 'grises' : 'color'}</span>
            </div>
          </div>

          <p className="tip">
            Gira el plato de forma lenta y constante. La marca completa una vuelta de 360° con la
            sesión.
          </p>
        </>
      )}

      <button
        type="button"
        className="btn btn--danger btn--wide"
        onClick={onStop}
        disabled={finishing}
      >
        {finishing ? 'Guardando…' : 'Detener y guardar'}
      </button>
    </section>
  )
}

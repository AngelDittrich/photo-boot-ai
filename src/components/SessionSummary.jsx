import { useState } from 'react'
import { formatBytes, formatDuration } from '../lib/image'

export function SessionSummary({ summary, onNew }) {
  const [copied, setCopied] = useState(false)

  const copyFolder = async () => {
    try {
      await navigator.clipboard.writeText(summary.folder)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const averageBytes = summary.uploaded > 0 ? summary.bytes / summary.uploaded : 0

  return (
    <section className="panel">
      <header className="panel__head">
        <div>
          <p className="eyebrow">Sesión finalizada</p>
          <h2>{summary.label}</h2>
        </div>
        <span className={`pill ${summary.status === 'completed' ? 'pill--ok' : 'pill--warn'}`}>
          {summary.status === 'completed' ? 'Completa' : 'Parcial'}
        </span>
      </header>

      <div className="folder">
        <code>{summary.folder}</code>
        <button type="button" className="btn btn--ghost" onClick={copyFolder}>
          {copied ? 'Copiado' : 'Copiar ruta'}
        </button>
      </div>

      <div className="stats">
        <div>
          <strong>{summary.uploaded}</strong>
          <span>guardadas</span>
        </div>
        <div>
          <strong>{formatBytes(summary.bytes)}</strong>
          <span>peso total</span>
        </div>
        <div>
          <strong>{formatDuration(summary.durationMs)}</strong>
          <span>duración</span>
        </div>
      </div>

      <dl className="details">
        <div>
          <dt>Resolución</dt>
          <dd>
            {summary.settings.size}×{summary.settings.size} px
          </dd>
        </div>
        <div>
          <dt>Formato</dt>
          <dd>
            {summary.settings.grayscale ? 'Grises' : 'Color'} · JPEG q{summary.settings.quality}
          </dd>
        </div>
        <div>
          <dt>Ritmo</dt>
          <dd>
            {(summary.settings.count / (summary.settings.durationMs / 1000)).toFixed(1)} fps
          </dd>
        </div>
        <div>
          <dt>Peso medio</dt>
          <dd>{formatBytes(averageBytes)}</dd>
        </div>
        {summary.failed > 0 && (
          <div className="details__warn">
            <dt>Fallidas</dt>
            <dd>{summary.failed}</dd>
          </div>
        )}
      </dl>

      {summary.status === 'partial' && (
        <p className="footnote">
          La sesión se guardó como parcial. Las fotos capturadas ya están disponibles en la
          carpeta.
        </p>
      )}

      <p className="footnote">
        Revisa los archivos en <code>datasets/</code>. Cada nueva captura crea su propia carpeta.
      </p>

      <button type="button" className="btn btn--primary btn--wide" onClick={onNew}>
        Nueva captura
      </button>
    </section>
  )
}

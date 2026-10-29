import { useEffect } from 'react'

export function CameraPreview({ videoRef, stream, status, error, onRetry, children }) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    video.srcObject = stream ?? null

    if (!stream) {
      return () => {
        video.srcObject = null
      }
    }

    const play = () => {
      video.play().catch(() => {})
    }

    if (video.readyState >= 2) play()
    else video.addEventListener('loadedmetadata', play, { once: true })

    return () => {
      video.removeEventListener('loadedmetadata', play)
      video.srcObject = null
    }
  }, [stream, videoRef])

  return (
    <div className="preview">
      <video ref={videoRef} className="preview__video" autoPlay playsInline muted />

      {status === 'ready' && (
        <div className="preview__guide" aria-hidden="true">
          <span>zona de captura</span>
        </div>
      )}

      {status === 'requesting' && (
        <div className="preview__status">
          <span className="spinner" />
          <p>Conectando cámara…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="preview__status preview__status--error">
          <p>{error}</p>
          <button type="button" className="btn btn--ghost" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}

      {children}
    </div>
  )
}

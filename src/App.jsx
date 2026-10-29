import { useEffect, useRef, useState } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { CaptureOverlay } from './components/CaptureOverlay'
import { CapturePanel } from './components/CapturePanel'
import { SessionSummary } from './components/SessionSummary'
import { SettingsPanel } from './components/SettingsPanel'
import { useCamera } from './hooks/useCamera'
import { useCapture } from './hooks/useCapture'

const SETTINGS_KEY = 'photo-boot-ai.settings'
const MUTE_KEY = 'photo-boot-ai.muted'
const DEFAULT_SETTINGS = {
  count: 50,
  durationMs: 10_000,
  size: 224,
  quality: 0.75,
  grayscale: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default function App() {
  const videoRef = useRef(null)
  const camera = useCamera()
  const capture = useCapture({ videoRef })

  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [settings, setSettings] = useState(loadSettings)
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  }, [muted])

  const busy = ['countdown', 'preparing', 'capturing', 'finishing'].includes(capture.phase)
  const showCapturePanel = ['preparing', 'capturing', 'finishing'].includes(capture.phase)
  const canStart = camera.status === 'ready' && label.trim().length > 0 && !busy

  const selectedCamera = camera.devices.find((device) => device.deviceId === camera.deviceId)

  const handleStart = () => {
    if (!canStart) return
    void capture.start({
      label: label.trim(),
      notes: notes.trim(),
      settings,
      muted,
      camera: {
        deviceId: camera.deviceId,
        label: selectedCamera?.label ?? '',
      },
    })
  }

  const cameraStatusText =
    camera.status === 'ready'
      ? 'Cámara lista'
      : camera.status === 'requesting'
        ? 'Conectando…'
        : camera.status === 'error'
          ? 'Sin cámara'
          : 'Iniciando…'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <h1>Photo Boot AI</h1>
            <p>Captura de datasets para clasificación de objetos</p>
          </div>
        </div>

        <div className="topbar__actions">
          <span className={`status status--${camera.status}`}>
            <i />
            {cameraStatusText}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--compact"
            onClick={() => setMuted((value) => !value)}
            aria-pressed={muted}
            title={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
          >
            Audio {muted ? 'off' : 'on'}
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="stage">
          <CameraPreview
            videoRef={videoRef}
            stream={camera.stream}
            status={camera.status}
            error={camera.error}
            onRetry={camera.retry}
          >
            <CaptureOverlay
              phase={capture.phase}
              countdown={capture.countdown}
              captured={capture.captured}
              total={capture.total}
            />
          </CameraPreview>

          <div className="stage__meta">
            <span>
              <strong>
                {settings.size}×{settings.size}
              </strong>{' '}
              recorte central
            </span>
            <span>
              {settings.grayscale ? 'Escala de grises' : 'Color'} · JPEG q{settings.quality}
            </span>
            <span>
              {settings.count} fotos en {(settings.durationMs / 1000).toFixed(1)} s
            </span>
          </div>
        </section>

        <aside className="sidebar">
          {capture.phase === 'error' && capture.error && (
            <div className="alert" role="alert">
              <strong>No se pudo completar la captura</strong>
              <p>{capture.error}</p>
            </div>
          )}

          {capture.phase === 'done' && capture.summary ? (
            <SessionSummary summary={capture.summary} onNew={capture.reset} />
          ) : showCapturePanel ? (
            <CapturePanel
              phase={capture.phase}
              captured={capture.captured}
              total={capture.total}
              elapsedMs={capture.elapsedMs}
              durationMs={settings.durationMs}
              settings={settings}
              onStop={capture.stop}
            />
          ) : (
            <SettingsPanel
              label={label}
              onLabelChange={setLabel}
              notes={notes}
              onNotesChange={setNotes}
              settings={settings}
              onSettingsChange={setSettings}
              cameras={camera.devices}
              deviceId={camera.deviceId}
              onSelectCamera={camera.selectCamera}
              onRefreshDevices={camera.refreshDevices}
              cameraStatus={camera.status}
              disabled={busy || capture.phase === 'countdown'}
              canStart={canStart}
              onStart={handleStart}
            />
          )}
        </aside>
      </main>

      <footer className="footer">
        Guardado local vía servidor Express · <code>datasets/&lt;objeto&gt;-&lt;fecha&gt;/</code>
      </footer>
    </div>
  )
}

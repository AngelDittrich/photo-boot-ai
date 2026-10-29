import { useEffect, useState } from 'react'
import { formatBytes } from '../lib/image'

function NumberField({ label, value, min, max, step = 1, suffix, disabled, onChange }) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const handleChange = (raw) => {
    setDraft(raw)
    const number = Number(raw)
    if (raw !== '' && Number.isFinite(number) && number >= min && number <= max) {
      onChange(number)
    }
  }

  const handleBlur = () => {
    const number = Number(draft)
    if (draft === '' || !Number.isFinite(number)) {
      setDraft(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, number))
    setDraft(String(clamped))
    onChange(clamped)
  }

  return (
    <label className="field field--compact">
      <span className="field__label">{label}</span>
      <div className="input-wrap">
        <input
          className="input"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleBlur}
        />
        {suffix && <span className="input-wrap__suffix">{suffix}</span>}
      </div>
    </label>
  )
}

export function SettingsPanel({
  label,
  onLabelChange,
  notes,
  onNotesChange,
  settings,
  onSettingsChange,
  cameras,
  deviceId,
  onSelectCamera,
  onRefreshDevices,
  cameraStatus,
  disabled,
  canStart,
  onStart,
}) {
  const seconds = settings.durationMs / 1000
  const fps = seconds > 0 ? (settings.count / seconds).toFixed(1) : '—'
  const update = (patch) => onSettingsChange({ ...settings, ...patch })

  return (
    <section className="panel">
      <header className="panel__head">
        <div>
          <p className="eyebrow">Nueva sesión</p>
          <h2>Configura la captura</h2>
        </div>
        <span className="pill">{settings.count} fotos</span>
      </header>

      <label className="field">
        <span className="field__label">
          Objeto / etiqueta <em>*</em>
        </span>
        <input
          className="input"
          value={label}
          maxLength={80}
          placeholder="Ej. taza-blanca"
          onChange={(event) => onLabelChange(event.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="field">
        <span className="field__label">
          Notas <span className="muted">(opcional)</span>
        </span>
        <textarea
          className="input input--area"
          rows={2}
          value={notes}
          maxLength={1000}
          placeholder="Luz, fondo, observaciones…"
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="field">
        <span className="field__label">Cámara</span>
        <div className="inline">
          <select
            className="input"
            value={deviceId}
            onChange={(event) => onSelectCamera(event.target.value)}
            disabled={disabled || cameras.length === 0}
          >
            {cameras.length === 0 && (
              <option value="">
                {cameraStatus === 'requesting' ? 'Buscando cámaras…' : 'Sin cámaras detectadas'}
              </option>
            )}
            {cameras.map((camera, index) => (
              <option key={camera.deviceId || index} value={camera.deviceId}>
                {camera.label || `Cámara ${index + 1}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--ghost btn--square"
            onClick={onRefreshDevices}
            disabled={disabled}
            title="Volver a buscar cámaras"
            aria-label="Volver a buscar cámaras"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="grid grid--2">
        <NumberField
          label="Fotos"
          value={settings.count}
          min={1}
          max={200}
          disabled={disabled}
          suffix="uds"
          onChange={(count) => update({ count })}
        />
        <NumberField
          label="Duración"
          value={seconds}
          min={2}
          max={120}
          step={0.5}
          disabled={disabled}
          suffix="s"
          onChange={(value) => update({ durationMs: Math.round(value * 1000) })}
        />
        <NumberField
          label="Tamaño"
          value={settings.size}
          min={128}
          max={512}
          step={16}
          disabled={disabled}
          suffix="px"
          onChange={(size) => update({ size })}
        />
        <NumberField
          label="Calidad JPEG"
          value={settings.quality}
          min={0.5}
          max={0.95}
          step={0.05}
          disabled={disabled}
          onChange={(quality) => update({ quality: Math.round(quality * 100) / 100 })}
        />
      </div>

      <label className={`toggle ${settings.grayscale ? 'toggle--on' : ''}`}>
        <input
          type="checkbox"
          checked={settings.grayscale}
          onChange={(event) => update({ grayscale: event.target.checked })}
          disabled={disabled}
        />
        <span className="toggle__track">
          <i />
        </span>
        <span className="toggle__text">
          <strong>Escala de grises</strong>
          <small>Reduce peso y acelera el entrenamiento</small>
        </span>
      </label>

      <div className="summary-line">
        <span>
          <strong>{fps}</strong> fps
        </span>
        <span>
          <strong>
            {settings.size}×{settings.size}
          </strong>{' '}
          px
        </span>
        <span>
          ~<strong>{formatBytes(settings.count * 10 * 1024)}</strong> aprox.
        </span>
      </div>

      <button type="button" className="btn btn--primary btn--wide" disabled={!canStart} onClick={onStart}>
        Iniciar captura <span className="btn__hint">3 s</span>
      </button>

      <p className="footnote">
        Cuenta regresiva de 3 s y luego captura automática. Mantén la pestaña visible durante la sesión.
      </p>
    </section>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { captureFrame } from '../lib/image'
import { createSession, finishSession, uploadFrame } from '../lib/api'
import { beepCountdown, beepGo, shutter, unlockAudio } from '../lib/audio'

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export function useCapture({ videoRef }) {
  const [phase, setPhase] = useState('idle')
  const [countdown, setCountdown] = useState(null)
  const [captured, setCaptured] = useState(0)
  const [total, setTotal] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  const cancelRef = useRef(false)
  const busyRef = useRef(false)
  const mountedRef = useRef(true)
  const tickerRef = useRef(null)
  const uploadedBytesRef = useRef(0)
  const uploadedCountRef = useRef(0)
  const failedCountRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelRef.current = true
      clearInterval(tickerRef.current)
    }
  }, [])

  const start = useCallback(
    async (config) => {
      if (busyRef.current) return

      const video = videoRef.current
      if (!video || !video.videoWidth || !video.videoHeight) {
        setError('La cámara todavía no está lista. Espera la vista previa e inténtalo de nuevo.')
        setPhase('error')
        return
      }

      busyRef.current = true
      cancelRef.current = false
      uploadedBytesRef.current = 0
      uploadedCountRef.current = 0
      failedCountRef.current = 0
      setError(null)
      setSummary(null)
      setCaptured(0)
      setElapsedMs(0)
      setTotal(config.settings.count)

      let sessionId = null
      let folder = null
      let capturedCount = 0
      let startedAt = 0
      const uploads = []

      try {
        unlockAudio()
        setPhase('countdown')
        for (let n = 3; n >= 1; n -= 1) {
          if (cancelRef.current) break
          setCountdown(n)
          if (!config.muted) beepCountdown(n)
          await sleep(1000)
        }
        setCountdown(null)

        if (cancelRef.current) {
          if (mountedRef.current) setPhase('idle')
          return
        }
        if (!config.muted) beepGo()

        setPhase('preparing')
        const created = await createSession({
          label: config.label,
          notes: config.notes,
          settings: config.settings,
          camera: config.camera,
        })
        sessionId = created.session.id
        folder = created.folder

        setPhase('capturing')
        const { count, durationMs } = config.settings
        const interval = durationMs / count
        startedAt = performance.now()

        tickerRef.current = setInterval(() => {
          if (!mountedRef.current) return
          setElapsedMs(Math.min(durationMs, performance.now() - startedAt))
        }, 100)

        for (let index = 0; index < count; index += 1) {
          if (cancelRef.current) break

          const target = startedAt + index * interval
          const wait = target - performance.now()
          if (wait > 0) await sleep(wait)
          if (cancelRef.current) break

          const blob = await captureFrame(video, config.settings)
          if (!blob) {
            failedCountRef.current += 1
            continue
          }

          capturedCount += 1
          if (mountedRef.current) setCaptured(capturedCount)

          const timeMs = Math.round(performance.now() - startedAt)
          uploads.push(
            (async () => {
              try {
                try {
                  await uploadFrame(sessionId, { blob, index, timeMs })
                } catch {
                  await sleep(250)
                  await uploadFrame(sessionId, { blob, index, timeMs })
                }
                uploadedCountRef.current += 1
                uploadedBytesRef.current += blob.size
              } catch {
                failedCountRef.current += 1
              }
            })(),
          )

          if (!config.muted) shutter(index)
        }

        clearInterval(tickerRef.current)
        tickerRef.current = null
        if (mountedRef.current) {
          setElapsedMs(Math.min(durationMs, performance.now() - startedAt))
        }

        setPhase('finishing')
        await Promise.allSettled(uploads)

        const actualDurationMs = Math.round(performance.now() - startedAt)
        const complete =
          !cancelRef.current && capturedCount === count && failedCountRef.current === 0

        let finished = null
        try {
          finished = await finishSession(sessionId, {
            status: complete ? 'completed' : 'partial',
            actualDurationMs,
            failedCount: failedCountRef.current,
          })
        } catch {
          // Las fotos ya están guardadas; la metadata se puede corregir después.
        }

        if (!mountedRef.current) return

        setSummary({
          id: sessionId,
          folder,
          label: config.label,
          status: complete ? 'completed' : 'partial',
          captured: capturedCount,
          uploaded: uploadedCountRef.current,
          failed: failedCountRef.current,
          bytes: uploadedBytesRef.current,
          durationMs: actualDurationMs,
          settings: config.settings,
          finishedAt: finished?.session?.completedAt ?? new Date().toISOString(),
        })
        setPhase('done')
      } catch (captureError) {
        clearInterval(tickerRef.current)
        tickerRef.current = null
        if (!mountedRef.current) return

        if (sessionId) {
          try {
            await finishSession(sessionId, {
              status: 'partial',
              actualDurationMs: startedAt ? Math.round(performance.now() - startedAt) : 0,
              failedCount: failedCountRef.current,
            })
          } catch {
            // Sin conexión con el servidor: no hay nada más que actualizar.
          }
        }

        setError(captureError?.message || 'Ocurrió un error durante la captura')
        setPhase('error')
      } finally {
        busyRef.current = false
      }
    },
    [videoRef],
  )

  const stop = useCallback(() => {
    cancelRef.current = true
  }, [])

  const reset = useCallback(() => {
    if (busyRef.current) return
    setPhase('idle')
    setCountdown(null)
    setCaptured(0)
    setTotal(0)
    setElapsedMs(0)
    setSummary(null)
    setError(null)
  }, [])

  return {
    phase,
    countdown,
    captured,
    total,
    elapsedMs,
    summary,
    error,
    start,
    stop,
    reset,
  }
}

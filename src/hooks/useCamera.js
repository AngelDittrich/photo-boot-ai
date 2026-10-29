import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'photo-boot-ai.camera'
const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
}

function describeError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permiso de cámara denegado. Habilítalo en el navegador y vuelve a intentarlo.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No se encontró ninguna cámara conectada.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La cámara está en uso por otra aplicación.'
    case 'OverconstrainedError':
      return 'La cámara seleccionada no está disponible.'
    default:
      return error?.message
        ? `No se pudo abrir la cámara: ${error.message}`
        : 'No se pudo abrir la cámara.'
  }
}

export function useCamera() {
  const [stream, setStream] = useState(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const streamRef = useRef(null)
  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)
  const activeIdRef = useRef('')
  const openRef = useRef(null)

  const stopStream = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const cameras = allDevices.filter((device) => device.kind === 'videoinput')
      if (mountedRef.current) setDevices(cameras)
      return cameras
    } catch {
      return []
    }
  }, [])

  const open = useCallback(
    async (preferredId = '') => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error')
        setError('Este navegador no soporta acceso a la cámara. Usa Chrome, Edge o Safari actualizado.')
        return null
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setStatus('requesting')
      setError(null)

      const videoConstraints = { ...VIDEO_CONSTRAINTS }
      if (preferredId) videoConstraints.deviceId = { exact: preferredId }

      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        })

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          nextStream.getTracks().forEach((track) => track.stop())
          return null
        }

        stopStream()
        streamRef.current = nextStream
        setStream(nextStream)

        const actualId = nextStream.getVideoTracks()[0]?.getSettings()?.deviceId || preferredId
        activeIdRef.current = actualId
        setDeviceId(actualId)
        if (actualId) localStorage.setItem(STORAGE_KEY, actualId)

        setStatus('ready')
        void refreshDevices()
        return nextStream
      } catch (cameraError) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return null

        const canRetryDefault =
          preferredId &&
          (cameraError.name === 'OverconstrainedError' || cameraError.name === 'NotFoundError')

        if (canRetryDefault) {
          localStorage.removeItem(STORAGE_KEY)
          activeIdRef.current = ''
          return openRef.current?.('') ?? null
        }

        stopStream()
        setStream(null)
        setStatus('error')
        setError(describeError(cameraError))
        return null
      }
    },
    [refreshDevices, stopStream],
  )

  openRef.current = open

  useEffect(() => {
    mountedRef.current = true
    const preferredId = localStorage.getItem(STORAGE_KEY) ?? ''
    void open(preferredId)

    const handleDeviceChange = () => {
      void refreshDevices()
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange)

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange)
      stopStream()
    }
  }, [open, refreshDevices, stopStream])

  const selectCamera = useCallback(
    (id) => {
      if (!id || id === activeIdRef.current) return
      localStorage.setItem(STORAGE_KEY, id)
      activeIdRef.current = id
      setDeviceId(id)
      void open(id)
    },
    [open],
  )

  const retry = useCallback(() => {
    const preferred = activeIdRef.current || localStorage.getItem(STORAGE_KEY) || ''
    void open(preferred)
  }, [open])

  return {
    stream,
    devices,
    deviceId,
    status,
    error,
    selectCamera,
    retry,
    refreshDevices,
  }
}

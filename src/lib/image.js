export function grayscaleInPlace(context, size) {
  const image = context.getImageData(0, 0, size, size)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const luma = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114 + 500) / 1000
    const value = luma | 0
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
  }
  context.putImageData(image, 0, 0)
}

export function captureFrame(video, { size, grayscale, quality }) {
  return new Promise((resolve) => {
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    if (!sourceWidth || !sourceHeight) {
      resolve(null)
      return
    }

    const side = Math.min(sourceWidth, sourceHeight)
    const sourceX = Math.round((sourceWidth - side) / 2)
    const sourceY = Math.round((sourceHeight - side) / 2)

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: Boolean(grayscale) })
    if (!context) {
      resolve(null)
      return
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(video, sourceX, sourceY, side, side, 0, 0, size, size)

    if (grayscale) grayscaleInPlace(context, size)

    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, milliseconds) / 1000
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)} s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes} min ${String(seconds).padStart(2, '0')} s`
}

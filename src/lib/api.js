async function readResponse(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (!response.ok) {
    throw new Error(payload?.error || `Error del servidor (${response.status})`)
  }
  return payload
}

export async function createSession({ label, notes, settings, camera }) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, notes, settings, camera }),
  })
  return readResponse(response)
}

export async function uploadFrame(sessionId, { blob, index, timeMs }) {
  const form = new FormData()
  form.append('frame', blob, `frame_${String(index).padStart(3, '0')}.jpg`)
  form.append('index', String(index))
  form.append('timeMs', String(Math.round(timeMs)))

  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/frames`, {
    method: 'POST',
    body: form,
  })
  return readResponse(response)
}

export async function finishSession(sessionId, payload) {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readResponse(response)
}

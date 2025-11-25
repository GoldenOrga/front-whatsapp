function normalizeBaseUrl(base, fallbackPath) {
  if (!base) return fallbackPath
  const hasProtocol = /^https?:\/\//i.test(base)
  const cleaned = base.replace(/\/$/, '')
  return hasProtocol ? cleaned : `http://${cleaned}`
}

const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, '/api')
const UPLOAD_BASE = normalizeBaseUrl(import.meta.env.VITE_UPLOAD_BASE_URL, '/uploads')

const API_ORIGIN = /^https?:\/\//i.test(API_BASE)
  ? new URL(API_BASE).origin
  : window.location.origin

async function request(method, url, body, token) {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  console.log(API_BASE)
  console.log(`${API_BASE}${url}`);
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    // ignore parse errors, handled below
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Erreur ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

async function uploadFile(file, token, extraFields = {}) {
  const form = new FormData()
  form.append('file', file)
  Object.entries(extraFields).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, v)
  })

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.message || data?.error || `Erreur ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

function buildFileUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl

  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  const defaultUploadPrefix = '/uploads'

  // UPLOAD_BASE absolu
  if (/^https?:\/\//i.test(UPLOAD_BASE)) {
    const uploadUrl = new URL(UPLOAD_BASE)
    if (cleanPath.startsWith(uploadUrl.pathname)) {
      return `${uploadUrl.origin}${cleanPath}`
    }
    return `${UPLOAD_BASE}${cleanPath}`
  }

  // UPLOAD_BASE relatif (ex: /uploads) ou chemin déjà fourni par l'API
  const basePath = UPLOAD_BASE.startsWith('/') ? UPLOAD_BASE : `/${UPLOAD_BASE}`

  // Si l'API renvoie déjà /upload... ou /uploads..., on ne préfixe pas deux fois
  if (cleanPath.startsWith(basePath) || cleanPath.startsWith('/upload')) {
    return `${API_ORIGIN}${cleanPath}`
  }

  // Sinon on préfixe avec la base attendue
  return `${API_ORIGIN}${basePath || defaultUploadPrefix}${cleanPath}`
}

export default {
  get: (url, token) => request('GET', url, null, token),
  post: (url, body, token) => request('POST', url, body, token),
  put: (url, body, token) => request('PUT', url, body, token),
  delete: (url, body, token) => request('DELETE', url, body, token),
  uploadFile,
  buildFileUrl,
}

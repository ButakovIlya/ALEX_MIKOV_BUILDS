import { expireAdminSessionOnUnauthorized } from './auth'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseUploadError(xhr: XMLHttpRequest): Promise<string> {
  try {
    const data = JSON.parse(xhr.responseText) as { detail?: string }
    return data.detail ?? xhr.statusText
  } catch {
    return xhr.statusText || 'Upload failed'
  }
}

export function uploadFormData(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)
    const headers = authHeaders()
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
      } else {
        expireAdminSessionOnUnauthorized(xhr.status)
        void parseUploadError(xhr).then(reject)
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

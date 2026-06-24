import type { HouseSpecs } from './houseEnums'
import { uploadFormData } from './upload'

export type HousePhoto = {
  id: string
  url: string
  original_filename: string
  alt_text: string
  sort_order: number
}

export type HouseVideo = {
  id: string
  url: string
  original_filename: string
  file_size_bytes: number
  title: string
  sort_order: number
}

export type HouseVideoLink = {
  id: string
  platform: string
  url: string
  title: string
  embed_url: string | null
  sort_order: number
}

export type HouseGlb = {
  id: string
  url: string
  original_filename: string
  file_size_bytes: number
}

export type House = HouseSpecs & {
  id: string
  name: string
  description: string
  location: string
  area_sqm: number | null
  is_published: boolean
  sort_order?: number
  avatar_url: string | null
  photos: HousePhoto[]
  videos: HouseVideo[]
  video_links: HouseVideoLink[]
  model: HouseGlb | null
  created_at: string
}

export type HouseListItem = {
  id: string
  name: string
  description: string
  location: string
  area_sqm: number | null
  cover_url: string | null
  has_model: boolean
  model_url: string | null
  has_videos: boolean
  price_rub: number | null
  object_type: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export type AddressSuggestion = {
  display_name: string
  latitude: number
  longitude: number
  city: string | null
  street: string | null
  house_number: string | null
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type HouseCreatePayload = {
  name: string
  description?: string
  location?: string
  area_sqm?: number | null
  is_published?: boolean
  sort_order?: number
} & Partial<HouseSpecs>

const API_BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string | { msg: string }[] }
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(', ')
    return res.statusText
  } catch {
    return res.statusText
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<T>
}

export async function fetchHouses(): Promise<HouseListItem[]> {
  return fetchJson(`${API_BASE}/api/v1/houses`)
}

export async function fetchHouse(id: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/houses/${id}`)
}

export async function searchAddresses(q: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q, limit: '10' })
  return fetchJson(`${API_BASE}/api/v1/addresses/search?${params}`)
}

export async function fetchAdminHouses(): Promise<House[]> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses`, { headers: authHeaders() })
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  return fetchJson(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export async function createHouse(payload: HouseCreatePayload): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateHouse(id: string, payload: HouseCreatePayload): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteHouse(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/admin/houses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function uploadHouseAvatar(
  houseId: string,
  file: File,
  onProgress: (p: number) => void,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await uploadFormData(`/api/v1/admin/houses/${houseId}/avatar`, form, onProgress)
}

export async function deleteHouseAvatar(houseId: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/avatar`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function uploadHousePhoto(
  houseId: string,
  file: File,
  altText: string,
  onProgress: (p: number) => void,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  form.append('alt_text', altText)
  await uploadFormData(`/api/v1/admin/houses/${houseId}/photos`, form, onProgress)
}

export async function deleteHousePhoto(houseId: string, photoId: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function uploadHouseVideo(
  houseId: string,
  file: File,
  title: string,
  onProgress: (p: number) => void,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  form.append('title', title)
  await uploadFormData(`/api/v1/admin/houses/${houseId}/videos`, form, onProgress)
}

export async function deleteHouseVideo(houseId: string, videoId: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/videos/${videoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function addHouseVideoLink(houseId: string, url: string, title: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/video-links`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title }),
  })
}

export async function deleteHouseVideoLink(houseId: string, linkId: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/video-links/${linkId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function uploadHouseModel(
  houseId: string,
  file: File,
  onProgress: (p: number) => void,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await uploadFormData(`/api/v1/admin/houses/${houseId}/model`, form, onProgress)
}

export async function deleteHouseModel(houseId: string): Promise<House> {
  return fetchJson(`${API_BASE}/api/v1/admin/houses/${houseId}/model`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function assetUrl(path: string): string {
  if (path.startsWith('http')) return path
  if (path.startsWith('/storage')) return path
  return `${API_BASE}${path}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function platformLabel(platform: string): string {
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'rutube') return 'Rutube'
  if (platform === 'vk') return 'VK'
  return platform
}

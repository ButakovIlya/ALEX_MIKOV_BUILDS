import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addHouseVideoLink,
  assetUrl,
  createHouse,
  deleteHouse,
  deleteHouseAvatar,
  deleteHouseModel,
  deleteHousePhoto,
  deleteHouseVideo,
  deleteHouseVideoLink,
  fetchAdminHouses,
  formatBytes,
  login,
  platformLabel,
  updateHouse,
  uploadHouseAvatar,
  uploadHouseModel,
  uploadHousePhoto,
  uploadHouseVideo,
  type House,
} from '../api/client'
import { ADMIN_AUTH_EXPIRED_EVENT } from '../api/auth'
import { AdminCard, AdminTabs, type AdminTab } from '../components/admin/AdminCard'
import { DropZone } from '../components/admin/DropZone'
import { HouseSpecsForm } from '../components/admin/HouseSpecsForm'
import { MediaPreview, type PhotoSlide } from '../components/admin/MediaPreview'
import { ModelViewer } from '../components/ModelViewer'
import { defaultHouseSpecs, houseToSpecs, type HouseSpecs } from '../api/houseEnums'

type PreviewState =
  | { type: 'photo'; photos: PhotoSlide[]; index: number }
  | { type: 'video'; src: string; title: string }
  | { type: 'embed'; src: string; title: string }
  | null

type UploadKey = 'avatar' | 'photo' | 'video' | 'model'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv'

function isImage(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name)
}

function isVideo(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
}

function isGlb(file: File) {
  return file.name.toLowerCase().endsWith('.glb')
}

export function AdminPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('admin_token')))

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formArea, setFormArea] = useState('')
  const [formPublished, setFormPublished] = useState(true)
  const [formSpecs, setFormSpecs] = useState<HouseSpecs>(defaultHouseSpecs)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('info')

  const [videoLinkUrl, setVideoLinkUrl] = useState('')
  const [videoLinkTitle, setVideoLinkTitle] = useState('')
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<UploadKey, number>>>({})
  const [uploadLabel, setUploadLabel] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState>(null)

  const selected = houses.find((h) => h.id === selectedId) ?? null

  const loadHouses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminHouses()
      setHouses(data)
      setSelectedId((prev) => (prev && data.some((h) => h.id === prev) ? prev : data[0]?.id ?? null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loggedIn) void loadHouses()
  }, [loggedIn, loadHouses])

  useEffect(() => {
    const handleAuthExpired = () => {
      setLoggedIn(false)
      setHouses([])
      setSelectedId(null)
      setError(null)
      setLoginError('Сессия истекла. Войдите снова.')
    }
    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired)
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!selected) return
    setFormName(selected.name)
    setFormDescription(selected.description)
    setFormLocation(selected.location)
    setFormArea(selected.area_sqm?.toString() ?? '')
    setFormPublished(selected.is_published)
    setFormSpecs(houseToSpecs(selected))
  }, [selected?.id])

  const trackUpload = async (
    key: UploadKey,
    label: string,
    fn: (onProgress: (p: number) => void) => Promise<void>,
  ) => {
    setError(null)
    setUploadLabel(label)
    setUploadProgress((p) => ({ ...p, [key]: 0 }))
    try {
      await fn((percent) => setUploadProgress((p) => ({ ...p, [key]: percent })))
      await loadHouses()
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`)
    } finally {
      setTimeout(() => {
        setUploadProgress((p) => ({ ...p, [key]: undefined }))
        setUploadLabel(null)
      }, 800)
    }
  }

  const uploadPhotos = async (files: File[]) => {
    if (!selectedId) return
    const images = files.filter(isImage)
    if (!images.length) {
      setError('Нужны изображения (jpg, png, webp, gif)')
      return
    }
    for (let i = 0; i < images.length; i++) {
      await trackUpload('photo', `Фото ${i + 1} из ${images.length}`, (p) =>
        uploadHousePhoto(selectedId, images[i], formName, p),
      )
    }
  }

  const handleSmartDrop = async (files: File[]) => {
    if (!selectedId || !files.length) return
    const images = files.filter(isImage)
    const videos = files.filter(isVideo)
    const glbs = files.filter(isGlb)

    if (glbs.length) {
      await trackUpload('model', '3D модель', (p) => uploadHouseModel(selectedId, glbs[0], p))
    }
    if (videos.length) {
      for (let i = 0; i < videos.length; i++) {
        await trackUpload('video', `Видео ${i + 1} из ${videos.length}`, (p) =>
          uploadHouseVideo(selectedId, videos[i], videos[i].name, p),
        )
      }
    }
    if (images.length === 1 && !videos.length && !glbs.length) {
      await trackUpload('avatar', 'Аватар', (p) => uploadHouseAvatar(selectedId, images[0], p))
    } else if (images.length) {
      await uploadPhotos(images)
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    try {
      const { access_token } = await login(username, password)
      localStorage.setItem('admin_token', access_token)
      setLoggedIn(true)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-gold/25 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20'

  return (
    <div className="min-h-screen bg-[#e8e4dc] text-ink">
      <header className="sticky top-0 z-40 border-b border-gold/20 bg-forest shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/20 text-sm font-bold text-gold-light">M</div>
            <div>
              <h1 className="text-base font-semibold text-ivory">Mikov Admin</h1>
              <p className="text-[11px] text-ivory/50">Панель управления</p>
            </div>
          </div>
          {loggedIn && selected && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className={`h-2 w-2 rounded-full ${formPublished ? 'bg-emerald-400' : 'bg-stone/60'}`} />
              <span className="max-w-[200px] truncate text-sm text-ivory/80">{selected.name}</span>
            </div>
          )}
          <Link to="/" className="rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-gold-light hover:bg-gold/10">
            ← Сайт
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 lg:p-6">
        {!loggedIn ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto mt-20 max-w-md overflow-hidden rounded-2xl border border-gold/20 bg-ivory shadow-lg"
          >
            <div className="bg-forest px-6 py-8 text-center">
              <h2 className="font-display text-2xl text-ivory">Вход</h2>
              <p className="mt-1 text-xs text-ivory/50">Админ-панель резиденций</p>
            </div>
            <div className="space-y-4 p-6">
              {loginError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loginError}</p>}
              <label className="block text-sm font-medium text-forest">
                Логин
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} required />
              </label>
              <label className="block text-sm font-medium text-forest">
                Пароль
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-lg bg-forest py-2.5 text-sm font-medium text-ivory hover:bg-forest-light disabled:opacity-50"
              >
                {loginLoading ? 'Вход…' : 'Войти'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="flex flex-col rounded-xl border border-gold/20 bg-ivory shadow-sm lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-6rem)]">
              <div className="border-b border-gold/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone">Дома</span>
                  <button type="button" onClick={() => { localStorage.removeItem('admin_token'); setLoggedIn(false); setHouses([]) }} className="text-xs text-stone hover:text-red-600">
                    Выйти
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      setSaving(true)
                      try {
                        const h = await createHouse({ name: 'Новый проект', is_published: false })
                        await loadHouses()
                        setSelectedId(h.id)
                        setActiveTab('info')
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Create failed')
                      } finally {
                        setSaving(false)
                      }
                    })()
                  }
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest py-2.5 text-sm font-medium text-ivory hover:bg-forest-light disabled:opacity-50"
                >
                  <span className="text-lg leading-none">+</span> Новый дом
                </button>
              </div>

              <ul className="flex-1 space-y-1 overflow-y-auto p-2">
                {loading ? (
                  <li className="p-4 text-center text-sm text-stone">Загрузка…</li>
                ) : houses.length === 0 ? (
                  <li className="p-4 text-center text-sm text-stone">Нет домов</li>
                ) : (
                  houses.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(h.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          selectedId === h.id ? 'bg-forest text-ivory shadow-sm' : 'hover:bg-parchment'
                        }`}
                      >
                        {h.avatar_url ? (
                          <img src={assetUrl(h.avatar_url)} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-gold/20" />
                        ) : (
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs ${selectedId === h.id ? 'bg-ivory/10 text-ivory/50' : 'bg-parchment text-stone'}`}>
                            —
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{h.name}</p>
                          <p className={`truncate text-[10px] ${selectedId === h.id ? 'text-ivory/50' : 'text-stone'}`}>
                            {h.photos.length} фото · {h.videos.length + h.video_links.length} видео
                          </p>
                        </div>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.is_published ? 'bg-emerald-400' : 'bg-stone/40'}`} />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </aside>

            <div className="min-w-0 space-y-4">
              {!selected ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gold/30 bg-ivory/80 p-12 text-center">
                  <p className="text-lg font-medium text-forest">Выберите дом</p>
                  <p className="mt-1 text-sm text-stone">или создайте новый в sidebar</p>
                </div>
              ) : (
                <>
                  <AdminTabs
                    active={activeTab}
                    onChange={setActiveTab}
                    photoCount={selected.photos.length}
                    videoCount={selected.videos.length + selected.video_links.length}
                    hasModel={Boolean(selected.model)}
                  />

                  {uploadLabel && (uploadProgress.photo ?? uploadProgress.video ?? uploadProgress.avatar ?? uploadProgress.model) !== undefined && (
                    <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
                      <p className="text-xs font-medium text-forest">{uploadLabel}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ivory">
                        <div
                          className="h-full rounded-full bg-gold transition-all"
                          style={{ width: `${uploadProgress.photo ?? uploadProgress.video ?? uploadProgress.avatar ?? uploadProgress.model ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'info' && (
                    <>
                      <AdminCard title="Основная информация" description="Название, локация, публикация">
                        <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          void (async () => {
                            if (!selectedId) return
                            setSaving(true)
                            setError(null)
                            try {
                              await updateHouse(selectedId, {
                                name: formName,
                                description: formDescription,
                                location: formLocation,
                                area_sqm: formArea ? parseInt(formArea, 10) : null,
                                is_published: formPublished,
                                ...formSpecs,
                              })
                              await loadHouses()
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Save failed')
                            } finally {
                              setSaving(false)
                            }
                          })()
                        }}
                        className="grid gap-4 sm:grid-cols-2"
                      >
                        <label className="text-sm font-medium text-forest sm:col-span-2">
                          Название
                          <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} required />
                        </label>
                        <label className="text-sm font-medium text-forest">
                          Локация
                          <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className={inputClass} placeholder="МО, Одинцово" />
                        </label>
                        <label className="text-sm font-medium text-forest">
                          Площадь, м²
                          <input type="number" value={formArea} onChange={(e) => setFormArea(e.target.value)} className={inputClass} />
                        </label>
                        <label className="text-sm font-medium text-forest sm:col-span-2">
                          Описание
                          <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={4} className={inputClass} />
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gold/20 bg-parchment/30 px-4 py-3 sm:col-span-2">
                          <input type="checkbox" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} className="h-4 w-4 accent-forest" />
                          <span>
                            <span className="block text-sm font-medium text-forest">Опубликован на сайте</span>
                            <span className="text-xs text-stone">Виден в разделе «Резиденции»</span>
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <button type="submit" disabled={saving} className="rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-ivory hover:bg-forest-light disabled:opacity-50">
                            {saving ? 'Сохранение…' : 'Сохранить'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`Удалить «${selected.name}» и все файлы?`)) return
                              void deleteHouse(selected.id).then(loadHouses)
                            }}
                            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm text-red-700 hover:bg-red-50"
                          >
                            Удалить дом
                          </button>
                        </div>
                      </form>
                    </AdminCard>
                    <HouseSpecsForm
                      specs={formSpecs}
                      onPatch={(patch) => setFormSpecs((prev) => ({ ...prev, ...patch }))}
                      inputClass={inputClass}
                    />
                    </>
                  )}

                  {activeTab === 'media' && (
                    <div className="space-y-4">
                      <AdminCard
                        title="Быстрая загрузка"
                        description="Перетащите файлы — система определит тип"
                        badge="DnD"
                      >
                        <DropZone
                          accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT},.glb`}
                          multiple
                          onFiles={(files) => void handleSmartDrop(files)}
                          label="Универсальная зона"
                          hint="1 фото → аватар. Несколько фото → галерея. Видео / .glb → соответствующий раздел"
                          disabled={!selectedId}
                        />
                      </AdminCard>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <AdminCard title="Аватар" badge={selected.avatar_url ? '✓' : '—'}>
                          <div className="mb-4 flex justify-center">
                            {selected.avatar_url ? (
                              <button type="button" onClick={() => setPreview({ type: 'photo', photos: [{ src: selected.avatar_url!, title: 'Аватар' }], index: 0 })}>
                                <img src={assetUrl(selected.avatar_url)} alt="Аватар" className="h-28 w-28 rounded-xl object-cover ring-2 ring-gold/30 shadow-md" />
                              </button>
                            ) : (
                              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-parchment text-sm text-stone">Нет</div>
                            )}
                          </div>
                          <DropZone
                            variant="compact"
                            accept={IMAGE_ACCEPT}
                            onFiles={(files) => selectedId && void trackUpload('avatar', 'Аватар', (p) => uploadHouseAvatar(selectedId, files[0], p))}
                            label="Загрузить аватар"
                            hint="JPG, PNG, WebP"
                            progress={uploadProgress.avatar ?? null}
                            disabled={!selectedId}
                          />
                          {selected.avatar_url && (
                            <button type="button" onClick={() => void deleteHouseAvatar(selected.id).then(loadHouses)} className="mt-3 text-xs text-red-600 hover:underline">
                              Удалить аватар
                            </button>
                          )}
                        </AdminCard>

                        <AdminCard title="Галерея фото" badge={String(selected.photos.length)}>
                          <DropZone
                            variant="compact"
                            accept={IMAGE_ACCEPT}
                            multiple
                            onFiles={(files) => void uploadPhotos(files)}
                            label="Добавить фото"
                            hint="Можно несколько сразу"
                            progress={uploadProgress.photo ?? null}
                            disabled={!selectedId}
                          />
                        </AdminCard>
                      </div>

                      {selected.photos.length > 0 && (
                        <AdminCard title="Загруженные фото">
                          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {selected.photos.map((photo) => (
                              <div key={photo.id} className="group overflow-hidden rounded-lg border border-gold/15 bg-parchment shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreview({
                                      type: 'photo',
                                      photos: selected.photos.map((p) => ({ src: p.url, title: p.alt_text })),
                                      index: selected.photos.findIndex((p) => p.id === photo.id),
                                    })
                                  }
                                  className="block w-full"
                                >
                                  <img src={assetUrl(photo.url)} alt={photo.alt_text} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                                </button>
                                <div className="flex items-center justify-between gap-1 border-t border-gold/10 px-2 py-1.5">
                                  <span className="truncate text-[10px] text-stone">{photo.original_filename}</span>
                                  <button type="button" onClick={() => void deleteHousePhoto(selected.id, photo.id).then(loadHouses)} className="rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50">
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AdminCard>
                      )}

                      <AdminCard title="Видео" badge={String(selected.videos.length + selected.video_links.length)}>
                        <DropZone
                          accept={VIDEO_ACCEPT}
                          multiple
                          onFiles={(files) => {
                            if (!selectedId) return
                            void (async () => {
                              for (let i = 0; i < files.length; i++) {
                                await trackUpload('video', `Видео ${i + 1} из ${files.length}`, (p) =>
                                  uploadHouseVideo(selectedId, files[i], files[i].name, p),
                                )
                              }
                            })()
                          }}
                          label="Загрузить видеофайл"
                          hint="MP4, WebM, MOV, MKV"
                          progress={uploadProgress.video ?? null}
                          disabled={!selectedId}
                        />

                        <form
                          className="mt-5 flex flex-wrap gap-2 border-t border-gold/10 pt-5"
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedId || !videoLinkUrl.trim()) return
                            void addHouseVideoLink(selectedId, videoLinkUrl.trim(), videoLinkTitle || formName)
                              .then(() => {
                                setVideoLinkUrl('')
                                setVideoLinkTitle('')
                                return loadHouses()
                              })
                              .catch((err) => setError(err instanceof Error ? err.message : 'Link failed'))
                          }}
                        >
                          <input value={videoLinkUrl} onChange={(e) => setVideoLinkUrl(e.target.value)} placeholder="YouTube / Rutube / VK" className={`${inputClass} mt-0 min-w-[200px] flex-1`} required />
                          <input value={videoLinkTitle} onChange={(e) => setVideoLinkTitle(e.target.value)} placeholder="Название" className={`${inputClass} mt-0 w-36`} />
                          <button type="submit" className="self-end rounded-lg bg-gold/25 px-4 py-2.5 text-sm font-medium text-forest hover:bg-gold/35">
                            + Ссылка
                          </button>
                        </form>

                        {(selected.videos.length > 0 || selected.video_links.length > 0) && (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {selected.videos.map((video) => (
                              <div key={video.id} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-parchment/50 p-3">
                                <button type="button" onClick={() => setPreview({ type: 'video', src: video.url, title: video.title })} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-forest text-ivory">▶</button>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{video.title || video.original_filename}</p>
                                  <p className="text-[10px] text-stone">{formatBytes(video.file_size_bytes)}</p>
                                </div>
                                <button type="button" onClick={() => void deleteHouseVideo(selected.id, video.id).then(loadHouses)} className="text-xs text-red-600">✕</button>
                              </div>
                            ))}
                            {selected.video_links.map((link) => (
                              <div key={link.id} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-parchment/50 p-3">
                                {link.embed_url ? (
                                  <button type="button" onClick={() => setPreview({ type: 'embed', src: link.embed_url!, title: link.title })} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-forest text-ivory">▶</button>
                                ) : (
                                  <a href={link.url} target="_blank" rel="noreferrer" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-xs text-gold">↗</a>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] uppercase text-gold-muted">{platformLabel(link.platform)}</p>
                                  <p className="truncate text-sm">{link.title || link.url}</p>
                                </div>
                                <button type="button" onClick={() => void deleteHouseVideoLink(selected.id, link.id).then(loadHouses)} className="text-xs text-red-600">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </AdminCard>
                    </div>
                  )}

                  {activeTab === 'model' && (
                    <AdminCard title="3D модель" description="Формат GLB для интерактивного просмотра" badge={selected.model ? '✓' : '—'}>
                      {selected.model ? (
                        <>
                          <div className="mb-4 flex items-center gap-4 rounded-lg border border-gold/20 bg-parchment/50 p-4">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-forest">{selected.model.original_filename}</p>
                              <p className="text-xs text-stone">{formatBytes(selected.model.file_size_bytes)}</p>
                            </div>
                            <button type="button" onClick={() => void deleteHouseModel(selected.id).then(loadHouses)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">
                              Удалить
                            </button>
                          </div>
                          <ModelViewer
                            glb={assetUrl(selected.model.url)}
                            variant="full"
                            title={selected.name}
                            className="mb-4 h-[min(70vh,560px)] border border-gold/20"
                          />
                        </>
                      ) : (
                        <p className="mb-4 text-sm text-stone">Модель не загружена</p>
                      )}
                      <DropZone
                        accept=".glb,model/gltf-binary"
                        onFiles={(files) => selectedId && void trackUpload('model', '3D модель', (p) => uploadHouseModel(selectedId, files[0], p))}
                        label="Загрузить .glb"
                        hint="Перетащите 3D модель дома"
                        progress={uploadProgress.model ?? null}
                        disabled={!selectedId}
                      />
                    </AdminCard>
                  )}
                </>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="font-medium">Ошибка:</span> {error}
                  <button type="button" onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {preview?.type === 'photo' && (
        <MediaPreview
          type="photo"
          src={preview.photos[preview.index].src}
          title={preview.photos[preview.index].title}
          photos={preview.photos}
          photoIndex={preview.index}
          onPhotoChange={(index) => setPreview({ ...preview, index })}
          onClose={() => setPreview(null)}
        />
      )}
      {preview && preview.type !== 'photo' && (
        <MediaPreview type={preview.type} src={preview.src} title={preview.title} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

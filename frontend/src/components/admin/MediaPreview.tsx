import { useEffect } from 'react'
import { assetUrl } from '../../api/client'
import { VideoPlayer } from '../video/VideoPlayer'

export type PhotoSlide = {
  src: string
  title: string
}

type MediaPreviewProps = {
  type: 'photo' | 'video' | 'embed'
  src: string
  title?: string
  onClose: () => void
  photos?: PhotoSlide[]
  photoIndex?: number
  onPhotoChange?: (index: number) => void
}

export function MediaPreview({
  type,
  src,
  title,
  onClose,
  photos,
  photoIndex = 0,
  onPhotoChange,
}: MediaPreviewProps) {
  const gallery = type === 'photo' && photos && photos.length > 1
  const currentPhoto = gallery ? photos[photoIndex] : { src, title: title ?? '' }
  const displaySrc = type === 'embed' ? src : assetUrl(gallery ? currentPhoto.src : src)
  const displayTitle = gallery ? currentPhoto.title : title

  const goPrev = () => {
    if (!gallery || !onPhotoChange) return
    onPhotoChange((photoIndex - 1 + photos.length) % photos.length)
  }

  const goNext = () => {
    if (!gallery || !onPhotoChange) return
    onPhotoChange((photoIndex + 1) % photos.length)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (type === 'photo' && gallery && onPhotoChange && photos) {
        if (e.key === 'ArrowLeft') onPhotoChange((photoIndex - 1 + photos.length) % photos.length)
        if (e.key === 'ArrowRight') onPhotoChange((photoIndex + 1) % photos.length)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [type, gallery, onClose, onPhotoChange, photoIndex, photos])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-5xl rounded-lg bg-ivory p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-forest">{displayTitle ?? 'Просмотр'}</p>
            {gallery && (
              <p className="text-xs text-stone">
                {photoIndex + 1} / {photos.length}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded px-3 py-1 text-sm text-stone hover:bg-parchment">
            Закрыть
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          {gallery && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-forest/80 text-lg text-ivory hover:bg-forest"
              aria-label="Предыдущее фото"
            >
              ←
            </button>
          )}

          {type === 'photo' && (
            <img
              src={displaySrc}
              alt={displayTitle ?? ''}
              className="mx-auto max-h-[75vh] max-w-full object-contain px-12"
            />
          )}
          {type === 'video' && (
            <VideoPlayer src={displaySrc} title={displayTitle} theater className="mx-auto max-h-[75vh] w-full" />
          )}
          {type === 'embed' && (
            <iframe src={displaySrc} title={displayTitle ?? 'video'} className="aspect-video w-full rounded" allowFullScreen />
          )}

          {gallery && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-forest/80 text-lg text-ivory hover:bg-forest"
              aria-label="Следующее фото"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  assetUrl,
  fetchHouse,
  platformLabel,
  type House,
  type HouseVideo,
  type HouseVideoLink,
} from '../api/client'
import { ModelViewer, preloadGlb } from '../components/ModelViewer'
import { buildListingTitle, HouseSpecsDisplay } from '../components/house/HouseSpecsDisplay'
import { MortgageCalculator, pricePerSqm } from '../components/house/MortgageCalculator'
import { MediaPreview, type PhotoSlide } from '../components/admin/MediaPreview'
import { Reveal } from '../components/motion/Reveal'
import { VideoPlayer } from '../components/video/VideoPlayer'

type VideoItem =
  | { kind: 'file'; data: HouseVideo }
  | { kind: 'link'; data: HouseVideoLink }

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [house, setHouse] = useState<House | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)

  const videoItems: VideoItem[] = useMemo(() => {
    if (!house) return []
    return [
      ...house.videos.map((v) => ({ kind: 'file' as const, data: v })),
      ...house.video_links.map((l) => ({ kind: 'link' as const, data: l })),
    ]
  }, [house])

  const photoSlides: PhotoSlide[] = useMemo(
    () => house?.photos.map((p) => ({ src: p.url, title: p.alt_text || house.name })) ?? [],
    [house],
  )

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchHouse(id)
        if (cancelled) return
        if (data.model) preloadGlb(assetUrl(data.model.url))
        setHouse(data)
        setHeroIndex(0)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-ivory">
        <p className="text-stone">Загрузка…</p>
      </main>
    )
  }

  if (error || !house) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ivory px-6">
        <p className="text-red-600">{error ?? 'Проект не найден'}</p>
        <Link to="/#portfolio" className="text-sm tracking-widest text-gold uppercase hover:underline">
          ← К резиденциям
        </Link>
      </main>
    )
  }

  const sqmPrice = pricePerSqm(house.price_rub, house.area_sqm)
  const listingTitle = buildListingTitle(house)
  const heroPhoto = house.photos[heroIndex]

  return (
    <main className="bg-ivory text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Reveal>
          <Link
            to="/#portfolio"
            className="mb-4 inline-block text-[10px] tracking-[0.2em] text-gold-muted uppercase transition-colors hover:text-gold"
          >
            ← Все резиденции
          </Link>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main column */}
          <div className="min-w-0 space-y-8">
            <Reveal delay={80}>
            <header>
              <h1 className="font-display text-2xl font-medium leading-snug md:text-3xl">{listingTitle}</h1>
              {house.name !== listingTitle && (
                <p className="mt-1 text-sm text-stone">{house.name}</p>
              )}
            </header>
            </Reveal>

            {house.photos.length > 0 && (
              <Reveal delay={140}>
              <section className="overflow-hidden rounded-xl border border-gold/15 bg-white">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(heroIndex)}
                  className="group block w-full overflow-hidden"
                >
                  <img
                    src={assetUrl(heroPhoto.url)}
                    alt={heroPhoto.alt_text || house.name}
                    className="om-image-pan aspect-[4/3] w-full object-cover md:aspect-[16/10]"
                  />
                </button>
                {house.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-gold/10 p-3">
                    {house.photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition ${
                          index === heroIndex ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={assetUrl(photo.url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
              </Reveal>
            )}

            <Reveal delay={180}>
            <HouseSpecsDisplay house={house} />
            </Reveal>

            {videoItems.length > 0 && (
              <Reveal delay={220}>
              <section>
                <h2 className="mb-4 font-display text-xl text-forest">Видео</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {videoItems.map((item) => {
                    if (item.kind === 'file') {
                      return (
                        <div key={item.data.id} className="overflow-hidden rounded-xl border border-gold/15 bg-black">
                          <VideoPlayer
                            src={assetUrl(item.data.url)}
                            title={item.data.title || house.name}
                            className="w-full"
                          />
                        </div>
                      )
                    }
                    if (item.data.embed_url) {
                      return (
                        <div key={item.data.id} className="overflow-hidden rounded-xl border border-gold/15">
                          <iframe
                            src={item.data.embed_url}
                            title={item.data.title || platformLabel(item.data.platform)}
                            className="aspect-video w-full bg-ink"
                            allowFullScreen
                          />
                        </div>
                      )
                    }
                    return (
                      <a
                        key={item.data.id}
                        href={item.data.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex aspect-video items-center justify-center rounded-xl border border-gold/15 bg-parchment/50 text-sm text-gold"
                      >
                        {item.data.title || item.data.url}
                      </a>
                    )
                  })}
                </div>
              </section>
              </Reveal>
            )}

            {house.model && (
              <Reveal delay={260}>
              <section>
                <h2 className="mb-2 font-display text-xl text-forest">3D модель</h2>
                <p className="mb-4 text-sm text-stone">Интерактивный просмотр — вращение, масштаб, режим полёта</p>
                <ModelViewer
                  glb={assetUrl(house.model.url)}
                  variant="full"
                  title={house.name}
                  className="h-[min(70vh,560px)] border border-gold/20"
                />
              </section>
              </Reveal>
            )}
          </div>

          {/* Sticky sidebar */}
          <Reveal delay={160}>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-4 rounded-xl border border-gold/20 bg-white p-5 shadow-sm">
              {house.price_rub != null && house.price_rub > 0 ? (
                <>
                  <div>
                    <p className="font-display text-3xl font-medium text-forest">
                      {house.price_rub.toLocaleString('ru-RU')} ₽
                    </p>
                    {sqmPrice != null && (
                      <p className="mt-1 text-sm text-stone">
                        {sqmPrice.toLocaleString('ru-RU')} ₽ за м²
                      </p>
                    )}
                  </div>
                  {house.is_mortgage_available && (
                    <p className="text-xs text-stone">Ипотека возможна</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone">Цена по запросу</p>
              )}

              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-gold">
                {house.model && <span className="rounded border border-gold/40 px-2 py-0.5">3D</span>}
                {videoItems.length > 0 && <span className="rounded border border-gold/40 px-2 py-0.5">Video</span>}
                {house.photos.length > 0 && (
                  <span className="rounded border border-gold/40 px-2 py-0.5">{house.photos.length} фото</span>
                )}
              </div>
            </div>

            {house.price_rub != null && house.price_rub > 0 && (
              <div className="mt-4">
                <MortgageCalculator priceRub={house.price_rub} />
              </div>
            )}
          </aside>
          </Reveal>
        </div>
      </div>

      {lightboxIndex !== null && photoSlides.length > 0 && (
        <MediaPreview
          type="photo"
          src={photoSlides[lightboxIndex].src}
          title={photoSlides[lightboxIndex].title}
          photos={photoSlides}
          photoIndex={lightboxIndex}
          onPhotoChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  )
}

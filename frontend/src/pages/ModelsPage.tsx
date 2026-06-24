import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { assetUrl, fetchHouses, type HouseListItem } from '../api/client'
import { LazyModelViewer } from '../components/viewer/LazyModelViewer'
import { ModelViewer } from '../components/ModelViewer'
import { Reveal } from '../components/motion/Reveal'
import { Section } from '../components/layout/Section'

export function ModelsPage() {
  const [entries, setEntries] = useState<HouseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<HouseListItem | null>(null)
  const [previewEpoch, setPreviewEpoch] = useState<Record<string, number>>({})
  const expandedRef = useRef<HouseListItem | null>(null)
  expandedRef.current = expanded
  const previewPointerRef = useRef<{ x: number; y: number; houseId: string } | null>(null)
  const PREVIEW_DRAG_THRESHOLD_PX = 5

  const openExpanded = useCallback((house: HouseListItem) => {
    setExpanded(house)
  }, [])

  const closeExpanded = useCallback(() => {
    const houseId = expandedRef.current?.id
    setExpanded(null)
    if (houseId) {
      setPreviewEpoch((epochs) => ({ ...epochs, [houseId]: (epochs[houseId] ?? 0) + 1 }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchHouses()
        if (!cancelled) setEntries(list.filter((h) => h.has_model && h.model_url))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExpanded()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded, closeExpanded])

  return (
    <>
      <Section id="models" title="3D проекты" subtitle="Интерактивные модели всех резиденций">
        {loading ? (
          <p className="text-center text-stone">Загрузка…</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-stone">3D модели скоро появятся</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((house, index) => (
              <Reveal key={house.id} delay={index * 100}>
              <article className="om-lift group flex flex-col border border-gold/20 bg-parchment/20">
                <div
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) => {
                    previewPointerRef.current = { x: e.clientX, y: e.clientY, houseId: house.id }
                  }}
                  onClick={(e) => {
                    const start = previewPointerRef.current
                    previewPointerRef.current = null
                    const dragPx =
                      start && start.houseId === house.id
                        ? Math.hypot(e.clientX - start.x, e.clientY - start.y)
                        : 0
                    if (dragPx > PREVIEW_DRAG_THRESHOLD_PX) return
                    openExpanded(house)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openExpanded(house)
                    }
                  }}
                  className="relative block w-full cursor-pointer overflow-hidden text-left"
                  aria-label={`Открыть 3D: ${house.name}`}
                >
                  {expanded?.id === house.id ? (
                    <div
                      className="aspect-[4/3] w-full bg-[radial-gradient(ellipse_at_center,#5a5a5a_0%,#353535_50%,#222_100%)]"
                      aria-hidden
                    />
                  ) : (
                    <LazyModelViewer
                      key={`${house.id}-${previewEpoch[house.id] ?? 0}`}
                      glb={assetUrl(house.model_url!)}
                      variant="compact"
                      title={house.name}
                      className="aspect-[4/3] w-full"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-forest/0 transition group-hover:bg-forest/10" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {house.location && (
                    <p className="text-[10px] tracking-[0.2em] text-gold uppercase">{house.location}</p>
                  )}
                  <h3 className="font-display text-xl text-forest">{house.name}</h3>
                  {house.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-stone">{house.description}</p>
                  )}
                  <div className="mt-auto flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openExpanded(house)}
                      className="text-[10px] tracking-[0.15em] text-gold uppercase hover:underline"
                    >
                      Развернуть
                    </button>
                    <Link
                      to={`/houses/${house.id}`}
                      className="text-[10px] tracking-[0.15em] text-stone uppercase hover:text-gold"
                    >
                      Подробнее →
                    </Link>
                  </div>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      {expanded?.model_url && (
        <div className="om-modal-enter fixed inset-0 z-[100] flex flex-col bg-forest/98" role="dialog" aria-modal="true">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gold/15 px-6 py-4">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.2em] text-gold uppercase">{expanded.location || '3D'}</p>
              <h3 className="truncate font-display text-2xl text-ivory">{expanded.name}</h3>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/houses/${expanded.id}`}
                className="border border-gold/40 px-3 py-1.5 text-[10px] text-gold uppercase hover:bg-gold/10"
              >
                Проект
              </Link>
              <button
                type="button"
                onClick={closeExpanded}
                className="border border-ivory/20 px-3 py-1.5 text-[10px] text-ivory/70 uppercase"
              >
                Закрыть
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <ModelViewer
              glb={assetUrl(expanded.model_url)}
              variant="full"
              title={expanded.name}
              className="h-full min-h-[60vh] border border-gold/20"
            />
          </div>
        </div>
      )}
    </>
  )
}

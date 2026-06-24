import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { assetUrl, fetchHouses, type HouseListItem } from '../api/client'
import { Reveal } from './motion/Reveal'
import { Section } from './layout/Section'

export function HousePortfolio() {
  const [houses, setHouses] = useState<HouseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchHouses()
        if (!cancelled) setHouses(data)
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

  return (
    <Section id="portfolio" title="Резиденции" subtitle="Реализованные объекты и проекты в работе" dark>
      {loading ? (
        <p className="text-center text-ivory/50">Загрузка…</p>
      ) : error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : houses.length === 0 ? (
        <p className="text-center text-ivory/50">Проекты скоро появятся</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house, index) => (
            <Reveal key={house.id} delay={index * 100}>
              <Link to={`/houses/${house.id}`} className="group block">
                <article className="om-lift relative overflow-hidden border border-gold/20 bg-forest-light">
                  {house.cover_url ? (
                    <img
                      src={assetUrl(house.cover_url)}
                      alt={house.name}
                      loading="lazy"
                      className="om-image-pan aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-forest-light text-ivory/30">
                      <span className="font-display text-lg italic">Нет фото</span>
                    </div>
                  )}
                  <div className="om-overlay-deepen absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-transparent opacity-80" />
                <div className="absolute right-0 bottom-0 left-0 p-6">
                  {house.location && (
                    <p className="mb-1 text-[10px] tracking-[0.2em] text-gold-light uppercase">{house.location}</p>
                  )}
                  <h3 className="font-display text-2xl text-ivory">{house.name}</h3>
                  {house.area_sqm && <p className="mt-1 text-xs text-ivory/50">{house.area_sqm} м²</p>}
                  {house.price_rub != null && house.price_rub > 0 && (
                    <p className="mt-1 text-sm text-gold-light">{house.price_rub.toLocaleString('ru-RU')} ₽</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {house.has_model && (
                      <span className="border border-gold/40 px-2 py-0.5 text-[9px] tracking-[0.15em] text-gold uppercase">3D</span>
                    )}
                    {house.has_videos && (
                      <span className="border border-gold/40 px-2 py-0.5 text-[9px] tracking-[0.15em] text-gold uppercase">Video</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  )
}

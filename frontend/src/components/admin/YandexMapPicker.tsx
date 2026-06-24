import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void
      Map: new (el: HTMLElement, opts: object) => YMap
      Placemark: new (coords: number[], opts?: object, props?: object) => YPlacemark
    }
  }
}

type YMap = {
  geoObjects: { add: (o: YPlacemark) => void }
  setCenter: (coords: number[], zoom?: number) => void
  events: { add: (event: string, cb: (e: { get: (k: string) => number[] }) => void) => void }
  destroy: () => void
}

type YPlacemark = {
  geometry: { setCoordinates: (c: number[]) => void; getCoordinates?: () => number[] }
  events: { add: (event: string, cb: () => void) => void }
}

type YandexMapPickerProps = {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  readOnly?: boolean
  className?: string
}

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined
const DEFAULT_CENTER: [number, number] = [58.0105, 56.2502]

function loadYmaps(): Promise<void> {
  if (window.ymaps) return Promise.resolve()
  if (!API_KEY) return Promise.reject(new Error('no key'))
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`
    script.async = true
    script.onload = () => window.ymaps?.ready(() => resolve())
    script.onerror = () => reject(new Error('ymaps load failed'))
    document.head.appendChild(script)
  })
}

export function YandexMapPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false,
  className = '',
}: YandexMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YMap | null>(null)
  const placemarkRef = useRef<YPlacemark | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!API_KEY) {
      setError('Добавьте VITE_YANDEX_MAPS_API_KEY')
      return
    }
    let cancelled = false
    void loadYmaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.ymaps) return
        const center: [number, number] =
          latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER
        const map = new window.ymaps.Map(containerRef.current, {
          center,
          zoom: latitude != null ? 16 : 10,
          controls: ['zoomControl'],
        })
        mapRef.current = map
        const pm = new window.ymaps.Placemark(center, {}, { draggable: !readOnly })
        placemarkRef.current = pm
        map.geoObjects.add(pm)
        if (!readOnly) {
          pm.events.add('dragend', () => {
            const coords = pm.geometry.getCoordinates?.() ?? center
            onChangeRef.current(coords[0], coords[1])
          })
          map.events.add('click', (e) => {
            const coords = e.get('coords')
            pm.geometry.setCoordinates(coords)
            onChangeRef.current(coords[0], coords[1])
          })
        }
      })
      .catch(() => setError('Не удалось загрузить Яндекс.Карты'))
    return () => {
      cancelled = true
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [readOnly])

  useEffect(() => {
    if (latitude == null || longitude == null || !placemarkRef.current || !mapRef.current) return
    const coords: [number, number] = [latitude, longitude]
    placemarkRef.current.geometry.setCoordinates(coords)
    mapRef.current.setCenter(coords, 16)
  }, [latitude, longitude])

  if (error) {
    return (
      <div
        className={`flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gold/30 bg-parchment/40 p-4 text-center text-sm text-stone ${className}`}
      >
        {error}
      </div>
    )
  }

  return <div ref={containerRef} className={`min-h-[280px] overflow-hidden rounded-lg ${className}`} />
}

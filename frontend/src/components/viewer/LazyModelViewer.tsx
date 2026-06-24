import { useEffect, useRef, useState } from 'react'
import { ModelViewer } from './ModelViewer'
import type { ViewerVariant } from './viewerState'
import { acquireGlbSlot, releaseGlbSlot } from '../../lib/glbLoadQueue'

interface LazyModelViewerProps {
  glb: string
  title?: string
  variant?: ViewerVariant
  className?: string
}

export function LazyModelViewer({
  glb,
  title,
  variant = 'compact',
  className = '',
}: LazyModelViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [canLoad, setCanLoad] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let acquired = false
    let cancelled = false
    void acquireGlbSlot().then(() => {
      if (cancelled) {
        releaseGlbSlot()
        return
      }
      acquired = true
      setCanLoad(true)
    })
    return () => {
      cancelled = true
      if (acquired) {
        releaseGlbSlot()
        setCanLoad(false)
      }
    }
  }, [visible, glb])

  return (
    <div ref={rootRef} className={className}>
      {canLoad ? (
        <ModelViewer glb={glb} variant={variant} title={title} className="h-full w-full" />
      ) : (
        <div className="flex h-full min-h-[12rem] w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,#5a5a5a_0%,#353535_50%,#222_100%)]">
          <span className="text-xs text-white/50">{visible ? 'Загрузка 3D…' : ''}</span>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { clearFlyTouchKeys, setFlyTouchKey } from './flyTouchKeys'

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return coarse
}

function FlyButton({ code, label }: { code: string; label: string }) {
  const bind = (pressed: boolean) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFlyTouchKey(code, pressed)
  }

  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-11 select-none items-center justify-center rounded-full bg-forest/85 text-sm font-semibold text-ivory shadow-lg ring-1 ring-white/20 active:bg-gold active:text-forest touch-none"
      onPointerDown={bind(true)}
      onPointerUp={bind(false)}
      onPointerCancel={bind(false)}
      onPointerLeave={bind(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

export function MobileFlyPad() {
  const coarse = useCoarsePointer()

  useEffect(() => () => clearFlyTouchKeys(), [])

  if (!coarse) return null

  return (
    <div
      className="absolute bottom-4 left-4 z-10 touch-none select-none"
      aria-label="Управление полётом"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <FlyButton code="KeyW" label="W" />
        <div />
        <FlyButton code="KeyA" label="A" />
        <FlyButton code="KeyS" label="S" />
        <FlyButton code="KeyD" label="D" />
        <FlyButton code="KeyQ" label="Q" />
        <div className="h-11 w-11" />
        <FlyButton code="KeyE" label="E" />
      </div>
      <p className="mt-1.5 text-center text-[9px] text-white/50">drag — смотреть</p>
    </div>
  )
}

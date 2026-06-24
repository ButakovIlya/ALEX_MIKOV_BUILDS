import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, ContactShadows, Environment, Grid } from '@react-three/drei'
import { assertGlbUrl } from '../../lib/glb'
import { CameraControls, type CameraControlsHandle } from './CameraControls'
import { GlbLoader, GlbScene } from './GlbScene'
import { MobileFlyPad } from './MobileFlyPad'
import { ViewerToolbar } from './ViewerToolbar'
import { clearFlyTouchKeys } from './flyTouchKeys'
import {
  defaultViewerSettings,
  type ViewerSettings,
  type ViewerVariant,
} from './viewerState'

function LoadedMarker({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}

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

interface ModelViewerProps {
  glb: string
  className?: string
  variant?: ViewerVariant
  title?: string
}

export function ModelViewer({ glb, className = '', variant = 'compact', title }: ModelViewerProps) {
  assertGlbUrl(glb)

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<CameraControlsHandle>(null)
  const [settings, setSettings] = useState<ViewerSettings>(defaultViewerSettings)
  const [fitKey, setFitKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isCoarsePointer = useCoarsePointer()
  const hasFullControls = variant === 'full' || isFullscreen
  const lowPowerControls = isCoarsePointer && (settings.flyMode || settings.autoRotate)
  const effectiveHd = settings.hd && !lowPowerControls
  const effectiveShowShadows = settings.showShadows && !lowPowerControls

  useEffect(() => {
    setLoading(true)
  }, [glb, fitKey])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetView = useCallback(() => {
    setFitKey((k) => k + 1)
    requestAnimationFrame(() => controlsRef.current?.reset())
  }, [])

  const refitView = useCallback(() => {
    setFitKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let lastSize: { w: number; h: number } | null = null
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width < 2 || height < 2) return

      if (!lastSize) {
        lastSize = { w: width, h: height }
        requestAnimationFrame(refitView)
        return
      }

      const dw = Math.abs(width - lastSize.w) / lastSize.w
      const dh = Math.abs(height - lastSize.h) / lastSize.h
      if (dw > 0.08 || dh > 0.08) {
        lastSize = { w: width, h: height }
        requestAnimationFrame(refitView)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [glb, refitView])

  const takeScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${title ?? 'model'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [title])

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen(fs)
      if (!fs) {
        requestAnimationFrame(() => {
          refitView()
          window.setTimeout(() => controlsRef.current?.reset(), 350)
        })
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [refitView])

  useEffect(() => {
    if (!hasFullControls) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const key = e.key.toLowerCase()

      if (settings.flyMode) {
        switch (key) {
          case 'f':
            patchSettings({ flyMode: false })
            break
          case 'r':
            resetView()
            break
          case 'p':
            takeScreenshot()
            break
          case '?':
            setShowHelp((v) => !v)
            break
        }
        return
      }

      switch (key) {
        case 'r':
          resetView()
          break
        case '+':
        case '=':
          controlsRef.current?.zoomIn()
          break
        case '-':
          controlsRef.current?.zoomOut()
          break
        case 'arrowleft':
          controlsRef.current?.rotateLeft()
          break
        case 'arrowright':
          controlsRef.current?.rotateRight()
          break
        case 'arrowup':
          controlsRef.current?.rotateUp()
          break
        case 'arrowdown':
          controlsRef.current?.rotateDown()
          break
        case 'f':
          patchSettings({ flyMode: true, autoRotate: false })
          break
        case ' ':
          e.preventDefault()
          patchSettings({ autoRotate: !settings.autoRotate })
          break
        case 'g':
          patchSettings({ showGrid: !settings.showGrid })
          break
        case 'm':
          patchSettings({ wireframe: !settings.wireframe })
          break
        case 'p':
          takeScreenshot()
          break
        case '?':
          setShowHelp((v) => !v)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasFullControls, resetView, patchSettings, settings.autoRotate, settings.flyMode, takeScreenshot])

  useEffect(() => {
    if (!settings.flyMode) clearFlyTouchKeys()
  }, [settings.flyMode])

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,#5a5a5a_0%,#353535_50%,#222_100%)] ${className}`}
    >
      <Canvas
        shadows={effectiveShowShadows}
        dpr={effectiveHd ? [1, 2] : 1}
        gl={{ preserveDrawingBuffer: true, antialias: effectiveHd }}
        camera={{ position: [4, 3, 5], fov: 45 }}
        className="h-full w-full"
        style={{ touchAction: 'none', userSelect: 'none' }}
        aria-label={`3D view of ${title ?? 'model'}`}
      >
        <ambientLight intensity={settings.ambientIntensity} />
        <directionalLight position={[5, 8, 5]} intensity={settings.directIntensity} castShadow={effectiveShowShadows} />
        <Suspense fallback={<GlbLoader />}>
          <Bounds key={fitKey} fit clip margin={1.15}>
            <Center>
              <GlbScene glb={glb} wireframe={settings.wireframe} />
            </Center>
          </Bounds>
          {!lowPowerControls && <Environment preset={settings.environment} />}
          <LoadedMarker onLoaded={() => setLoading(false)} />
        </Suspense>
        {settings.showGrid && (
          <Grid
            position={[0, -0.01, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            sectionSize={2}
            sectionThickness={1}
            fadeDistance={25}
            fadeStrength={1}
            cellColor="#36454f"
            sectionColor="#8B3A2A"
          />
        )}
        {effectiveShowShadows && (
          <ContactShadows position={[0, -0.01, 0]} opacity={0.45} scale={16} blur={2.5} far={12} />
        )}
        <CameraControls ref={controlsRef} settings={settings} fitKey={fitKey} allowZoom={hasFullControls} />
      </Canvas>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <span className="text-xs text-white/70">Загрузка .glb…</span>
          </div>
        </div>
      )}

      <ViewerToolbar
        variant={variant}
        settings={settings}
        showHelp={showHelp}
        showSettings={showSettings}
        isFullscreen={isFullscreen}
        onPatch={patchSettings}
        onReset={resetView}
        onZoomIn={() => controlsRef.current?.zoomIn()}
        onZoomOut={() => controlsRef.current?.zoomOut()}
        onRotateLeft={() => controlsRef.current?.rotateLeft()}
        onRotateRight={() => controlsRef.current?.rotateRight()}
        onRotateUp={() => controlsRef.current?.rotateUp()}
        onRotateDown={() => controlsRef.current?.rotateDown()}
        onScreenshot={takeScreenshot}
        onToggleFullscreen={toggleFullscreen}
        onToggleHelp={() => {
          setShowHelp((v) => !v)
          setShowSettings(false)
        }}
        onToggleSettings={() => {
          setShowSettings((v) => !v)
          setShowHelp(false)
        }}
      />

      {hasFullControls && settings.flyMode && <MobileFlyPad />}
    </div>
  )
}

export { preloadGlb } from './preload'

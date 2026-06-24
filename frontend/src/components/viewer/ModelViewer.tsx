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

type GlbDownloadState = {
  url: string | null
  loadedBytes: number
  totalBytes: number | null
  error: string | null
}

function useGlbDownload(glb: string): GlbDownloadState {
  const [state, setState] = useState<GlbDownloadState>({
    url: null,
    loadedBytes: 0,
    totalBytes: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | null = null

    setState({ url: null, loadedBytes: 0, totalBytes: null, error: null })

    async function download() {
      try {
        const res = await fetch(glb, { signal: controller.signal })
        if (!res.ok) throw new Error(`GLB download failed: ${res.status}`)

        const totalBytesHeader = res.headers.get('Content-Length')
        const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : null

        if (!res.body) {
          const blob = await res.blob()
          objectUrl = URL.createObjectURL(blob)
          setState({ url: objectUrl, loadedBytes: blob.size, totalBytes: blob.size, error: null })
          return
        }

        const reader = res.body.getReader()
        const chunks: Uint8Array[] = []
        let loadedBytes = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!value) continue
          chunks.push(value)
          loadedBytes += value.byteLength
          setState({ url: null, loadedBytes, totalBytes, error: null })
        }

        const blob = new Blob(chunks, { type: res.headers.get('Content-Type') ?? 'model/gltf-binary' })
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, loadedBytes, totalBytes: totalBytes ?? loadedBytes, error: null })
      } catch (err) {
        if (controller.signal.aborted) return
        setState({
          url: null,
          loadedBytes: 0,
          totalBytes: null,
          error: err instanceof Error ? err.message : 'GLB download failed',
        })
      }
    }

    void download()

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [glb])

  return state
}

interface ModelViewerProps {
  glb: string
  className?: string
  variant?: ViewerVariant
  title?: string
}

export function ModelViewer({ glb, className = '', variant = 'compact', title }: ModelViewerProps) {
  assertGlbUrl(glb)

  const glbDownload = useGlbDownload(glb)
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
  }, [glb])

  useEffect(() => {
    if (!glbDownload.url || !loading) return
    const id = window.setTimeout(() => setLoading(false), 1200)
    return () => window.clearTimeout(id)
  }, [glbDownload.url, loading])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleLoaded = useCallback(() => {
    setLoading(false)
    window.setTimeout(() => controlsRef.current?.reset(), 700)
    window.setTimeout(() => controlsRef.current?.reset(), 1200)
  }, [])

  const resetView = useCallback(() => {
    setFitKey((k) => k + 1)
    requestAnimationFrame(() => controlsRef.current?.reset())
  }, [])

  const refitView = useCallback(() => {
    setFitKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!glbDownload.url) return
    requestAnimationFrame(refitView)
  }, [glbDownload.url, refitView])

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
          <Bounds key={`${fitKey}-${glbDownload.url ?? 'pending'}`} fit clip margin={1.15}>
            <Center>
              {glbDownload.url && <GlbScene glb={glbDownload.url} wireframe={settings.wireframe} />}
            </Center>
          </Bounds>
          {!lowPowerControls && <Environment preset={settings.environment} />}
          <LoadedMarker key={glbDownload.url} onLoaded={handleLoaded} />
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

      {(loading || !glbDownload.url || glbDownload.error) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40">
          <div className="flex w-48 flex-col items-center gap-2">
            {glbDownload.error ? (
              <span className="text-center text-xs text-red-200">{glbDownload.error}</span>
            ) : (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  {glbDownload.totalBytes ? (
                    <div
                      className="h-full rounded-full bg-gold transition-[width]"
                      style={{
                        width: `${Math.min(100, Math.round((glbDownload.loadedBytes / glbDownload.totalBytes) * 100))}%`,
                      }}
                    />
                  ) : (
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-gold" />
                  )}
                </div>
                <span className="text-xs text-white/70">
                  {glbDownload.totalBytes
                    ? `Загрузка .glb ${Math.min(100, Math.round((glbDownload.loadedBytes / glbDownload.totalBytes) * 100))}%`
                    : 'Загрузка .glb…'}
                </span>
              </>
            )}
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

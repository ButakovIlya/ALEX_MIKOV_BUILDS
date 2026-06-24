import { useCallback, useEffect, useRef, useState } from 'react'

const SEEK_STEP_SEC = 5
const DOUBLE_TAP_MS = 320
const CONTROLS_HIDE_MS = 3000

type VideoPlayerProps = {
  src: string
  title?: string
  className?: string
  theater?: boolean
}

type SkipFlash = { side: 'left' | 'right'; seconds: number; key: number }

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const total = Math.floor(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  )
}

function IconSkipBack() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
    </svg>
  )
}

function IconSkipForward() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
    </svg>
  )
}

function IconFullscreen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function IconVolume({ muted, level }: { muted: boolean; level: number }) {
  if (muted || level === 0) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="m16 9 6 6M22 9l-6 6" />
      </svg>
    )
  }
  if (level < 0.5) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
      <path d="M19.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

function useFinePointer() {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const update = () => setFine(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return fine
}

export function VideoPlayer({ src, title, className = '', theater = false }: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<number | null>(null)
  const singleTapTimer = useRef<number | null>(null)
  const lastTapAt = useRef(0)
  const flashKey = useRef(0)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [flash, setFlash] = useState<SkipFlash | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const finePointer = useFinePointer()
  const volumeBeforeMute = useRef(1)

  const showControls = useCallback((autoHide = true) => {
    setControlsVisible(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    if (autoHide && playing) {
      hideTimer.current = window.setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS)
    }
  }, [playing])

  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      await video.play()
      setPlaying(true)
      showControls(true)
    } else {
      video.pause()
      setPlaying(false)
      setControlsVisible(true)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [showControls])

  const seekBy = useCallback(
    (delta: number, side?: 'left' | 'right') => {
      const video = videoRef.current
      if (!video) return
      const next = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta))
      video.currentTime = next
      setCurrent(next)
      if (side) {
        flashKey.current += 1
        setFlash({ side, seconds: SEEK_STEP_SEC, key: flashKey.current })
        window.setTimeout(() => setFlash(null), 700)
      }
      showControls(true)
    },
    [showControls],
  )

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current
    if (!root) return
    if (!document.fullscreenElement) {
      await root.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.muted || video.volume === 0) {
      const next = volumeBeforeMute.current > 0 ? volumeBeforeMute.current : 1
      video.muted = false
      video.volume = next
      setMuted(false)
      setVolume(next)
    } else {
      volumeBeforeMute.current = video.volume
      video.muted = true
      setMuted(true)
    }
    showControls(false)
  }, [showControls])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const next = Number(e.target.value)
    video.volume = next
    video.muted = next === 0
    setVolume(next)
    setMuted(next === 0)
    if (next > 0) volumeBeforeMute.current = next
    showControls(false)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const value = Number(e.target.value)
    video.currentTime = value
    setCurrent(value)
    showControls(true)
  }

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (finePointer || e.pointerType === 'mouse') return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const zone = x / rect.width
      const now = Date.now()

      if (now - lastTapAt.current < DOUBLE_TAP_MS) {
        if (singleTapTimer.current) {
          window.clearTimeout(singleTapTimer.current)
          singleTapTimer.current = null
        }
        lastTapAt.current = 0
        if (zone < 0.35) seekBy(-SEEK_STEP_SEC, 'left')
        else if (zone > 0.65) seekBy(SEEK_STEP_SEC, 'right')
        return
      }

      lastTapAt.current = now
      singleTapTimer.current = window.setTimeout(() => {
        singleTapTimer.current = null
        if (playing) {
          setControlsVisible((v) => !v)
          if (hideTimer.current) window.clearTimeout(hideTimer.current)
        } else {
          void togglePlay()
        }
      }, DOUBLE_TAP_MS)
    },
    [finePointer, playing, seekBy, togglePlay],
  )

  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      if (!finePointer) return
      if (e.detail > 1) return
      rootRef.current?.focus()
      void togglePlay()
    },
    [finePointer, togglePlay],
  )

  const handleVideoDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!finePointer) return
      e.preventDefault()
      rootRef.current?.focus()
      void toggleFullscreen()
    },
    [finePointer, toggleFullscreen],
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (!finePointer) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (!root.contains(document.activeElement) && document.fullscreenElement !== root) return

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          void togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekBy(-SEEK_STEP_SEC, 'left')
          break
        case 'ArrowRight':
          e.preventDefault()
          seekBy(SEEK_STEP_SEC, 'right')
          break
        case 'f':
        case 'F':
          e.preventDefault()
          void toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [finePointer, seekBy, toggleFullscreen, toggleMute, togglePlay])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current)
    }
  }, [])

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label={title ? `Видео: ${title}` : 'Видеоплеер'}
      className={`group relative overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${theater ? 'h-full w-full' : ''} ${className}`}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={src}
        title={title}
        playsInline
        preload="metadata"
        className={`block w-full ${theater ? 'h-full object-contain' : 'aspect-video object-contain'}`}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime)
          const buf = e.currentTarget.buffered
          if (buf.length > 0) setBuffered(buf.end(buf.length - 1))
        }}
        onPlay={() => {
          setPlaying(true)
          showControls(true)
        }}
        onPause={() => {
          setPlaying(false)
          setControlsVisible(true)
        }}
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
      />

      {flash && (
        <div
          key={flash.key}
          className={`pointer-events-none absolute inset-y-0 flex w-2/5 items-center justify-center ${
            flash.side === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="animate-pulse rounded-full bg-black/50 px-5 py-4 text-center text-white backdrop-blur-sm">
            <p className="text-2xl font-bold">{flash.side === 'left' ? '↺' : '↻'}</p>
            <p className="text-sm font-semibold">{flash.seconds} сек</p>
          </div>
        </div>
      )}

      {!playing && (
        <button
          type="button"
          onPointerUp={(e) => e.stopPropagation()}
          onClick={() => {
            rootRef.current?.focus()
            void togglePlay()
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/25"
          aria-label="Воспроизвести"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white ring-2 ring-white/30">
            <IconPlay />
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10 transition-opacity duration-200 ${
          controlsVisible || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-2 h-1.5 w-full rounded-full bg-white/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/35"
            style={{ width: `${bufferProgress}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-red-600"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={handleScrub}
            aria-label="Прогресс"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <div className="flex items-center gap-2 text-white sm:gap-3">
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
            aria-label={playing ? 'Пауза' : 'Воспроизвести'}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          {finePointer && (
            <>
              <button
                type="button"
                onClick={() => seekBy(-SEEK_STEP_SEC, 'left')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Назад 5 сек"
              >
                <IconSkipBack />
              </button>
              <button
                type="button"
                onClick={() => seekBy(SEEK_STEP_SEC, 'right')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Вперёд 5 сек"
              >
                <IconSkipForward />
              </button>
            </>
          )}

          <span className="min-w-0 flex-1 truncate text-xs tabular-nums text-white/90">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          {finePointer && (
            <div className="group/vol flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
                aria-label={muted || volume === 0 ? 'Включить звук' : 'Выключить звук'}
              >
                <IconVolume muted={muted || volume === 0} level={volume} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Громкость"
                className="h-1 w-0 cursor-pointer accent-white opacity-0 transition-all group-hover/vol:w-20 group-hover/vol:opacity-100 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
            aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
          >
            <IconFullscreen />
          </button>
        </div>
      </div>
    </div>
  )
}

import { type DragEvent, type ReactNode, useCallback, useId, useRef, useState } from 'react'
import { UploadProgress } from './UploadProgress'

type DropZoneProps = {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label: string
  hint?: string
  disabled?: boolean
  progress?: number | null
  progressLabel?: string
  variant?: 'default' | 'compact' | 'avatar'
  children?: ReactNode
}

export function DropZone({
  accept,
  multiple = false,
  onFiles,
  label,
  hint,
  disabled = false,
  progress = null,
  progressLabel,
  variant = 'default',
  children,
}: DropZoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)

  const pickFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return
      const files = Array.from(fileList)
      onFiles(multiple ? files : files.slice(0, 1))
    },
    [disabled, multiple, onFiles],
  )

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    dragDepth.current += 1
    setDragging(true)
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current -= 1
    if (dragDepth.current <= 0) {
      dragDepth.current = 0
      setDragging(false)
    }
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    pickFiles(e.dataTransfer.files)
  }

  const heightClass =
    variant === 'avatar' ? 'min-h-[120px]' : variant === 'compact' ? 'min-h-[100px]' : 'min-h-[140px]'

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all ${heightClass} ${
          disabled
            ? 'cursor-not-allowed border-gold/15 bg-parchment/50 opacity-60'
            : dragging
              ? 'border-gold bg-gold/15 scale-[1.01] shadow-inner'
              : 'border-gold/30 bg-parchment/30 hover:border-gold/50 hover:bg-gold/5'
        }`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            pickFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {children ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">{children}</div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg text-gold">↑</span>
            <p className="text-sm font-medium text-forest">{label}</p>
            {hint && <p className="max-w-xs text-xs text-stone">{hint}</p>}
            <p className="text-[10px] uppercase tracking-wide text-gold-muted">Перетащите или нажмите</p>
          </div>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-gold/10">
            <span className="rounded-full bg-forest px-4 py-2 text-sm text-ivory">Отпустите файл</span>
          </div>
        )}
      </div>

      {progress !== null && progress !== undefined && (
        <UploadProgress label={progressLabel ?? label} percent={progress} />
      )}
    </div>
  )
}

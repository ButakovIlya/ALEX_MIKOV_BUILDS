import type { ReactNode } from 'react'
import type { EnvironmentPreset, ViewerSettings, ViewerVariant } from './viewerState'

interface ViewerToolbarProps {
  variant: ViewerVariant
  settings: ViewerSettings
  showHelp: boolean
  showSettings: boolean
  isFullscreen: boolean
  onPatch: (patch: Partial<ViewerSettings>) => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onRotateUp: () => void
  onRotateDown: () => void
  onScreenshot: () => void
  onToggleFullscreen: () => void
  onToggleHelp: () => void
  onToggleSettings: () => void
}

function IconButton({
  children,
  active,
  onClick,
  title,
}: {
  children: ReactNode
  active?: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-1 transition ${
        active
          ? 'bg-gold text-forest ring-gold/50'
          : 'bg-forest/90 text-ivory ring-white/15 hover:bg-forest-light'
      }`}
    >
      {children}
    </button>
  )
}

const ENV_OPTIONS: { value: EnvironmentPreset; label: string }[] = [
  { value: 'city', label: 'Город' },
  { value: 'sunset', label: 'Закат' },
  { value: 'dawn', label: 'Рассвет' },
  { value: 'warehouse', label: 'Студия' },
  { value: 'park', label: 'Парк' },
  { value: 'studio', label: 'Свет' },
]

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 4.5 1.5c-.8.8-1.5 1.2-1.5 2.5" />
      <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  )
}

function RotateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3M21 16v3a2 2 0 0 1-2 2h-3" />
    </svg>
  )
}

function SpeedSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-ivory/70">
        <span>{label}</span>
        <span className="tabular-nums text-ivory/50">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
    </label>
  )
}

function SettingsPanel({
  settings,
  onPatch,
  onReset,
  onZoomIn,
  onZoomOut,
}: Pick<ViewerToolbarProps, 'settings' | 'onPatch' | 'onReset' | 'onZoomIn' | 'onZoomOut'>) {
  return (
    <div className="rounded-xl border border-white/10 bg-forest/95 text-xs text-ivory shadow-xl">
      <p className="sticky top-0 z-10 border-b border-white/10 bg-forest/95 px-3 py-2 font-semibold">Настройки</p>
      <div className="space-y-2 p-3 pt-2">
        <label className="flex items-center justify-between gap-2">
          <span>Режим полёта</span>
          <input
            type="checkbox"
            checked={settings.flyMode}
            onChange={(e) => onPatch({ flyMode: e.target.checked, autoRotate: false })}
            className="accent-gold"
          />
        </label>

        <p className="border-t border-white/10 pt-2 font-medium text-ivory/80">FLY</p>
        <SpeedSlider
          label="WASD скорость"
          value={settings.flyMoveSpeed}
          min={50}
          max={1500}
          step={10}
          format={(v) => String(Math.round(v))}
          onChange={(flyMoveSpeed) => onPatch({ flyMoveSpeed })}
        />
        <SpeedSlider
          label="Мышь FLY"
          value={settings.flyLookSensitivity}
          min={0.0005}
          max={0.015}
          step={0.0001}
          format={(v) => v.toFixed(4)}
          onChange={(flyLookSensitivity) => onPatch({ flyLookSensitivity })}
        />

        <p className="border-t border-white/10 pt-2 font-medium text-ivory/80">Orbit</p>
        <SpeedSlider
          label="Вращение"
          value={settings.orbitRotateSpeed}
          min={0.1}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(orbitRotateSpeed) => onPatch({ orbitRotateSpeed })}
        />
        <SpeedSlider
          label="Пан"
          value={settings.orbitPanSpeed}
          min={0.1}
          max={5}
          step={0.1}
          format={(v) => v.toFixed(1)}
          onChange={(orbitPanSpeed) => onPatch({ orbitPanSpeed })}
        />
        <SpeedSlider
          label="Зум"
          value={settings.orbitZoomSpeed}
          min={0.1}
          max={5}
          step={0.1}
          format={(v) => v.toFixed(1)}
          onChange={(orbitZoomSpeed) => onPatch({ orbitZoomSpeed })}
        />
        <SpeedSlider
          label="Авто-вращение"
          value={settings.autoRotateSpeed}
          min={0.2}
          max={5}
          step={0.1}
          format={(v) => v.toFixed(1)}
          onChange={(autoRotateSpeed) => onPatch({ autoRotateSpeed })}
        />

        <p className="border-t border-white/10 pt-2 font-medium text-ivory/80">Вид</p>
        <label className="flex items-center justify-between gap-2">
          <span>Сетка</span>
          <input
            type="checkbox"
            checked={settings.showGrid}
            onChange={(e) => onPatch({ showGrid: e.target.checked })}
            className="accent-gold"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Каркас</span>
          <input
            type="checkbox"
            checked={settings.wireframe}
            onChange={(e) => onPatch({ wireframe: e.target.checked })}
            className="accent-gold"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Тени</span>
          <input
            type="checkbox"
            checked={settings.showShadows}
            onChange={(e) => onPatch({ showShadows: e.target.checked })}
            className="accent-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-ivory/70">Окружение</span>
          <select
            value={settings.environment}
            onChange={(e) => onPatch({ environment: e.target.value as EnvironmentPreset })}
            className="w-full rounded border border-white/15 bg-ink px-2 py-1.5 text-ivory"
          >
            {ENV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-ivory/70">Ambient {settings.ambientIntensity.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={settings.ambientIntensity}
            onChange={(e) => onPatch({ ambientIntensity: Number(e.target.value) })}
            className="w-full accent-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-ivory/70">Sun {settings.directIntensity.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={settings.directIntensity}
            onChange={(e) => onPatch({ directIntensity: Number(e.target.value) })}
            className="w-full accent-gold"
          />
        </label>
        <div className="flex gap-1 pt-1">
          <button type="button" onClick={onZoomOut} className="flex-1 rounded bg-white/10 py-1.5 hover:bg-white/15">
            −
          </button>
          <button type="button" onClick={onReset} className="flex-1 rounded bg-white/10 py-1.5 hover:bg-white/15">
            Сброс
          </button>
          <button type="button" onClick={onZoomIn} className="flex-1 rounded bg-white/10 py-1.5 hover:bg-white/15">
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => onPatch({ hd: !settings.hd })}
          className={`w-full rounded py-1.5 ${settings.hd ? 'bg-gold text-forest' : 'bg-white/10 hover:bg-white/15'}`}
        >
          HD {settings.hd ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}

function FullDock(props: ViewerToolbarProps) {
  const {
    settings,
    showHelp,
    showSettings,
    onPatch,
    onReset,
    onZoomIn,
    onZoomOut,
    onScreenshot,
    onToggleFullscreen,
    onToggleHelp,
    onToggleSettings,
  } = props

  return (
    <>
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <IconButton onClick={onToggleHelp} active={showHelp} title="Помощь (?)">
          <HelpIcon />
        </IconButton>
        <IconButton onClick={onToggleSettings} active={showSettings} title="Настройки">
          <GearIcon />
        </IconButton>
        <IconButton
          onClick={() => onPatch({ wireframe: !settings.wireframe, showGrid: !settings.showGrid })}
          active={settings.wireframe || settings.showGrid}
          title="Слои (G/M)"
        >
          <LayersIcon />
        </IconButton>
        <IconButton
          onClick={() => onPatch({ flyMode: !settings.flyMode, autoRotate: false })}
          active={settings.flyMode}
          title="Режим полёта (F)"
        >
          <span className="text-[10px] font-bold">FLY</span>
        </IconButton>
        <IconButton
          onClick={() => onPatch({ autoRotate: !settings.autoRotate, flyMode: false })}
          active={settings.autoRotate}
          title="Авто-вращение (Space)"
        >
          <RotateIcon />
        </IconButton>
        <IconButton onClick={onScreenshot} title="Скриншот (P)">
          <span className="text-[10px] font-bold">PNG</span>
        </IconButton>
        <IconButton onClick={onToggleFullscreen} title="Полный экран">
          <FullscreenIcon />
        </IconButton>
      </div>

      {showSettings && (
        <div className="absolute inset-y-3 right-[4.25rem] z-20 flex w-72 max-w-[calc(100%-5rem)] flex-col justify-end pointer-events-none">
          <div className="pointer-events-auto max-h-full overflow-y-auto overscroll-contain">
            <SettingsPanel
              settings={settings}
              onPatch={onPatch}
              onReset={onReset}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
            />
          </div>
        </div>
      )}

      {showHelp && (
        <div className="absolute left-4 top-4 z-20 max-w-xs rounded-xl border border-white/10 bg-forest/90 p-4 text-xs text-ivory shadow-lg">
          <p className="mb-2 font-semibold">Управление</p>
          <ul className="space-y-1 text-ivory/75">
            <li>ЛКМ — вращение (360°, любой угол)</li>
            <li>Колесо — зум · ПКМ — пан</li>
            <li><strong>FLY</strong> — WASD Q/E · ЛКМ+drag смотреть (без roll)</li>
            <li><kbd className="rounded bg-white/10 px-1">F</kbd> полёт · <kbd className="rounded bg-white/10 px-1">R</kbd> сброс</li>
            <li><kbd className="rounded bg-white/10 px-1">G</kbd> сетка · <kbd className="rounded bg-white/10 px-1">M</kbd> каркас · <kbd className="rounded bg-white/10 px-1">P</kbd> скрин</li>
          </ul>
        </div>
      )}
    </>
  )
}

function CompactDock(props: ViewerToolbarProps) {
  const { settings, onPatch, onReset } = props
  return (
    <div className="absolute bottom-3 right-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <IconButton onClick={onReset} title="Сброс">
        <span className="text-sm">↺</span>
      </IconButton>
      <IconButton
        onClick={() => onPatch({ autoRotate: !settings.autoRotate })}
        active={settings.autoRotate}
        title="Тур"
      >
        <RotateIcon />
      </IconButton>
    </div>
  )
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <>
      {props.variant === 'compact' ? <CompactDock {...props} /> : <FullDock {...props} />}
      <div className="pointer-events-none absolute bottom-2 left-3 rounded bg-black/30 px-2 py-0.5 text-[10px] text-white/70">
        .glb viewer
      </div>
    </>
  )
}

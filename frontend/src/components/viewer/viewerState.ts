export type EnvironmentPreset = 'city' | 'sunset' | 'dawn' | 'warehouse' | 'park' | 'studio'

export interface ViewerSettings {
  autoRotate: boolean
  flyMode: boolean
  wireframe: boolean
  showGrid: boolean
  showShadows: boolean
  hd: boolean
  environment: EnvironmentPreset
  ambientIntensity: number
  directIntensity: number
  /** FLY: WASD/Q/E units per second */
  flyMoveSpeed: number
  /** FLY: LMB look sensitivity */
  flyLookSensitivity: number
  /** Orbit: LMB rotate */
  orbitRotateSpeed: number
  /** Orbit: RMB pan */
  orbitPanSpeed: number
  /** Orbit: wheel zoom */
  orbitZoomSpeed: number
  /** Orbit: auto-rotate speed */
  autoRotateSpeed: number
}

export const defaultViewerSettings: ViewerSettings = {
  autoRotate: false,
  flyMode: false,
  wireframe: false,
  showGrid: false,
  showShadows: true,
  hd: true,
  environment: 'city',
  ambientIntensity: 0.45,
  directIntensity: 1.1,
  flyMoveSpeed: 400,
  flyLookSensitivity: 0.0044,
  orbitRotateSpeed: 0.9,
  orbitPanSpeed: 1.4,
  orbitZoomSpeed: 1.1,
  autoRotateSpeed: 1.2,
}

export type ViewerVariant = 'compact' | 'full'
